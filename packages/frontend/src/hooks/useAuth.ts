import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, LoginRequest } from '../api/client';
import { useAuthStore } from '../store/authStore';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

// Get current user query
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => apiClient.getCurrentUser(),
    enabled: isAuthenticated,
    retry: false, // Don't retry auth failures
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.login(credentials);
      
      // Update auth store
      login(credentials);
      
      return response;
    },
    onSuccess: (data) => {
      // Set user data in query cache
      queryClient.setQueryData(authKeys.user(), data.user);
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Clear auth store and all cached data
      logout();
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear local state even if server request fails
      logout();
      queryClient.clear();
    },
  });
}

// Check auth mutation (for silent auth checks)
export function useCheckAuth() {
  const queryClient = useQueryClient();
  const { checkAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => checkAuth(),
    onSuccess: (isAuthenticated) => {
      if (isAuthenticated) {
        // Refetch user data if authenticated
        queryClient.invalidateQueries({ queryKey: authKeys.user() });
      }
    },
    onError: () => {
      // Clear auth state on error
      const { logout } = useAuthStore.getState();
      logout();
      queryClient.clear();
    },
  });
}