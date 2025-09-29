// stores/siteContentStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/client';
import { fileStorageService } from '../services/fileStorage';
import { useSiteManagerStore } from './siteManagerStore';

export type FileStatus = 'local' | 'remote' | 'committed';

interface FileItem {
  path: string;
  type: string; // Changed from union to string to support custom types
  size: number;
  lastModified: string;
}

export interface EnhancedFileItem extends FileItem {
  status: FileStatus;
  isDirty: boolean;
  localContent?: string;
  hasConflict?: boolean;
}

export interface SiteContentState {
  siteId: string;
  files: EnhancedFileItem[];
  loading: boolean;
  error: string | null;
  openedFiles: string[]; // Multiple opened files
  selectedFile: string | null;
  fileContent: string | null;
  loadingContent: boolean;
  searchQuery: string;
  filterType: string;
  previewVisible: boolean;
  gitStatus: {
    modifiedFiles: number;
    stagedFiles: number;
    lastPull?: string;
    lastCommit?: string;
  };
}

export interface SiteContentActions {
  // File operations
  loadFiles: () => Promise<void>;
  loadFileContent: (filePath: string) => Promise<void>;
  saveFileLocally: (content: string) => Promise<void>;
  saveFileToRemote: (filePath?: string) => Promise<void>;
  commitFiles: (filePaths: string[], message: string) => Promise<void>;
  
  // File management
  openFile: (filePath: string) => Promise<void>;
  closeFile: (filePath: string) => boolean; // returns true if closed, false if has unsaved changes
  switchToFile: (filePath: string) => void;
  
  // UI state
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string) => void;
  togglePreview: () => void;
  clearError: () => void;
  reset: () => void;
  getFilteredFiles: () => EnhancedFileItem[];
  
  // Git operations
  pullFromRemote: () => Promise<void>;
  checkForConflicts: () => Promise<void>;
  resolveConflict: (filePath: string, resolution: 'local' | 'remote' | 'manual', manualContent?: string) => Promise<void>;
}

const initialState: SiteContentState = {
  siteId: '',
  files: [],
  loading: false,
  error: null,
  openedFiles: [],
  selectedFile: null,
  fileContent: null,
  loadingContent: false,
  searchQuery: '',
  filterType: 'all',
  previewVisible: false,
  gitStatus: {
    modifiedFiles: 0,
    stagedFiles: 0
  }
};

