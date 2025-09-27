/**
 * Authentication store using Zustand for state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, apiClient } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.login(credentials);
          set({ 
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return true;
        } catch (error) {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed'
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        set({ isLoading: true });

        try {
          await apiClient.logout();
        } catch (error) {
          // Log error but don't fail logout
          console.error('Logout error:', error);
        } finally {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      getCurrentUser: async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
          const user = await apiClient.getCurrentUser();
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          // If we can't get current user, clear auth state
          apiClient.clearAccessToken();
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null // Don't show error for silent auth check
          });
        }
      },

      clearError: (): void => {
        set({ error: null });
      },

      checkAuth: async (): Promise<boolean> => {
        // Check if localStorage is available and get token safely
        const token = typeof window !== 'undefined' && window.localStorage 
          ? localStorage.getItem('fiction_cms_access_token')
          : null;
        
        if (!token || token === 'undefined') {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          return false;
        }

        // Try to get current user to verify token
        await get().getCurrentUser();
        return get().isAuthenticated;
      }
    }),
    {
      name: 'fiction-cms-auth',
      // Only persist non-sensitive data
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook for authentication status
export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error } = useAuthStore();
  return { user, isAuthenticated, isLoading, error };
};

// Hook for authentication actions
export const useAuthActions = () => {
  const { login, logout, getCurrentUser, clearError, checkAuth } = useAuthStore();
  return { login, logout, getCurrentUser, clearError, checkAuth };
};