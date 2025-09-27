import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { apiClient } from '../api/client';
import { ArrowLeftIcon } from '../components/icons';
import * as layoutStyles from '../components/layout/Layout.css';
import * as formStyles from '../styles/forms.css';

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
      <div className={layoutStyles.header}>
        <div>
          <button
            onClick={() => navigate('/sites')}
            className={formStyles.backButton}
          >
            <ArrowLeftIcon />
            Back to Sites
          </button>
          <h1 className={layoutStyles.pageTitle}>Create New Site</h1>
          <p className={layoutStyles.pageDescription}>
            Configure a new site for content management
          </p>
        </div>
      </div>

      {state.error && (
        <div className={formStyles.errorMessage}>
          {state.error}
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className={formStyles.errorDismissButton}
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={layoutStyles.card}>
          <div className={layoutStyles.cardHeader}>
            <h2 className={layoutStyles.cardTitle}>Basic Information</h2>
            <p className={layoutStyles.cardDescription}>
              Basic site configuration and repository details
            </p>
          </div>

          <div className={formStyles.formGrid}>
            <div className={formStyles.formGridTwoColumns}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Site Name *
                </label>
                <input
                  type="text"
                  value={state.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Website"
                  required
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Local Path *
                </label>
                <input
                  type="text"
                  value={state.localPath}
                  onChange={(e) => handleInputChange('localPath', e.target.value)}
                  placeholder="/path/to/site"
                  required
                  className={formStyles.input}
                />
              </div>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                Description
              </label>
              <textarea
                value={state.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A brief description of your site"
                rows={3}
                className={formStyles.textAreaLarge}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                GitHub Repository URL *
              </label>
              <input
                type="url"
                value={state.githubRepositoryUrl}
                onChange={(e) => handleInputChange('githubRepositoryUrl', e.target.value)}
                placeholder="https://github.com/username/repository"
                required
                className={formStyles.input}
              />
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={state.githubPat}
                onChange={(e) => handleInputChange('githubPat', e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className={formStyles.input}
              />
              <p className={formStyles.helpText}>
                Required for private repositories and push access. Generate at GitHub Settings → Developer settings → Personal access tokens.
              </p>
            </div>
          </div>
        </div>

        <div className={layoutStyles.card}>
          <div className={layoutStyles.cardHeader}>
            <h2 className={layoutStyles.cardTitle}>Build Configuration</h2>
            <p className={layoutStyles.cardDescription}>
              Optional build and deployment settings
            </p>
          </div>

          <div className={formStyles.formGrid}>
            <div className={formStyles.formGridTwoColumns}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Build Command
                </label>
                <input
                  type="text"
                  value={state.buildCommand}
                  onChange={(e) => handleInputChange('buildCommand', e.target.value)}
                  placeholder="npm run build"
                  className={formStyles.input}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Build Output Directory
                </label>
                <input
                  type="text"
                  value={state.buildOutputDir}
                  onChange={(e) => handleInputChange('buildOutputDir', e.target.value)}
                  placeholder="dist"
                  className={formStyles.input}
                />
              </div>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                Editable Paths
              </label>
              <input
                type="text"
                value={state.editablePaths}
                onChange={(e) => handleInputChange('editablePaths', e.target.value)}
                placeholder="content, posts, pages"
                className={formStyles.input}
              />
              <p className={formStyles.helpText}>
                Comma-separated list of directories that can be edited through the CMS (relative to site root).
              </p>
            </div>
          </div>
        </div>

        <div className={formStyles.formActions}>
          <button
            type="button"
            onClick={() => navigate('/sites')}
            disabled={state.loading}
            className={formStyles.secondaryButton}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={state.loading}
            className={formStyles.primaryButton}
          >
            {state.loading ? 'Creating...' : 'Create Site'}
          </button>
        </div>
      </form>
    </Layout>
  );
}