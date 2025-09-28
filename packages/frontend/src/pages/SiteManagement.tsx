import { useState, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import Layout from '../components/layout/Layout';
import { apiClient, Site, UpdateSiteRequest } from '../api/client';
import { useUpdateSite } from '../hooks/useSites';
import { SiteEditorForm } from '../components/sites/SiteEditorForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody
} from '../components/ui/Dialog';
import { useAuth } from '../store/authStore';
import { ExternalLinkIcon } from '../components/icons';
import * as layoutStyles from '../components/layout/Layout.css';
import * as siteStyles from './SiteManagement.css';
import * as pageStyles from '../styles/pages.css';
import * as formStyles from '../styles/forms.css';

interface SiteListState {
  sites: Site[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  searchQuery: string;
}

export default function SiteManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<SiteListState>({
    sites: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    totalPages: 1,
    searchQuery: ''
  });
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const updateSiteMutation = useUpdateSite(editingSite?.id ?? '');

  useEffect(() => {
    loadSites();
  }, [state.page, state.searchQuery]);

  const loadSites = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params: any = {
        page: state.page,
        limit: 10
      };

      if (state.searchQuery.trim()) {
        params.q = state.searchQuery.trim();
      }

      const response = await apiClient.getSites(params);

      setState(prev => ({
        ...prev,
        sites: response.items,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sites',
        loading: false
      }));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      searchQuery: e.target.value,
      page: 1 // Reset to first page when searching
    }));
  };

  const handlePageChange = (newPage: number) => {
    setState(prev => ({ ...prev, page: newPage }));
  };

  const handleManageSite = (siteId: string) => {
    router.navigate({ to: `/sites/${siteId}/manage` });
  };

  const handleEditSite = (site: Site) => {
    setEditError(null);
    updateSiteMutation.reset();
    setEditingSite(site);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setEditingSite(null);
      setEditError(null);
      updateSiteMutation.reset();
    }
  };

  const handleUpdateSubmit = async (updates: UpdateSiteRequest) => {
    if (!editingSite) {
      return;
    }

    setEditError(null);

    try {
      const updatedSite = await updateSiteMutation.mutateAsync(updates);
      setState((prev) => ({
        ...prev,
        sites: prev.sites.map((site) => (site.id === updatedSite.id ? updatedSite : site))
      }));
      handleDialogChange(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update site');
    }
  };

  const isAdmin = user?.roles?.some(role => role === 'admin') ?? false;
  const dialogError =
    editError ?? (updateSiteMutation.error instanceof Error ? updateSiteMutation.error.message : null);

  if (state.loading && state.sites.length === 0) {
    return (
      <Layout>
        <div className={siteStyles.loadingContainer}>
          Loading sites...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={layoutStyles.header}>
        <div>
          <h1 className={layoutStyles.pageTitle}>Site Management</h1>
          <p className={layoutStyles.pageDescription}>
            Manage your websites and their content
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => router.navigate({ to: '/sites/create' })}
            className={siteStyles.createSiteButton}
          >
            Create New Site
          </button>
        )}
      </div>

      {state.error && (
        <div className={formStyles.errorMessage}>
          Error: {state.error}
        </div>
      )}

      <div className={layoutStyles.card}>
        {/* Search Bar */}
        <div className={siteStyles.siteSearchContainer}>
          <input
            type="text"
            placeholder="Search sites by name, repository, or path..."
            value={state.searchQuery}
            onChange={handleSearchChange}
            className={pageStyles.searchInput}
          />
        </div>

        {/* Sites List */}
        {state.sites.length === 0 && !state.loading ? (
          <div className={siteStyles.emptyStateContainer}>
            <h3 className={siteStyles.emptyStateTitle}>
              {state.searchQuery ? 'No sites found' : 'No sites yet'}
            </h3>
            <p className={siteStyles.emptyStateText}>
              {state.searchQuery
                ? 'Try adjusting your search terms.'
                : 'Create your first site to get started with content management.'
              }
            </p>
          </div>
        ) : (
          <div className={siteStyles.siteGrid}>
            {state.sites.map(site => (
              <div
                key={site.id}
                className={siteStyles.siteItem}
                onClick={() => handleManageSite(site.id)}
              >
                <div className={siteStyles.siteItemHeader}>
                  <div className={siteStyles.siteItemInfo}>
                    <h3 className={siteStyles.siteItemTitle}>
                      {site.name}
                    </h3>
                    <p className={siteStyles.siteItemDescription}>
                      {site.description || 'No description'}
                    </p>
                    <a
                      href={site.githubRepositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={siteStyles.externalLink}
                    >
                      <span>View Repository</span>
                      <ExternalLinkIcon />
                    </a>
                  </div>

                  <div className={siteStyles.siteItemActions}>
                    <span className={site.isActive ? siteStyles.statusBadgeActive : siteStyles.statusBadgeInactive}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSite(site);
                        }}
                        className={siteStyles.editButton}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageSite(site.id);
                      }}
                      className={siteStyles.manageButton}
                    >
                      Manage
                    </button>
                  </div>
                </div>

                {/* Site Info */}
                <div className={siteStyles.siteItemMeta}>
                  <div>
                    <span className={siteStyles.siteMetaText}>Local Path:</span>{' '}
                    <code className={siteStyles.siteCodeBlock}>
                      {site.localPath}
                    </code>
                  </div>
                  <div>
                    <span className={siteStyles.siteMetaText}>Created:</span>{' '}
                    {new Date(site.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div className={siteStyles.paginationContainer}>
            <button
              onClick={() => handlePageChange(state.page - 1)}
              disabled={state.page <= 1}
              className={state.page <= 1 ? siteStyles.paginationButtonDisabled : siteStyles.paginationButtonEnabled}
            >
              Previous
            </button>

            <span className={siteStyles.paginationInfo}>
              Page {state.page} of {state.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(state.page + 1)}
              disabled={state.page >= state.totalPages}
              className={state.page >= state.totalPages ? siteStyles.paginationButtonDisabled : siteStyles.paginationButtonEnabled}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {state.loading && state.sites.length > 0 && (
        <div className={siteStyles.loadingOverlay}>
          Loading...
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent size="full">
          <DialogHeader>
            <DialogTitle>Edit site</DialogTitle>
            <DialogDescription>
              Update repository, build, and editor settings for this site.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {editingSite && (
              <SiteEditorForm
                mode="edit"
                initialSite={editingSite}
                onSubmit={handleUpdateSubmit}
                onCancel={() => handleDialogChange(false)}
                isSubmitting={updateSiteMutation.isPending}
                error={dialogError}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}