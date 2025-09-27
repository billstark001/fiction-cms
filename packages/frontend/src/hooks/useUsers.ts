import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, CreateUserRequest, UpdateUserRequest } from '../api/client';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: string) => [...usersKeys.lists(), { filters }] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

// Get users list
export function useUsers(search?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: usersKeys.list(`search=${search}&page=${page}&limit=${limit}`),
    queryFn: () => apiClient.getUsers({ search, page, limit }),
    placeholderData: (previousData) => previousData, // TanStack Query v5 replacement for keepPreviousData
  });
}

// Get single user
export function useUser(userId: string) {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => apiClient.getUserById(userId),
    enabled: !!userId,
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserRequest) => apiClient.createUser(userData),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

// Update user mutation
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: UpdateUserRequest) => apiClient.updateUser(userId, updates),
    onSuccess: () => {
      // Invalidate both the specific user and the list
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}