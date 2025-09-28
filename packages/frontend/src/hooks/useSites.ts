import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, Site } from '../api/client';

// Query keys
export const sitesKeys = {
  all: ['sites'] as const,
  lists: () => [...sitesKeys.all, 'list'] as const,
  list: (filters: string) => [...sitesKeys.lists(), { filters }] as const,
  details: () => [...sitesKeys.all, 'detail'] as const,
  detail: (id: string) => [...sitesKeys.details(), id] as const,
};

// Get sites list
export function useSites(search?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: sitesKeys.list(`search=${search}&page=${page}&limit=${limit}`),
    queryFn: () => apiClient.getSites({ q: search, page, limit }),
    placeholderData: (previousData) => previousData, // TanStack Query v5 replacement for keepPreviousData
  });
}

// Get single site
export function useSite(siteId: string) {
  return useQuery({
    queryKey: sitesKeys.detail(siteId),
    queryFn: () => apiClient.getSiteById(siteId),
    enabled: !!siteId,
  });
}

// Create site mutation
export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (siteData: {
      name: string;
      description?: string;
      githubRepositoryUrl: string;
      githubPat: string;
      localPath: string;
      buildCommand?: string;
      buildOutputDir?: string;
      validateCommand?: string;
      editablePaths?: string;
      sqliteFiles?: any;
      modelFiles?: any;
      customFileTypes?: any;
      isActive?: boolean;
    }) => {
      // Transform string fields to arrays where needed
      const transformedData = {
        ...siteData,
        editablePaths: siteData.editablePaths ? 
          siteData.editablePaths.split(',').map(p => p.trim()).filter(p => p.length > 0) : 
          undefined,
        isActive: siteData.isActive ?? true,
      };
      
      return apiClient.createSite(transformedData);
    },
    onSuccess: () => {
      // Invalidate sites list to refetch
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
    },
  });
}

// Update site mutation
export function useUpdateSite(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Site>) => apiClient.updateSite(siteId, updates),
    onSuccess: () => {
      // Invalidate both the specific site and the list
      queryClient.invalidateQueries({ queryKey: sitesKeys.detail(siteId) });
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
    },
  });
}

// Delete site mutation
export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (siteId: string) => apiClient.deleteSite(siteId),
    onSuccess: () => {
      // Invalidate sites list
      queryClient.invalidateQueries({ queryKey: sitesKeys.lists() });
    },
  });
}