export const createSiteContentStore = (siteId: string) => {
  return create<SiteContentState & SiteContentActions>((set, get) => ({
    ...initialState,
    siteId,

    loadFiles: async () => {
      const { siteId } = get();
      if (!siteId) return;

      try {
        set({ loading: true, error: null });
        
        // Initialize storage
        await fileStorageService.init();
        
        // Load files from API
        const response = await apiClient.getEditableFiles(siteId);
        
        // Load local files and merge status
        const localFiles = await fileStorageService.getAllFilesForSite(siteId);
        const localFilesMap = new Map(localFiles.map(f => [f.filePath, f]));
        
        const enhancedFiles: EnhancedFileItem[] = response.files.map(file => {
          const localFile = localFilesMap.get(file.path);
          return {
            ...file,
            status: localFile?.isDirty 
              ? 'local' as FileStatus
              : (localFile ? 'remote' as FileStatus : 'committed' as FileStatus),
            isDirty: localFile?.isDirty || false,
            localContent: localFile?.content,
            hasConflict: false
          };
        });

        set({
          files: enhancedFiles,
          loading: false
        });

        // Load git status
        await get().checkForConflicts();
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load files',
          loading: false
        });
      }
    },

    loadFileContent: async (filePath: string) => {
      const { siteId } = get();
      if (!siteId) return;

      try {
        set({ loadingContent: true });
        
        // Try to load from local storage first
        const localContent = await fileStorageService.getFileContent(siteId, filePath);
        
        if (localContent) {
          set({
            fileContent: localContent.content,
            selectedFile: filePath,
            loadingContent: false
          });
        } else {
          // Load from remote API
          const response = await apiClient.getFileContent(siteId, filePath);
          set({
            fileContent: response.content.content,
            selectedFile: filePath,
            loadingContent: false
          });
          
          // Save to local storage for future use
          await fileStorageService.saveFileContent(
            siteId, 
            filePath, 
            response.content.content,
            response.content.lastModified
          );
        }
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load file content',
          loadingContent: false
        });
      }
    },

    saveFileLocally: async (content: string) => {
      const { siteId, selectedFile } = get();
      if (!siteId || !selectedFile) return;

      try {
        await fileStorageService.saveFileContent(siteId, selectedFile, content);
        set({ fileContent: content });
        
        // Update file status
        const { files } = get();
        const updatedFiles = files.map(file => 
          file.path === selectedFile 
            ? { ...file, status: 'local' as FileStatus, isDirty: true, localContent: content }
            : file
        );
        set({ files: updatedFiles });

        // Update site manager store
        const siteManagerStore = useSiteManagerStore.getState();
        siteManagerStore.updateSiteState(siteId, { isDirty: true });
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to save file locally'
        });
      }
    },

    saveFileToRemote: async (filePath?: string) => {
      const { siteId, files } = get();
      if (!siteId) return;

      try {
        // Save all dirty files if no specific file is provided
        const filesToSave = filePath 
          ? files.filter(f => f.path === filePath && f.isDirty)
          : files.filter(f => f.isDirty);

        if (filesToSave.length === 0) {
          set({ error: 'No files to save' });
          return;
        }

        // Check for conflicts before saving
        await get().checkForConflicts();

        for (const file of filesToSave) {
          if (file.hasConflict) {
            set({ error: `File ${file.path} has conflicts. Please resolve them first.` });
            return;
          }

          if (file.localContent) {
            await apiClient.updateFileContent(siteId, file.path, file.localContent);
            
            // Mark as remote saved
            await fileStorageService.markFileAsClean(siteId, file.path, new Date().toISOString());
          }
        }

        // Update file statuses
        const updatedFiles = files.map(file => {
          const wasSaved = filesToSave.some(f => f.path === file.path);
          return wasSaved 
            ? { ...file, status: 'remote' as FileStatus, isDirty: false }
            : file;
        });
        
        set({ files: updatedFiles });

        // Update site manager store
        const hasDirtyFiles = updatedFiles.some(f => f.isDirty);
        const siteManagerStore = useSiteManagerStore.getState();
        siteManagerStore.updateSiteState(siteId, { isDirty: hasDirtyFiles });
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to save files to remote'
        });
      }
    },

    commitFiles: async (filePaths: string[], message: string) => {
      const { siteId } = get();
      if (!siteId) return;

      try {
        // This would call the backend commit API
        // Implementation depends on backend API structure
        console.log('Committing files:', filePaths, 'with message:', message);
        
        // After successful commit, update file statuses
        const { files } = get();
        const updatedFiles = files.map(file => 
          filePaths.includes(file.path) 
            ? { ...file, status: 'committed' as FileStatus }
            : file
        );
        set({ files: updatedFiles });
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to commit files'
        });
      }
    },

    openFile: async (filePath: string) => {
      const { openedFiles } = get();
      if (!openedFiles.includes(filePath)) {
        set({ openedFiles: [...openedFiles, filePath] });
      }
      
      await get().loadFileContent(filePath);
      get().switchToFile(filePath);
    },

    closeFile: (filePath: string): boolean => {
      const { files, openedFiles, selectedFile } = get();
      const fileToClose = files.find(f => f.path === filePath);
      
      // Check if file has unsaved changes
      if (fileToClose?.isDirty) {
        return false; // Don't close, has unsaved changes
      }

      const updatedOpenedFiles = openedFiles.filter(f => f !== filePath);
      
      // If closing the selected file, select another one or null
      let newSelectedFile = selectedFile;
      if (selectedFile === filePath) {
        newSelectedFile = updatedOpenedFiles.length > 0 
          ? updatedOpenedFiles[updatedOpenedFiles.length - 1] 
          : null;
        
        if (newSelectedFile) {
          get().loadFileContent(newSelectedFile);
        } else {
          set({ fileContent: null });
        }
      }

      set({ 
        openedFiles: updatedOpenedFiles,
        selectedFile: newSelectedFile
      });
      
      return true;
    },

    switchToFile: (filePath: string) => {
      const { openedFiles } = get();
      if (openedFiles.includes(filePath)) {
        get().loadFileContent(filePath);
      }
    },

    pullFromRemote: async () => {
      const { siteId } = get();
      if (!siteId) return;

      try {
        // This would trigger git pull on backend
        console.log('Pulling from remote for site:', siteId);
        
        // After pull, reload files and check for conflicts
        await get().loadFiles();
        await get().checkForConflicts();
        
        await fileStorageService.updateGitPullTimestamp(siteId);
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to pull from remote'
        });
      }
    },

    checkForConflicts: async () => {
      const { siteId, files } = get();
      if (!siteId) return;

      try {
        // Create remote files map from current files
        const remoteFiles: Record<string, string> = {};
        files.forEach(file => {
          remoteFiles[file.path] = file.lastModified;
        });

        const { conflicts } = await fileStorageService.detectConflicts(siteId, remoteFiles);
        
        if (conflicts.length > 0) {
          // Mark files with conflicts
          const updatedFiles = files.map(file => ({
            ...file,
            hasConflict: conflicts.some(c => c.filePath === file.path)
          }));
          
          set({ files: updatedFiles });
        }
        
      } catch (error) {
        console.error('Failed to check for conflicts:', error);
      }
    },

    resolveConflict: async (filePath: string, resolution: 'local' | 'remote' | 'manual', manualContent?: string) => {
      const { siteId } = get();
      if (!siteId) return;

      try {
        let resolvedContent: string;

        if (resolution === 'local') {
          const localFile = await fileStorageService.getFileContent(siteId, filePath);
          resolvedContent = localFile?.content || '';
        } else if (resolution === 'remote') {
          const response = await apiClient.getFileContent(siteId, filePath);
          resolvedContent = response.content.content;
        } else {
          resolvedContent = manualContent || '';
        }

        // Save resolved content
        await fileStorageService.saveFileContent(siteId, filePath, resolvedContent);
        
        // Update file status
        const { files } = get();
        const updatedFiles = files.map(file => 
          file.path === filePath 
            ? { ...file, hasConflict: false, localContent: resolvedContent, isDirty: true }
            : file
        );
        set({ files: updatedFiles });

        // If this is the selected file, update content
        const { selectedFile } = get();
        if (selectedFile === filePath) {
          set({ fileContent: resolvedContent });
        }
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to resolve conflict'
        });
      }
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setFilterType: (type: string) => {
      set({ filterType: type });
    },

    togglePreview: () => {
      const { previewVisible } = get();
      set({ previewVisible: !previewVisible });
    },

    clearError: () => {
      set({ error: null });
    },

    reset: () => {
      set({ ...initialState, siteId: get().siteId });
    },

    getFilteredFiles: () => {
      const { files, searchQuery, filterType } = get();
      return files.filter(file => {
        const matchesSearch = file.path.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || file.type === filterType;
        return matchesSearch && matchesFilter;
      });
    }
  }));
};

export type SiteContentStore = ReturnType<typeof createSiteContentStore>;

export const useDefaultSiteContentState = (): SiteContentState & SiteContentActions => ({
  siteId: '',
  files: [],
  loading: false,
  error: null,
  openedFiles: [],
  selectedFile: null,
  fileContent: null,
  loadingContent: false,
  searchQuery: '',
  filterType: 'all',
  previewVisible: false,
  gitStatus: {
    modifiedFiles: 0,
    stagedFiles: 0
  },
  loadFiles: async () => { },
  loadFileContent: async () => { },
  saveFileLocally: async () => { },
  saveFileToRemote: async () => { },
  commitFiles: async () => { },
  openFile: async () => { },
  closeFile: () => false,
  switchToFile: () => { },
  setSearchQuery: () => { },
  setFilterType: () => { },
  togglePreview: () => { },
  clearError: () => { },
  getFilteredFiles: () => [],
  reset: () => { },
  pullFromRemote: async () => { },
  checkForConflicts: async () => { },
  resolveConflict: async () => { },
});