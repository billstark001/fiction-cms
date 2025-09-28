import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as formStyles from '../../styles/forms.css';
import * as siteEditorStyles from './SiteEditorForm.css';
import {
  buildCreatePayload,
  buildDefaultFormValues,
  buildUpdatePayload
} from './site-editor-form/utils';
import type { SiteEditorFormProps, SiteFormValues } from './site-editor-form/types';
import { SiteInformationSection } from './site-editor-form/SiteInformationSection';
import { BuildAndValidationSection } from './site-editor-form/BuildAndValidationSection';
import { EditablePathsSection } from './site-editor-form/EditablePathsSection';
import { SQLiteAccessSection } from './site-editor-form/SQLiteAccessSection';
import { ModelFilesSection } from './site-editor-form/ModelFilesSection';
import { CustomFileTypesSection } from './site-editor-form/CustomFileTypesSection';

export const SiteEditorForm: React.FC<SiteEditorFormProps> = (props) => {
  const {
    mode,
    error,
    onCancel,
    isSubmitting,
    submitLabel = mode === 'create' ? 'Create site' : 'Save changes',
    cancelLabel = 'Cancel'
  } = props;

  const defaultValues = useMemo(() => buildDefaultFormValues(props.initialSite), [props.initialSite]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<SiteFormValues>({
    mode: 'onChange',
    defaultValues
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const editablePathsArray = useFieldArray({ control, name: 'editablePaths' });
  const sqliteFilesArray = useFieldArray({ control, name: 'sqliteFiles' });
  const modelFilesArray = useFieldArray({ control, name: 'modelFiles' });
  const customFileTypesArray = useFieldArray({ control, name: 'customFileTypes' });

  const onSubmit = handleSubmit(async (values) => {
    if (mode === 'create') {
      await props.onSubmit(buildCreatePayload(values));
    } else {
      await props.onSubmit(buildUpdatePayload(values));
    }
  });

  return (
    <form className={siteEditorStyles.formContainer} onSubmit={onSubmit}>
      {error && <div className={formStyles.errorMessage}>{error}</div>}

      <SiteInformationSection register={register} errors={errors} mode={mode} />
      <BuildAndValidationSection register={register} />
      <EditablePathsSection register={register} editablePathsArray={editablePathsArray} />
      <SQLiteAccessSection control={control} register={register} sqliteFilesArray={sqliteFilesArray} />
      <ModelFilesSection register={register} modelFilesArray={modelFilesArray} />
      <CustomFileTypesSection
        register={register}
        control={control}
        customFileTypesArray={customFileTypesArray}
      />

      <div className={formStyles.formActions}>
        {onCancel && (
          <button
            type="button"
            className={formStyles.secondaryButton}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
        )}
        <button type="submit" className={formStyles.primaryButton} disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
