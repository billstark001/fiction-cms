import type { FC } from 'react';
import { useFieldArray } from 'react-hook-form';
import type { Control, UseFieldArrayReturn, UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import type { SiteFormValues } from './types';
import { createEmptyCustomFileType, emptyValueField } from './utils';
import * as formStyles from '../../../styles/forms.css';
import * as siteEditorStyles from '../SiteEditorForm.css';

interface CustomFileTypesSectionProps {
  register: UseFormRegister<SiteFormValues>;
  control: Control<SiteFormValues>;
  customFileTypesArray: UseFieldArrayReturn<SiteFormValues, 'customFileTypes', 'id'>;
}

interface CustomFileTypeFieldsProps {
  register: UseFormRegister<SiteFormValues>;
  control: Control<SiteFormValues>;
  index: number;
  onRemove: () => void;
}

const CustomFileTypeFields: FC<CustomFileTypeFieldsProps> = ({ register, control, index, onRemove }) => {
  const extensionsArray = useFieldArray({
    control,
    name: `customFileTypes.${index}.extensions` as const
  });

  return (
    <div className={siteEditorStyles.arrayItem}>
      <div className={siteEditorStyles.arrayItemHeader}>
        <div className={siteEditorStyles.arrayItemTitle}>
          <h4 className={siteEditorStyles.arrayItemHeading}>Custom file type #{index + 1}</h4>
          <p className={siteEditorStyles.arrayItemSubtitle}>Define additional editable file extensions.</p>
        </div>
        <button
          type="button"
          className={clsx(formStyles.outlineButton, formStyles.smallButton)}
          onClick={onRemove}
        >
          Remove type
        </button>
      </div>
      <div className={siteEditorStyles.arrayItemBody}>
        <div className={siteEditorStyles.grid}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Type name</label>
            <input
              className={formStyles.input}
              placeholder="e.g. frontmatter"
              {...register(`customFileTypes.${index}.name`, { required: 'Type name is required' })}
            />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Display name</label>
            <input
              className={formStyles.input}
              placeholder="Human readable name"
              {...register(`customFileTypes.${index}.displayName`)}
            />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Treat as text?</label>
            <label className={formStyles.fieldGroup}>
              <input type="checkbox" {...register(`customFileTypes.${index}.isText`)} />
              <span className={siteEditorStyles.supportText}>
                Enable if files should open in the text editor.
              </span>
            </label>
          </div>
        </div>

        <div className={siteEditorStyles.nestedList}>
          <div className={siteEditorStyles.arrayItemHeader}>
            <h6 className={siteEditorStyles.arrayItemHeading}>Extensions</h6>
            <button
              type="button"
              className={clsx(formStyles.outlineButton, formStyles.smallButton)}
              onClick={() => extensionsArray.append(emptyValueField())}
            >
              Add extension
            </button>
          </div>
          {extensionsArray.fields.length === 0 && (
            <div className={siteEditorStyles.emptyState}>
              Add at least one extension (without the dot).
            </div>
          )}
          {extensionsArray.fields.map((field, fieldIndex) => (
            <div key={field.id} className={siteEditorStyles.inlineInputs}>
              <input
                className={formStyles.input}
                placeholder="md"
                {...register(`customFileTypes.${index}.extensions.${fieldIndex}.value`)}
              />
              <button
                type="button"
                className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                onClick={() => extensionsArray.remove(fieldIndex)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CustomFileTypesSection: FC<CustomFileTypesSectionProps> = ({ register, control, customFileTypesArray }) => (
  <div className={siteEditorStyles.section}>
    <div className={siteEditorStyles.sectionHeader}>
      <h3 className={siteEditorStyles.sectionTitle}>Custom file types</h3>
      <p className={siteEditorStyles.sectionDescription}>
        Extend supported file extensions beyond the built-in text and asset types.
      </p>
    </div>
    <div className={siteEditorStyles.sectionBody}>
      {customFileTypesArray.fields.length === 0 && (
        <div className={siteEditorStyles.emptyState}>
          No custom file types added yet. Use this to enable bespoke editor experiences.
        </div>
      )}

      {customFileTypesArray.fields.map((field, index) => (
        <CustomFileTypeFields
          key={field.id}
          register={register}
          control={control}
          index={index}
          onRemove={() => customFileTypesArray.remove(index)}
        />
      ))}

      <button
        type="button"
        className={formStyles.primaryButton}
        onClick={() => customFileTypesArray.append(createEmptyCustomFileType())}
      >
        Add custom type
      </button>
    </div>
  </div>
);
