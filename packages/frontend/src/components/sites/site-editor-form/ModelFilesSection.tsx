import type { FC } from 'react';
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import type { SiteFormValues } from './types';
import { createEmptyModelFile } from './utils';
import * as formStyles from '../../../styles/forms.css';
import * as siteEditorStyles from '../SiteEditorForm.css';

interface ModelFilesSectionProps {
  register: UseFormRegister<SiteFormValues>;
  modelFilesArray: UseFieldArrayReturn<SiteFormValues, 'modelFiles', 'id'>;
}

export const ModelFilesSection: FC<ModelFilesSectionProps> = ({ register, modelFilesArray }) => (
  <div className={siteEditorStyles.section}>
    <div className={siteEditorStyles.sectionHeader}>
      <h3 className={siteEditorStyles.sectionTitle}>Model-driven content</h3>
      <p className={siteEditorStyles.sectionDescription}>
        Pair content files with Zod validators to enable structured editing experiences.
      </p>
    </div>
    <div className={siteEditorStyles.sectionBody}>
      {modelFilesArray.fields.length === 0 && (
        <div className={siteEditorStyles.emptyState}>
          No model files configured. Add one to enforce schema validation on JSON or frontmatter content.
        </div>
      )}

      {modelFilesArray.fields.map((field, index) => (
        <div key={field.id} className={siteEditorStyles.arrayItem}>
          <div className={siteEditorStyles.arrayItemHeader}>
            <div className={siteEditorStyles.arrayItemTitle}>
              <h4 className={siteEditorStyles.arrayItemHeading}>Model file #{index + 1}</h4>
              <p className={siteEditorStyles.arrayItemSubtitle}>Define a schema-backed content model.</p>
            </div>
            <button
              type="button"
              className={clsx(formStyles.outlineButton, formStyles.smallButton)}
              onClick={() => modelFilesArray.remove(index)}
            >
              Remove file
            </button>
          </div>
          <div className={siteEditorStyles.arrayItemBody}>
            <div className={siteEditorStyles.grid}>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>File path</label>
                <input
                  className={formStyles.input}
                  placeholder="content/products.json"
                  {...register(`modelFiles.${index}.filePath`, { required: 'File path is required' })}
                />
              </div>
              <div className={formStyles.formGroup}>
                <label className={formStyles.label}>Display name</label>
                <input className={formStyles.input} placeholder="Products" {...register(`modelFiles.${index}.displayName`)} />
              </div>
            </div>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Zod validator</label>
              <textarea
                className={clsx(formStyles.textarea, formStyles.textAreaLarge)}
                placeholder="z.object({ title: z.string(), ... })"
                {...register(`modelFiles.${index}.zodValidator`, {
                  required: 'Provide a zod schema definition'
                })}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className={formStyles.primaryButton}
        onClick={() => modelFilesArray.append(createEmptyModelFile())}
      >
        Add model file
      </button>
    </div>
  </div>
);
