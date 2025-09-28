import type { FC } from 'react';
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import type { SiteFormValues } from './types';
import { emptyValueField } from './utils';
import * as formStyles from '../../../styles/forms.css';
import * as siteEditorStyles from '../SiteEditorForm.css';

interface EditablePathsSectionProps {
  register: UseFormRegister<SiteFormValues>;
  editablePathsArray: UseFieldArrayReturn<SiteFormValues, 'editablePaths', 'id'>;
}

export const EditablePathsSection: FC<EditablePathsSectionProps> = ({ register, editablePathsArray }) => (
  <div className={siteEditorStyles.section}>
    <div className={siteEditorStyles.sectionHeader}>
      <h3 className={siteEditorStyles.sectionTitle}>Editable paths</h3>
      <p className={siteEditorStyles.sectionDescription}>
        Limit content editing to specific directories or files. Leave empty to allow full access.
      </p>
    </div>
    <div className={siteEditorStyles.sectionBody}>
      {editablePathsArray.fields.length === 0 && (
        <div className={siteEditorStyles.emptyState}>No restrictions configured. Add paths to scope editing.</div>
      )}

      {editablePathsArray.fields.map((field, index) => (
        <div key={field.id} className={formStyles.formGroup}>
          <label className={formStyles.label}>Path #{index + 1}</label>
          <div className={siteEditorStyles.inlineInputs}>
            <input
              className={formStyles.input}
              placeholder="content/pages"
              {...register(`editablePaths.${index}.value`)}
            />
            <button
              type="button"
              className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
              onClick={() => editablePathsArray.remove(index)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className={formStyles.outlineButton}
        onClick={() => editablePathsArray.append(emptyValueField())}
      >
        Add editable path
      </button>
    </div>
  </div>
);
