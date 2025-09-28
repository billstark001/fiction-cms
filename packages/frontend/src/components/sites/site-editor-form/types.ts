import type {
  Site,
  SQLiteTableConfig,
  CreateSiteRequest,
  UpdateSiteRequest
} from '../../../api/client';

export interface ValueField {
  value: string;
}

export interface KeyValueField {
  key: string;
  value: string;
}

export type PrimaryKeyStrategy = NonNullable<SQLiteTableConfig['primaryKeyStrategy']>;

export interface SQLiteTableForm {
  tableName: string;
  displayName?: string;
  editableColumns: ValueField[];
  readableColumns: ValueField[];
  defaultValues: KeyValueField[];
  primaryKeyStrategy?: PrimaryKeyStrategy;
}

export interface SQLiteFileForm {
  filePath: string;
  editableTables: SQLiteTableForm[];
}

export interface ModelFileForm {
  filePath: string;
  displayName?: string;
  zodValidator: string;
}

export interface CustomFileTypeForm {
  name: string;
  displayName?: string;
  isText?: boolean;
  extensions: ValueField[];
}

export interface SiteFormValues {
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

export interface SiteEditorCommonProps {
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  error?: string | null;
  isSubmitting?: boolean;
}

export type SiteEditorFormProps =
  | (SiteEditorCommonProps & {
      mode: 'create';
      initialSite?: Site;
      onSubmit: (payload: CreateSiteRequest) => Promise<void>;
    })
  | (SiteEditorCommonProps & {
      mode: 'edit';
      initialSite: Site;
      onSubmit: (payload: UpdateSiteRequest) => Promise<void>;
    });

export type SanitizeResult<T> = T | undefined;

export interface SanitizedTablesResult {
  editableColumns?: string[];
  readableColumns?: string[];
  defaultValues?: Record<string, string>;
  displayName?: string;
  primaryKeyStrategy?: PrimaryKeyStrategy;
}

export type SiteEditorMode = 'create' | 'edit';