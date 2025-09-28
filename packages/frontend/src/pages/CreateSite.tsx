import { useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import Layout from '../components/layout/Layout';
import { useCreateSite } from '../hooks/useSites';
import { ArrowLeftIcon } from '../components/icons';
import * as layoutStyles from '../components/layout/Layout.css';
import * as formStyles from '../styles/forms.css';

interface SiteFormData {
  name: string;
  description: string;
  githubRepositoryUrl: string;
  githubPat: string;
  localPath: string;
  buildCommand: string;
  buildOutputDir: string;
  validateCommand: string;
  editablePaths: string;
  sqliteFiles: string; // JSON string representation
  modelFiles: string; // JSON string representation  
  customFileTypes: string; // JSON string representation
}

export default function CreateSite() {
  const router = useRouter();
  const createSiteMutation = useCreateSite();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<SiteFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      githubRepositoryUrl: '',
      githubPat: '',
      localPath: '',
      buildCommand: '',
      buildOutputDir: '',
      validateCommand: '',
      editablePaths: '',
      sqliteFiles: '[]',
      modelFiles: '[]',
      customFileTypes: '[]',
    },
  });

  const onSubmit = async (data: SiteFormData) => {
    try {
      // Parse JSON fields with validation
      let sqliteFiles, modelFiles, customFileTypes;
      
      try {
        sqliteFiles = data.sqliteFiles?.trim() ? JSON.parse(data.sqliteFiles) : undefined;
      } catch (e) {
        setError('sqliteFiles', { message: 'Invalid JSON format for SQLite files configuration' });
        return;
      }
      
      try {
        modelFiles = data.modelFiles?.trim() ? JSON.parse(data.modelFiles) : undefined;
      } catch (e) {
        setError('modelFiles', { message: 'Invalid JSON format for model files configuration' });
        return;
      }
      
      try {
        customFileTypes = data.customFileTypes?.trim() ? JSON.parse(data.customFileTypes) : undefined;
      } catch (e) {
        setError('customFileTypes', { message: 'Invalid JSON format for custom file types configuration' });
        return;
      }

      await createSiteMutation.mutateAsync({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        githubRepositoryUrl: data.githubRepositoryUrl.trim(),
        githubPat: data.githubPat.trim(),
        localPath: data.localPath.trim(),
        buildCommand: data.buildCommand?.trim() || undefined,
        buildOutputDir: data.buildOutputDir?.trim() || undefined,
        validateCommand: data.validateCommand?.trim() || undefined,
        editablePaths: data.editablePaths?.trim() || undefined,
        sqliteFiles,
        modelFiles,
        customFileTypes,
      });
      
      // Navigate back to sites list on success
      router.navigate({ to: '/sites' });
    } catch (error) {
      console.error('Create site error:', error);
      setError('root', {
        message: error instanceof Error ? error.message : 'Failed to create site'
      });
    }
  };

  return (
    <Layout>
      <div className={layoutStyles.header}>
        <div>
          <button
            onClick={() => router.navigate({ to: '/sites' })}
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

      {(errors.root || createSiteMutation.error) && (
        <div className={formStyles.errorMessage}>
          {errors.root?.message || (createSiteMutation.error as Error)?.message || 'Failed to create site'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
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
                  {...register('name', {
                    required: 'Site name is required',
                    validate: value => value.trim().length > 0 || 'Site name cannot be empty'
                  })}
                  placeholder="My Website"
                  className={formStyles.input}
                />
                {errors.name && (
                  <div className={formStyles.errorMessage}>
                    {errors.name.message}
                  </div>
                )}
              </div>

              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>
                  Local Path *
                </label>
                <input
                  type="text"
                  {...register('localPath', {
                    required: 'Local path is required',
                    validate: value => value.trim().length > 0 || 'Local path cannot be empty'
                  })}
                  placeholder="/path/to/site"
                  className={formStyles.input}
                />
                {errors.localPath && (
                  <div className={formStyles.errorMessage}>
                    {errors.localPath.message}
                  </div>
                )}
              </div>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                Description
              </label>
              <textarea
                {...register('description')}
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
                {...register('githubRepositoryUrl', {
                  required: 'GitHub repository URL is required',
                  pattern: {
                    value: /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/,
                    message: 'Please enter a valid GitHub repository URL'
                  }
                })}
                placeholder="https://github.com/username/repository"
                className={formStyles.input}
              />
              {errors.githubRepositoryUrl && (
                <div className={formStyles.errorMessage}>
                  {errors.githubRepositoryUrl.message}
                </div>
              )}
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                {...register('githubPat')}
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
                  {...register('buildCommand')}
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
                  {...register('buildOutputDir')}
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
                {...register('editablePaths')}
                placeholder="content, posts, pages"
                className={formStyles.input}
              />
              <p className={formStyles.helpText}>
                Comma-separated list of directories that can be edited through the CMS (relative to site root).
              </p>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                Validate Command
              </label>
              <input
                type="text"
                {...register('validateCommand')}
                placeholder="npm run validate"
                className={formStyles.input}
              />
              <p className={formStyles.helpText}>
                Optional command to validate the site before deployment. Return code 0=success, 1=error, other=warning.
              </p>
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                SQLite Files Configuration
              </label>
              <textarea
                {...register('sqliteFiles')}
                placeholder="[]"
                rows={5}
                className={formStyles.textAreaLarge}
              />
              <p className={formStyles.helpText}>
                JSON array defining SQLite database files and their editable tables. Example: {`[{"filePath": "data/*.db", "editableTables": [{"tableName": "posts", "editableColumns": ["title", "content"]}]}]`}
              </p>
              {errors.sqliteFiles && (
                <div className={formStyles.errorMessage}>
                  {errors.sqliteFiles.message}
                </div>
              )}
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                Model Files Configuration
              </label>
              <textarea
                {...register('modelFiles')}
                placeholder="[]"
                rows={5}
                className={formStyles.textAreaLarge}
              />
              <p className={formStyles.helpText}>
                JSON array defining data model files with Zod validators. Example: {`[{"filePath": "content/*.json", "zodValidator": "z.object({title: z.string(), date: z.string().datetime()})", "displayName": "Articles"}]`}
              </p>
              {errors.modelFiles && (
                <div className={formStyles.errorMessage}>
                  {errors.modelFiles.message}
                </div>
              )}
            </div>

            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>
                Custom File Types
              </label>
              <textarea
                {...register('customFileTypes')}
                placeholder="[]"
                rows={4}
                className={formStyles.textAreaLarge}
              />
              <p className={formStyles.helpText}>
                JSON array defining custom file types for your site. Example: {`[{"name": "bibtex", "extensions": [".bib"], "displayName": "Bibliography", "isText": true}]`}
              </p>
              {errors.customFileTypes && (
                <div className={formStyles.errorMessage}>
                  {errors.customFileTypes.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={formStyles.formActions}>
          <button
            type="button"
            onClick={() => router.navigate({ to: '/sites' })}
            disabled={createSiteMutation.isPending}
            className={formStyles.secondaryButton}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={createSiteMutation.isPending || !isValid}
            className={formStyles.primaryButton}
          >
            {createSiteMutation.isPending ? (
              <>
                <span className={formStyles.loadingSpinner}></span>
                Creating Site...
              </>
            ) : (
              'Create Site'
            )}
          </button>
        </div>
      </form>
    </Layout>
  );
}