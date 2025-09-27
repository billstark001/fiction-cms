import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { apiClient } from '../api/client';
import * as styles from '../components/layout/Layout.css';

interface SiteFormState {
  name: string;
  description: string;
  githubRepositoryUrl: string;
  githubPat: string;
  localPath: string;
  buildCommand: string;
  buildOutputDir: string;
  editablePaths: string;
  loading: boolean;
  error: string | null;
}

export default function CreateSite() {
  const navigate = useNavigate();
  const [state, setState] = useState<SiteFormState>({
    name: '',
    description: '',
    githubRepositoryUrl: '',
    githubPat: '',
    localPath: '',
    buildCommand: '',
    buildOutputDir: '',
    editablePaths: '',
    loading: false,
    error: null
  });

  const handleInputChange = (field: keyof SiteFormState, value: string) => {
    setState(prev => ({ ...prev, [field]: value, error: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.name.trim() || !state.githubRepositoryUrl.trim() || !state.localPath.trim()) {
      setState(prev => ({ ...prev, error: 'Name, GitHub Repository URL, and Local Path are required' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const siteData = {
        name: state.name.trim(),
        description: state.description.trim() || undefined,
        githubRepositoryUrl: state.githubRepositoryUrl.trim(),
        githubPat: state.githubPat.trim(),
        localPath: state.localPath.trim(),
        buildCommand: state.buildCommand.trim() || undefined,
        buildOutputDir: state.buildOutputDir.trim() || undefined,
        editablePaths: state.editablePaths.trim() 
          ? state.editablePaths.split(',').map(p => p.trim()).filter(p => p)
          : []
      };

      const response = await apiClient.createSite(siteData as any);
      console.log('Site created successfully:', response);
      navigate('/sites');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create site',
        loading: false
      }));
    }
  };

  return (
    <Layout>
      <div className={styles.header}>
        <div>
          <button
            onClick={() => navigate('/sites')}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              padding: 0,
              marginBottom: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Sites
          </button>
          <h1 className={styles.pageTitle}>Create New Site</h1>
          <p className={styles.pageDescription}>
            Configure a new site for content management
          </p>
        </div>
      </div>

      {state.error && (
        <div className={styles.card} style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ color: '#dc2626', padding: '1rem', textAlign: 'center' }}>
            {state.error}
            <button
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              style={{
                marginLeft: '1rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid #dc2626',
                borderRadius: '0.25rem',
                color: '#dc2626',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Basic Information</h2>
            <p className={styles.cardDescription}>
              Basic site configuration and repository details
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Site Name *
                </label>
                <input
                  type="text"
                  value={state.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Website"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Local Path *
                </label>
                <input
                  type="text"
                  value={state.localPath}
                  onChange={(e) => handleInputChange('localPath', e.target.value)}
                  placeholder="/path/to/site"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Description
              </label>
              <textarea
                value={state.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A brief description of your site"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                GitHub Repository URL *
              </label>
              <input
                type="url"
                value={state.githubRepositoryUrl}
                onChange={(e) => handleInputChange('githubRepositoryUrl', e.target.value)}
                placeholder="https://github.com/username/repository"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={state.githubPat}
                onChange={(e) => handleInputChange('githubPat', e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.5rem' 
              }}>
                Required for private repositories and push access. Generate at GitHub Settings → Developer settings → Personal access tokens.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Build Configuration</h2>
            <p className={styles.cardDescription}>
              Optional build and deployment settings
            </p>
          </div>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Build Command
                </label>
                <input
                  type="text"
                  value={state.buildCommand}
                  onChange={(e) => handleInputChange('buildCommand', e.target.value)}
                  placeholder="npm run build"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'medium',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Build Output Directory
                </label>
                <input
                  type="text"
                  value={state.buildOutputDir}
                  onChange={(e) => handleInputChange('buildOutputDir', e.target.value)}
                  placeholder="dist"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Editable Paths
              </label>
              <input
                type="text"
                value={state.editablePaths}
                onChange={(e) => handleInputChange('editablePaths', e.target.value)}
                placeholder="content, posts, pages"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.5rem' 
              }}>
                Comma-separated list of directories that can be edited through the CMS (relative to site root).
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => navigate('/sites')}
            disabled={state.loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 'medium',
              cursor: state.loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease-in-out',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={state.loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: state.loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 'medium',
              cursor: state.loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease-in-out',
              minWidth: '120px'
            }}
          >
            {state.loading ? 'Creating...' : 'Create Site'}
          </button>
        </div>
      </form>
    </Layout>
  );
}