import { create } from "zustand";
import apiClient, { Site } from "../api/client";
import { useAuthStore } from "./authStore";

export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalUsers: number;
  recentActivity: Array<{
    id: string;
    type: 'site_created' | 'user_created' | 'deployment';
    message: string;
    timestamp: string;
  }>;
}

export interface DashboardState {
  sites: Site[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;

  loadData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sites: [],
  stats: {
    totalSites: 0,
    activeSites: 0,
    totalUsers: 0,
    recentActivity: []
  },
  loading: false,
  error: null,

  loadData: async () => {
    set({ loading: true, error: null });

    const user = useAuthStore.getState().user;

    try {
      // Load sites
      const sitesResponse = await apiClient.getSites({ limit: 10 });
      const sites = sitesResponse.items;

      // Calculate stats
      const activeSites = sites.filter(site => site.isActive).length;
      let totalUsers = 0;

      // Try to get user count if user has admin role
      if (user?.roles?.some(role => role === 'admin')) {
        try {
          const usersResponse = await apiClient.getUsers({ limit: 1 });
          totalUsers = usersResponse.pagination.total;
        } catch {
          // Ignore error for non-admin users
        }
      }

      // Set state with loaded data
      set({
        sites,
        stats: {
          totalSites: sites.length,
          activeSites,
          totalUsers,
          recentActivity: []
        },
        loading: false,
        error: null
      });
    } catch (error) {
      set({ loading: false, error: (error as any).message || 'Failed to load dashboard data' });
    }
  }
}));