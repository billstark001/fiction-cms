import type {
  Site,
  CreateSiteRequest,
  UpdateSiteRequest,
  SQLiteFileConfig,
  SQLiteTableConfig,
  ModelFileConfig,
  CustomFileTypeConfig
} from '../../../api/client';
import type {
  ValueField,
  KeyValueField,
  SQLiteTableForm,
  SQLiteFileForm,
  ModelFileForm,
  CustomFileTypeForm,
  SiteFormValues,
  PrimaryKeyStrategy
} from './types';

export const primaryKeyOptions: PrimaryKeyStrategy[] = [
  'auto_increment',
  'random_string',
  'timestamp',
  'custom'
];

export const emptyValueField = (): ValueField => ({ value: '' });

export const emptyKeyValueField = (): KeyValueField => ({ key: '', value: '' });

export const createEmptySQLiteTable = (): SQLiteTableForm => ({
  tableName: '',
  displayName: '',
  editableColumns: [],
  readableColumns: [],
  defaultValues: [],
  primaryKeyStrategy: 'auto_increment'
});

export const createEmptySQLiteFile = (): SQLiteFileForm => ({
  filePath: '',
  editableTables: [createEmptySQLiteTable()]
});

export const createEmptyModelFile = (): ModelFileForm => ({
  filePath: '',
  displayName: '',
  zodValidator: ''
});

export const createEmptyCustomFileType = (): CustomFileTypeForm => ({
  name: '',
  displayName: '',
  isText: true,
  extensions: []
});

export function buildDefaultFormValues(site?: Site): SiteFormValues {
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

export function sanitizeValueFields(items: ValueField[]): string[] {
  return items
    .map((item) => item.value.trim())
    .filter((value) => value.length > 0);
}

export function sanitizeKeyValueFields(items: KeyValueField[]): Record<string, string> | undefined {
  const entries = items
    .map(({ key, value }) => [key.trim(), value.trim()] as const)
    .filter(([key]) => key.length > 0);

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function sanitizeSQLiteTables(tables: SQLiteTableForm[]): SQLiteTableConfig[] {
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

export function sanitizeSQLiteFiles(files: SQLiteFileForm[]): SQLiteFileConfig[] | undefined {
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

export function sanitizeModelFiles(files: ModelFileForm[]): ModelFileConfig[] | undefined {
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

export function sanitizeCustomFileTypes(types: CustomFileTypeForm[]): CustomFileTypeConfig[] | undefined {
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

export function buildCreatePayload(values: SiteFormValues): CreateSiteRequest {
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

export function buildUpdatePayload(values: SiteFormValues): UpdateSiteRequest {
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
