import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { apiClient, Site } from '../api/client';
import { useAuth } from '../store/authStore';
import * as styles from '../components/layout/Layout.css';

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
  const navigate = useNavigate();
  const [state, setState] = useState<SiteListState>({
    sites: [],
    loading: true,
    error: null,
    total: 0,
    page: 1,
    totalPages: 1,
    searchQuery: ''
  });

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
        sites: response.sites,
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
    navigate(`/sites/${siteId}/manage`);
  };

  const isAdmin = user?.roles?.some(role => role === 'admin') ?? false;

  if (state.loading && state.sites.length === 0) {
    return (
      <Layout>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#6b7280'
        }}>
          Loading sites...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Site Management</h1>
          <p className={styles.pageDescription}>
            Manage your websites and their content
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/sites/create')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 'medium',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Create New Site
          </button>
        )}
      </div>

      {state.error && (
        <div className={styles.card} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ color: '#dc2626', padding: '1rem', textAlign: 'center' }}>
            Error: {state.error}
          </div>
        </div>
      )}

      <div className={styles.card}>
        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search sites by name, repository, or path..."
            value={state.searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.15s ease-in-out',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
            }}
          />
        </div>

        {/* Sites List */}
        {state.sites.length === 0 && !state.loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#6b7280' 
          }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              {state.searchQuery ? 'No sites found' : 'No sites yet'}
            </h3>
            <p>
              {state.searchQuery 
                ? 'Try adjusting your search terms.'
                : 'Create your first site to get started with content management.'
              }
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {state.sites.map(site => (
              <div 
                key={site.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'all 0.15s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleManageSite(site.id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      color: '#111827', 
                      margin: '0 0 0.5rem 0' 
                    }}>
                      {site.name}
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      margin: '0 0 0.5rem 0' 
                    }}>
                      {site.description || 'No description'}
                    </p>
                    <a 
                      href={site.githubRepositoryUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        fontSize: '0.75rem', 
                        color: '#2563eb', 
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <span>View Repository</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 'medium',
                      backgroundColor: site.isActive ? '#dcfce7' : '#fee2e2',
                      color: site.isActive ? '#166534' : '#991b1b'
                    }}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageSite(site.id);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      Manage
                    </button>
                  </div>
                </div>

                {/* Site Info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  <div>
                    <span style={{ fontWeight: 'medium' }}>Local Path:</span>{' '}
                    <code style={{ 
                      backgroundColor: '#f3f4f6', 
                      padding: '0.125rem 0.25rem', 
                      borderRadius: '0.25rem',
                      fontFamily: 'monospace'
                    }}>
                      {site.localPath}
                    </code>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'medium' }}>Created:</span>{' '}
                    {new Date(site.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div style={{ 
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => handlePageChange(state.page - 1)}
              disabled={state.page <= 1}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: state.page <= 1 ? '#f3f4f6' : '#2563eb',
                color: state.page <= 1 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: state.page <= 1 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease-in-out',
              }}
            >
              Previous
            </button>
            
            <span style={{ 
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: '#374151'
            }}>
              Page {state.page} of {state.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(state.page + 1)}
              disabled={state.page >= state.totalPages}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: state.page >= state.totalPages ? '#f3f4f6' : '#2563eb',
                color: state.page >= state.totalPages ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: state.page >= state.totalPages ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease-in-out',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {state.loading && state.sites.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: '#6b7280'
        }}>
          Loading...
        </div>
      )}
    </Layout>
  );
}