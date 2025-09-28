import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Control, UseFormRegister } from 'react-hook-form';
import clsx from 'clsx';
import {
  CreateSiteRequest,
  UpdateSiteRequest,
  Site,
  SQLiteFileConfig,
  SQLiteTableConfig,
  ModelFileConfig,
  CustomFileTypeConfig
} from '../../api/client';
import * as formStyles from '../../styles/forms.css';
import * as siteEditorStyles from './SiteEditorForm.css';

interface ValueField {
  value: string;
}

interface KeyValueField {
  key: string;
  value: string;
}

type PrimaryKeyStrategy = NonNullable<SQLiteTableConfig['primaryKeyStrategy']>;

interface SQLiteTableForm {
  tableName: string;
  displayName?: string;
  editableColumns: ValueField[];
  readableColumns: ValueField[];
  defaultValues: KeyValueField[];
  primaryKeyStrategy?: PrimaryKeyStrategy;
}

interface SQLiteFileForm {
  filePath: string;
  editableTables: SQLiteTableForm[];
}

interface ModelFileForm {
  filePath: string;
  displayName?: string;
  zodValidator: string;
}

interface CustomFileTypeForm {
  name: string;
  displayName?: string;
  isText?: boolean;
  extensions: ValueField[];
}

interface SiteFormValues {
  name: string;
  description: string;
  githubRepositoryUrl: string;
  githubPat: string;
  localPath: string;
  buildCommand: string;
  buildOutputDir: string;
  validateCommand: string;
  editablePaths: ValueField[];
  sqliteFiles: SQLiteFileForm[];
  modelFiles: ModelFileForm[];
  customFileTypes: CustomFileTypeForm[];
  isActive: boolean;
}

interface CommonProps {
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  error?: string | null;
  isSubmitting?: boolean;
}

export type SiteEditorFormProps =
  | (CommonProps & {
      mode: 'create';
      initialSite?: Site;
      onSubmit: (payload: CreateSiteRequest) => Promise<void>;
    })
  | (CommonProps & {
      mode: 'edit';
      initialSite: Site;
      onSubmit: (payload: UpdateSiteRequest) => Promise<void>;
    });

const primaryKeyOptions: PrimaryKeyStrategy[] = [
  'auto_increment',
  'random_string',
  'timestamp',
  'custom'
];

const emptyValueField = (): ValueField => ({ value: '' });
const emptyKeyValueField = (): KeyValueField => ({ key: '', value: '' });

const createEmptySQLiteTable = (): SQLiteTableForm => ({
  tableName: '',
  displayName: '',
  editableColumns: [],
  readableColumns: [],
  defaultValues: [],
  primaryKeyStrategy: 'auto_increment'
});

const createEmptySQLiteFile = (): SQLiteFileForm => ({
  filePath: '',
  editableTables: [createEmptySQLiteTable()]
});

const createEmptyModelFile = (): ModelFileForm => ({
  filePath: '',
  displayName: '',
  zodValidator: ''
});

const createEmptyCustomFileType = (): CustomFileTypeForm => ({
  name: '',
  displayName: '',
  isText: true,
  extensions: []
});

function buildDefaultFormValues(site?: Site): SiteFormValues {
  return {
    name: site?.name ?? '',
    description: site?.description ?? '',
    githubRepositoryUrl: site?.githubRepositoryUrl ?? '',
    githubPat: '',
    localPath: site?.localPath ?? '',
    buildCommand: site?.buildCommand ?? '',
    buildOutputDir: site?.buildOutputDir ?? '',
    validateCommand: site?.validateCommand ?? '',
    editablePaths: (site?.editablePaths ?? []).map((path) => ({ value: path })),
    sqliteFiles: (site?.sqliteFiles ?? []).map((file) => ({
      filePath: file.filePath ?? '',
      editableTables: (file.editableTables ?? []).map((table) => ({
        tableName: table.tableName ?? '',
        displayName: table.displayName ?? '',
        editableColumns: (table.editableColumns ?? []).map((column) => ({ value: column })),
        readableColumns: (table.readableColumns ?? []).map((column) => ({ value: column })),
        defaultValues: table.defaultValues
          ? Object.entries(table.defaultValues).map(([key, value]) => ({
              key,
              value: String(value)
            }))
          : [],
        primaryKeyStrategy: table.primaryKeyStrategy ?? 'auto_increment'
      }))
    })),
    modelFiles: (site?.modelFiles ?? []).map((file) => ({
      filePath: file.filePath ?? '',
      displayName: file.displayName ?? '',
      zodValidator: file.zodValidator ?? ''
    })),
    customFileTypes: (site?.customFileTypes ?? []).map((type) => ({
      name: type.name ?? '',
      displayName: type.displayName ?? '',
      isText: type.isText ?? true,
      extensions: (type.extensions ?? []).map((ext) => ({ value: ext }))
    })),
    isActive: site?.isActive ?? true
  };
}

