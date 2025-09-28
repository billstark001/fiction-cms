import type { FC } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import type { SiteFormValues } from './types';
import * as formStyles from '../../../styles/forms.css';
import * as siteEditorStyles from '../SiteEditorForm.css';

interface BuildAndValidationSectionProps {
  register: UseFormRegister<SiteFormValues>;
}

export const BuildAndValidationSection: FC<BuildAndValidationSectionProps> = ({ register }) => (
  <div className={siteEditorStyles.section}>
    <div className={siteEditorStyles.sectionHeader}>
      <h3 className={siteEditorStyles.sectionTitle}>Build & validation</h3>
      <p className={siteEditorStyles.sectionDescription}>
        Configure optional commands used for build and validation workflows.
      </p>
    </div>
    <div className={siteEditorStyles.sectionBody}>
      <div className={siteEditorStyles.grid}>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>Build command</label>
          <input className={formStyles.input} placeholder="npm run build" {...register('buildCommand')} />
        </div>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>Build output directory</label>
          <input className={formStyles.input} placeholder="dist" {...register('buildOutputDir')} />
        </div>
        <div className={clsx(formStyles.formGroup, siteEditorStyles.fullWidth)}>
          <label className={formStyles.label}>Validation command</label>
          <input className={formStyles.input} placeholder="npm run lint" {...register('validateCommand')} />
          <span className={formStyles.helpText}>
            Executed before deployments to verify content changes.
          </span>
        </div>
      </div>
    </div>
  </div>
);
