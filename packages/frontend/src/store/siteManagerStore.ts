import { create } from 'zustand';
import { fileStorageService } from '../services/fileStorage';

export interface OpenedSite {
  siteId: string;
  siteName?: string;
  openedFiles: string[];
  selectedFile: string | null;
  lastAccessed: string;
  isDirty: boolean; // Has unsaved changes
}

interface SiteManagerState {
  openedSites: OpenedSite[];
  loading: boolean;
  error: string | null;
}

interface SiteManagerActions {
  loadOpenedSites: () => Promise<void>;
  openSite: (siteId: string, siteName?: string) => Promise<void>;
  closeSite: (siteId: string) => Promise<void>;
  updateSiteState: (siteId: string, updates: Partial<OpenedSite>) => void;
  getSiteState: (siteId: string) => OpenedSite | null;
  clearError: () => void;
}

export const useSiteManagerStore = create<SiteManagerState & SiteManagerActions>((set, get) => ({
  openedSites: [],
  loading: false,
  error: null,

  loadOpenedSites: async () => {
    try {
      set({ loading: true, error: null });
      
      // Initialize storage service if needed
      await fileStorageService.init();
      
      // Get all opened sites from storage
      const storedSites = await fileStorageService.getAllOpenedSites();
      
      const openedSites: OpenedSite[] = storedSites.map(site => ({
        siteId: site.siteId,
        openedFiles: site.openedFiles,
        selectedFile: site.selectedFile,
        lastAccessed: site.lastAccessed,
        isDirty: false // This will be updated by individual site stores
      }));

      set({ openedSites, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load opened sites',
        loading: false
      });
    }
  },

  openSite: async (siteId: string, siteName?: string) => {
    try {
      await fileStorageService.init();
      
      const { openedSites } = get();
      const existingSite = openedSites.find(site => site.siteId === siteId);
      
      if (existingSite) {
        // Update last accessed time
        const updatedSites = openedSites.map(site => 
          site.siteId === siteId 
            ? { ...site, lastAccessed: new Date().toISOString() }
            : site
        );
        set({ openedSites: updatedSites });
      } else {
        // Add new opened site
        const newSite: OpenedSite = {
          siteId,
          siteName,
          openedFiles: [],
          selectedFile: null,
          lastAccessed: new Date().toISOString(),
          isDirty: false
        };
        
        set({ openedSites: [...openedSites, newSite] });
      }

      // Update storage
      await fileStorageService.saveSiteState(siteId, {
        openedFiles: existingSite?.openedFiles || [],
        selectedFile: existingSite?.selectedFile || null
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to open site'
      });
    }
  },

  closeSite: async (siteId: string) => {
    try {
      const { openedSites } = get();
      const siteToClose = openedSites.find(site => site.siteId === siteId);
      
      if (siteToClose?.isDirty) {
        // This should be handled by the UI with a confirmation dialog
        throw new Error('Cannot close site with unsaved changes');
      }

      // Remove from opened sites
      const updatedSites = openedSites.filter(site => site.siteId !== siteId);
      set({ openedSites: updatedSites });

      // Clear from storage
      await fileStorageService.clearSiteData(siteId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to close site'
      });
    }
  },

  updateSiteState: (siteId: string, updates: Partial<OpenedSite>) => {
    const { openedSites } = get();
    const updatedSites = openedSites.map(site => 
      site.siteId === siteId 
        ? { ...site, ...updates, lastAccessed: new Date().toISOString() }
        : site
    );
    set({ openedSites: updatedSites });
  },

  getSiteState: (siteId: string) => {
    const { openedSites } = get();
    return openedSites.find(site => site.siteId === siteId) || null;
  },

  clearError: () => {
    set({ error: null });
  }
}));