function sanitizeValueFields(items: ValueField[]): string[] {
  return items
    .map((item) => item.value.trim())
    .filter((value) => value.length > 0);
}

function sanitizeKeyValueFields(items: KeyValueField[]): Record<string, string> | undefined {
  const entries = items
    .map(({ key, value }) => [key.trim(), value.trim()] as const)
    .filter(([key]) => key.length > 0);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function sanitizeSQLiteTables(tables: SQLiteTableForm[]): SQLiteTableConfig[] {
  const sanitized: SQLiteTableConfig[] = [];

  tables.forEach((table) => {
    const tableName = table.tableName.trim();
    if (!tableName) {
      return;
    }

    const editableColumns = sanitizeValueFields(table.editableColumns);
    const readableColumns = sanitizeValueFields(table.readableColumns);
    const defaultValues = sanitizeKeyValueFields(table.defaultValues);

    const sanitizedTable: SQLiteTableConfig = {
      tableName
    };

    const displayName = table.displayName?.trim();
    if (displayName) {
      sanitizedTable.displayName = displayName;
    }

    if (editableColumns.length > 0) {
      sanitizedTable.editableColumns = editableColumns;
    }

    if (readableColumns.length > 0) {
      sanitizedTable.readableColumns = readableColumns;
    }

    if (defaultValues) {
      sanitizedTable.defaultValues = defaultValues;
    }

    if (table.primaryKeyStrategy) {
      sanitizedTable.primaryKeyStrategy = table.primaryKeyStrategy;
    }

    sanitized.push(sanitizedTable);
  });

  return sanitized;
}

function sanitizeSQLiteFiles(files: SQLiteFileForm[]): SQLiteFileConfig[] | undefined {
  const sanitized: SQLiteFileConfig[] = [];

  files.forEach((file) => {
    const filePath = file.filePath.trim();
    if (!filePath) {
      return;
    }

    const editableTables = sanitizeSQLiteTables(file.editableTables);
    if (editableTables.length === 0) {
      return;
    }

    sanitized.push({
      filePath,
      editableTables
    });
  });

  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeModelFiles(files: ModelFileForm[]): ModelFileConfig[] | undefined {
  const sanitized: ModelFileConfig[] = [];

  files.forEach((file) => {
    const filePath = file.filePath.trim();
    const zodValidator = file.zodValidator.trim();
    if (!filePath || !zodValidator) {
      return;
    }

    const sanitizedFile: ModelFileConfig = {
      filePath,
      zodValidator
    };

    const displayName = file.displayName?.trim();
    if (displayName) {
      sanitizedFile.displayName = displayName;
    }

    sanitized.push(sanitizedFile);
  });

  return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeCustomFileTypes(types: CustomFileTypeForm[]): CustomFileTypeConfig[] | undefined {
  const sanitized: CustomFileTypeConfig[] = [];

  types.forEach((type) => {
    const name = type.name.trim();
    const extensions = sanitizeValueFields(type.extensions);

    if (!name || extensions.length === 0) {
      return;
    }

    const sanitizedType: CustomFileTypeConfig = {
      name,
      extensions
    };

    const displayName = type.displayName?.trim();
    if (displayName) {
      sanitizedType.displayName = displayName;
    }

    if (typeof type.isText === 'boolean') {
      sanitizedType.isText = type.isText;
    }

    sanitized.push(sanitizedType);
  });

  return sanitized.length > 0 ? sanitized : undefined;
}

function buildCreatePayload(values: SiteFormValues): CreateSiteRequest {
  const editablePaths = sanitizeValueFields(values.editablePaths);

  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    githubRepositoryUrl: values.githubRepositoryUrl.trim(),
    githubPat: values.githubPat.trim(),
    localPath: values.localPath.trim(),
    buildCommand: values.buildCommand.trim() || undefined,
    buildOutputDir: values.buildOutputDir.trim() || undefined,
    validateCommand: values.validateCommand.trim() || undefined,
    editablePaths,
    sqliteFiles: sanitizeSQLiteFiles(values.sqliteFiles),
    modelFiles: sanitizeModelFiles(values.modelFiles),
    customFileTypes: sanitizeCustomFileTypes(values.customFileTypes),
    isActive: values.isActive
  };
}

function buildUpdatePayload(values: SiteFormValues): UpdateSiteRequest {
  const editablePaths = sanitizeValueFields(values.editablePaths);
  const githubPat = values.githubPat.trim();

  const payload: UpdateSiteRequest = {
    name: values.name.trim(),
    description: values.description.trim() || null,
    githubRepositoryUrl: values.githubRepositoryUrl.trim(),
    localPath: values.localPath.trim(),
    buildCommand: values.buildCommand.trim() || null,
    buildOutputDir: values.buildOutputDir.trim() || null,
    validateCommand: values.validateCommand.trim() || null,
    editablePaths,
    sqliteFiles: sanitizeSQLiteFiles(values.sqliteFiles) ?? [],
    modelFiles: sanitizeModelFiles(values.modelFiles) ?? [],
    customFileTypes: sanitizeCustomFileTypes(values.customFileTypes) ?? [],
    isActive: values.isActive
  };

  if (githubPat) {
    payload.githubPat = githubPat;
  }

  return payload;
}

interface SQLiteTableFieldsProps {
  control: Control<SiteFormValues>;
  register: UseFormRegister<SiteFormValues>;
  fileIndex: number;
  tableIndex: number;
  onRemove: () => void;
}

const SQLiteTableFields: React.FC<SQLiteTableFieldsProps> = ({ control, register, fileIndex, tableIndex, onRemove }) => {
  const editableColumnsArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.editableColumns` as const
  });

  const readableColumnsArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.readableColumns` as const
  });

  const defaultValuesArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.defaultValues` as const
  });

  return (
    <div className={siteEditorStyles.arrayItem}>
      <div className={siteEditorStyles.arrayItemHeader}>
        <div className={siteEditorStyles.arrayItemTitle}>
          <h5 className={siteEditorStyles.arrayItemHeading}>Table #{tableIndex + 1}</h5>
          <p className={siteEditorStyles.arrayItemSubtitle}>Configure editable access for this table</p>
        </div>
        <button
          type="button"
          className={clsx(formStyles.outlineButton, formStyles.smallButton)}
          onClick={onRemove}
        >
          Remove table
        </button>
      </div>

      <div className={siteEditorStyles.arrayItemBody}>
        <div className={siteEditorStyles.grid}>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Table name</label>
            <input
              className={formStyles.input}
              placeholder="e.g. posts"
              {...register(`sqliteFiles.${fileIndex}.editableTables.${tableIndex}.tableName`, {
                required: 'Table name is required'
              })}
            />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Display name</label>
            <input
              className={formStyles.input}
              placeholder="Human friendly name"
              {...register(`sqliteFiles.${fileIndex}.editableTables.${tableIndex}.displayName`)}
            />
          </div>
          <div className={formStyles.formGroup}>
            <label className={formStyles.label}>Primary key strategy</label>
            <select
              className={formStyles.select}
              {...register(`sqliteFiles.${fileIndex}.editableTables.${tableIndex}.primaryKeyStrategy`)}
            >
              {primaryKeyOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={siteEditorStyles.nestedList}>
          <div>
            <div className={siteEditorStyles.arrayItemHeader}>
              <h6 className={siteEditorStyles.arrayItemHeading}>Editable columns</h6>
              <button
                type="button"
                className={clsx(formStyles.outlineButton, formStyles.smallButton)}
                onClick={() => editableColumnsArray.append(emptyValueField())}
              >
                Add column
              </button>
            </div>
            {editableColumnsArray.fields.length === 0 && (
              <div className={siteEditorStyles.emptyState}>
                Leave empty to allow editing all columns.
              </div>
            )}
            {editableColumnsArray.fields.map((column, columnIndex) => (
              <div key={column.id} className={siteEditorStyles.inlineInputs}>
                <input
                  className={formStyles.input}
                  placeholder="column_name"
                  {...register(
                    `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.editableColumns.${columnIndex}.value`
                  )}
                />
                <button
                  type="button"
                  className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                  onClick={() => editableColumnsArray.remove(columnIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className={siteEditorStyles.arrayItemHeader}>
              <h6 className={siteEditorStyles.arrayItemHeading}>Readable columns</h6>
              <button
                type="button"
                className={clsx(formStyles.outlineButton, formStyles.smallButton)}
                onClick={() => readableColumnsArray.append(emptyValueField())}
              >
                Add column
              </button>
            </div>
            {readableColumnsArray.fields.length === 0 && (
              <div className={siteEditorStyles.emptyState}>
                Leave empty to allow reading all columns.
              </div>
            )}
            {readableColumnsArray.fields.map((column, columnIndex) => (
              <div key={column.id} className={siteEditorStyles.inlineInputs}>
                <input
                  className={formStyles.input}
                  placeholder="column_name"
                  {...register(
                    `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.readableColumns.${columnIndex}.value`
                  )}
                />
                <button
                  type="button"
                  className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                  onClick={() => readableColumnsArray.remove(columnIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div>
            <div className={siteEditorStyles.arrayItemHeader}>
              <h6 className={siteEditorStyles.arrayItemHeading}>Default values</h6>
              <button
                type="button"
                className={clsx(formStyles.outlineButton, formStyles.smallButton)}
                onClick={() => defaultValuesArray.append(emptyKeyValueField())}
              >
                Add default pair
              </button>
            </div>
            {defaultValuesArray.fields.length === 0 && (
              <div className={siteEditorStyles.emptyState}>
                Optional key/value pairs used when creating new rows.
              </div>
            )}
            {defaultValuesArray.fields.map((pair, pairIndex) => (
              <div key={pair.id} className={siteEditorStyles.keyValueRow}>
                <input
                  className={formStyles.input}
                  placeholder="Column key"
                  {...register(
                    `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.defaultValues.${pairIndex}.key`
                  )}
                />
                <div className={siteEditorStyles.inlineInputs}>
                  <input
                    className={formStyles.input}
                    placeholder="Value"
                    {...register(
                      `sqliteFiles.${fileIndex}.editableTables.${tableIndex}.defaultValues.${pairIndex}.value`
                    )}
                  />
                  <button
                    type="button"
                    className={clsx(formStyles.secondaryButton, formStyles.smallButton)}
                    onClick={() => defaultValuesArray.remove(pairIndex)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SQLiteFileFieldsProps {
  control: Control<SiteFormValues>;
  register: UseFormRegister<SiteFormValues>;
  fileIndex: number;
  onRemove: () => void;
}

const SQLiteFileFields: React.FC<SQLiteFileFieldsProps> = ({ control, register, fileIndex, onRemove }) => {
  const tablesArray = useFieldArray({
    control,
    name: `sqliteFiles.${fileIndex}.editableTables` as const
  });

  return (
    <div className={siteEditorStyles.arrayItem}>
      <div className={siteEditorStyles.arrayItemHeader}>
        <div className={siteEditorStyles.arrayItemTitle}>
          <h4 className={siteEditorStyles.arrayItemHeading}>SQLite file #{fileIndex + 1}</h4>
          <p className={siteEditorStyles.arrayItemSubtitle}>Define which tables are editable in this file.</p>
        </div>
        <button
          type="button"
          className={clsx(formStyles.outlineButton, formStyles.smallButton)}
          onClick={onRemove}
        >
          Remove file
        </button>
      </div>

      <div className={siteEditorStyles.arrayItemBody}>
        <div className={formStyles.formGroup}>
          <label className={formStyles.label}>SQLite file path</label>
          <input
            className={formStyles.input}
            placeholder="e.g. data/content.db or data/*.db"
            {...register(`sqliteFiles.${fileIndex}.filePath`, {
              required: 'SQLite file path is required'
            })}
          />
        </div>

        <div className={siteEditorStyles.nestedList}>
          {tablesArray.fields.length === 0 && (
            <div className={siteEditorStyles.emptyState}>
              Add at least one table configuration for this file.
            </div>
          )}

          {tablesArray.fields.map((table, tableIndex) => (
            <SQLiteTableFields
              key={table.id}
              control={control}
              register={register}
              fileIndex={fileIndex}
              tableIndex={tableIndex}
              onRemove={() => tablesArray.remove(tableIndex)}
            />
          ))}

          <button
            type="button"
            className={clsx(formStyles.primaryButton, formStyles.smallButton)}
            onClick={() => tablesArray.append(createEmptySQLiteTable())}
          >
            Add table
          </button>
        </div>
      </div>
    </div>
  );
};

interface CustomFileTypeFieldsProps {
  register: UseFormRegister<SiteFormValues>;
  control: Control<SiteFormValues>;
  index: number;
  onRemove: () => void;
}

const CustomFileTypeFields: React.FC<CustomFileTypeFieldsProps> = ({ register, control, index, onRemove }) => {
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

export const SiteEditorForm: React.FC<SiteEditorFormProps> = (props) => {
  const { mode, error, onCancel, isSubmitting, submitLabel = mode === 'create' ? 'Create site' : 'Save changes', cancelLabel = 'Cancel' } = props;

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
      const payload = buildCreatePayload(values);
      await props.onSubmit(payload);
    } else {
      const payload = buildUpdatePayload(values);
      await props.onSubmit(payload);
    }
  });

  return (
    <form className={siteEditorStyles.formContainer} onSubmit={onSubmit}>
      {error && <div className={formStyles.errorMessage}>{error}</div>}

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
              <span className={siteEditorStyles.toggleDescription}>Toggle to activate or temporarily disable deployments.</span>
            </div>
            <input type="checkbox" {...register('isActive')} />
          </label>
        </div>
      </div>

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
              <input
                className={formStyles.input}
                placeholder="npm run build"
                {...register('buildCommand')}
              />
            </div>
            <div className={formStyles.formGroup}>
              <label className={formStyles.label}>Build output directory</label>
              <input
                className={formStyles.input}
                placeholder="dist"
                {...register('buildOutputDir')}
              />
            </div>
            <div className={clsx(formStyles.formGroup, siteEditorStyles.fullWidth)}>
              <label className={formStyles.label}>Validation command</label>
              <input
                className={formStyles.input}
                placeholder="npm run lint"
                {...register('validateCommand')}
              />
              <span className={formStyles.helpText}>
                Executed before deployments to verify content changes.
              </span>
            </div>
          </div>
        </div>
      </div>

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

      <div className={siteEditorStyles.section}>
        <div className={siteEditorStyles.sectionHeader}>
          <h3 className={siteEditorStyles.sectionTitle}>SQLite access</h3>
          <p className={siteEditorStyles.sectionDescription}>
            Allow editors to manage data stored in SQLite databases with table-level controls.
          </p>
        </div>
        <div className={siteEditorStyles.sectionBody}>
          {sqliteFilesArray.fields.length === 0 && (
            <div className={siteEditorStyles.emptyState}>
              No SQLite files configured yet. Add one to expose structured content editing.
            </div>
          )}

          {sqliteFilesArray.fields.map((field, index) => (
            <SQLiteFileFields
              key={field.id}
              control={control}
              register={register}
              fileIndex={index}
              onRemove={() => sqliteFilesArray.remove(index)}
            />
          ))}

          <button
            type="button"
            className={formStyles.primaryButton}
            onClick={() => sqliteFilesArray.append(createEmptySQLiteFile())}
          >
            Add SQLite file
          </button>
        </div>
      </div>

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
                    <input
                      className={formStyles.input}
                      placeholder="Products"
                      {...register(`modelFiles.${index}.displayName`)}
                    />
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
        <button
          type="submit"
          className={formStyles.primaryButton}
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
};
