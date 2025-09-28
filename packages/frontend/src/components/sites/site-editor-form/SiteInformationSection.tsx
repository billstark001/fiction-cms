import type { FC } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import type { SiteFormValues, SiteEditorMode } from './types';
import * as formStyles from '../../../styles/forms.css';
import * as siteEditorStyles from '../SiteEditorForm.css';

interface SiteInformationSectionProps {
  register: UseFormRegister<SiteFormValues>;
  errors: FieldErrors<SiteFormValues>;
  mode: SiteEditorMode;
}

export const SiteInformationSection: FC<SiteInformationSectionProps> = ({ register, errors, mode }) => (
  <div className={siteEditorStyles.section}>
    <div className={siteEditorStyles.sectionHeader}>
      <h3 className={siteEditorStyles.sectionTitle}>Site information</h3>
      <p className={siteEditorStyles.sectionDescription}>
        Provide the essential details for your repository and local workspace.
      </p>
    </div>
    <div className={siteEditorStyles.sectionBody}>
      <div className={siteEditorStyles.grid}>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>Site name</label>
          <input
            className={formStyles.input}
            placeholder="My documentation site"
            {...register('name', { required: 'Site name is required' })}
          />
          {errors.name && <span className={formStyles.helpText}>{errors.name.message}</span>}
        </div>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>GitHub repository URL</label>
          <input
            className={formStyles.input}
            placeholder="https://github.com/your-org/your-repo"
            {...register('githubRepositoryUrl', { required: 'Repository URL is required' })}
          />
          {errors.githubRepositoryUrl && (
            <span className={formStyles.helpText}>{errors.githubRepositoryUrl.message}</span>
          )}
        </div>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>Local repository path</label>
          <input
            className={formStyles.input}
            placeholder="/var/www/sites/docs"
            {...register('localPath', { required: 'Local path is required' })}
          />
          {errors.localPath && <span className={formStyles.helpText}>{errors.localPath.message}</span>}
        </div>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>GitHub Personal Access Token</label>
          <input
            type="password"
            className={formStyles.input}
            placeholder={mode === 'create' ? 'ghp_...' : 'Leave blank to keep existing secret'}
            {...register('githubPat', {
              required: mode === 'create' ? 'GitHub token is required' : false,
              minLength: mode === 'create' ? { value: 8, message: 'Token seems too short' } : undefined
            })}
          />
          <span className={formStyles.helpText}>
            The token is encrypted at rest. For edits, leave blank to retain the stored secret.
          </span>
          {errors.githubPat && <span className={formStyles.helpText}>{errors.githubPat.message}</span>}
        </div>
      </div>

      <div className={formStyles.formGroup}>
        <label className={formStyles.label}>Description</label>
        <textarea
          className={clsx(formStyles.textarea, formStyles.textAreaLarge)}
          placeholder="Short summary of the site"
          {...register('description')}
        />
      </div>

      <label className={siteEditorStyles.toggleRow}>
        <div className={siteEditorStyles.toggleLabel}>
          <span className={formStyles.label}>Site status</span>
          <span className={siteEditorStyles.toggleDescription}>
            Toggle to activate or temporarily disable deployments.
          </span>
        </div>
        <input type="checkbox" {...register('isActive')} />
      </label>
    </div>
  </div>
);
