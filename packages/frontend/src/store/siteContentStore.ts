// stores/siteContentStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/client';

interface FileItem {
  path: string;
  type: 'markdown' | 'json' | 'sqlite' | 'asset';
  size: number;
  lastModified: string;
}

export interface SiteContentState {
  siteId: string;
  files: FileItem[];
  loading: boolean;
  error: string | null;
  selectedFile: string | null;
  fileContent: string | null;
  loadingContent: boolean;
  searchQuery: string;
  filterType: string;
}

export interface SiteContentActions {
  loadFiles: () => Promise<void>;
  loadFileContent: (filePath: string) => Promise<void>;
  saveFile: (content: string, commitMessage?: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: string) => void;
  clearError: () => void;
  reset: () => void;
  getFilteredFiles: () => FileItem[];
}

const initialState: SiteContentState = {
  siteId: '',
  files: [],
  loading: false,
  error: null,
  selectedFile: null,
  fileContent: null,
  loadingContent: false,
  searchQuery: '',
  filterType: 'all'
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
        const response = await apiClient.getEditableFiles(siteId);
        set({
          files: response.files,
          loading: false
        });
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
        const response = await apiClient.getFileContent(siteId, filePath);
        set({
          fileContent: response.content,
          selectedFile: filePath,
          loadingContent: false
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load file content',
          loadingContent: false
        });
      }
    },

    saveFile: async (content: string, commitMessage?: string) => {
      const { siteId, selectedFile } = get();
      if (!siteId || !selectedFile) return;

      try {
        await apiClient.updateFileContent(siteId, selectedFile, content, commitMessage);
        set({ fileContent: content });
        console.log('File saved successfully');
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to save file'
        });
      }
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    setFilterType: (type: string) => {
      set({ filterType: type });
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
  selectedFile: null,
  fileContent: null,
  loadingContent: false,
  searchQuery: '',
  filterType: 'all',
  loadFiles: async () => { },
  loadFileContent: async () => { },
  saveFile: async () => { },
  setSearchQuery: () => { },
  setFilterType: () => { },
  clearError: () => { },
  getFilteredFiles: () => [],
  reset: () => { },
});