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

export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
};

// Get users list
export function useUsers(search?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: usersKeys.list(`search=${search}&page=${page}&limit=${limit}`),
    queryFn: () => apiClient.getUsers({ search, page, limit }),
    placeholderData: (previousData) => previousData, // TanStack Query v5 replacement for keepPreviousData
  });
}

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.lists(),
    queryFn: () => apiClient.getRoles(),
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
export function useUserOperations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (userData: CreateUserRequest) => apiClient.createUser(userData),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });

  const updateUser = useMutation({
    mutationFn: (updates: UpdateUserRequest & { id: string }) => apiClient.updateUser(updates.id, updates),
    onSuccess: (user) => {
      // Invalidate both the specific user and the list
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(user.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });

  return { createUser, updateUser, deleteUser };
}