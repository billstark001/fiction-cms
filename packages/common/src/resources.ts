import { z } from 'zod';

export const resourceKindSchema = z.enum(['asset', 'text', 'dataCollection']);
export type ResourceKind = z.infer<typeof resourceKindSchema>;

export const storageDriverSchema = z.enum(['psql', 's3', 'git']);
export type StorageDriver = z.infer<typeof storageDriverSchema>;

export const resourceActionSchema = z.enum([
  'read',
  'write',
  'list',
  'delete',
  'version',
  'publish',
  'preview',
  'evaluate',
  'audit',
]);
export type ResourceAction = z.infer<typeof resourceActionSchema>;

export const resourceCapabilitySchema = z.object({
  resource: resourceKindSchema,
  driver: storageDriverSchema,
  actions: z.array(resourceActionSchema),
  notes: z.string().optional(),
});
export type ResourceCapability = z.infer<typeof resourceCapabilitySchema>;

export const resourceBackendConfigSchema = z.object({
  driver: storageDriverSchema,
  assets: z.boolean().default(false),
  texts: z.boolean().default(false),
  dataCollections: z.boolean().default(false),
  readonly: z.boolean().default(false),
});
export type ResourceBackendConfig = z.infer<typeof resourceBackendConfigSchema>;

export const localizedTextSchema = z.record(z.string().min(1), z.string());
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const assetKindSchema = z.enum(['image', 'video', 'audio', 'document', 'binary']);
export type AssetKind = z.infer<typeof assetKindSchema>;

export const assetRefSchema = z.object({
  assetId: z.string().optional(),
  url: z.string().optional(),
  alt: localizedTextSchema.optional(),
});
export type AssetRef = z.infer<typeof assetRefSchema>;

export const assetRecordSchema = z.object({
  id: z.string(),
  key: z.string(),
  kind: assetKindSchema,
  publicUrl: z.string().optional(),
  mime: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  durationSeconds: z.number().nonnegative().nullable().optional(),
  alt: localizedTextSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssetRecord = z.infer<typeof assetRecordSchema>;

export const textRecordSchema = z.object({
  id: z.string(),
  key: z.string(),
  content: z.string(),
  contentType: z.string().default('text/plain'),
  encoding: z.enum(['utf8']).default('utf8'),
  metadata: z.record(z.string(), z.unknown()).default({}),
  version: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TextRecord = z.infer<typeof textRecordSchema>;

export const dataCollectionRecordSchema = z.object({
  id: z.string(),
  collection: z.string(),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  schemaVersion: z.number().int().positive().default(1),
  data: z.unknown(),
  evaluation: z.unknown().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable().optional(),
});
export type DataCollectionRecord = z.infer<typeof dataCollectionRecordSchema>;

export const fieldHintSchema = z.object({
  widget: z.enum(['localizedString', 'assetRef', 'textarea', 'color', 'url', 'text', 'number', 'select']).optional(),
  label: z.union([z.string(), localizedTextSchema]).optional(),
  tooltip: z.union([z.string(), localizedTextSchema]).optional(),
  assetKinds: z.array(assetKindSchema).optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});
export type FieldHint = z.infer<typeof fieldHintSchema>;

export const evaluationSeveritySchema = z.enum(['error', 'warning', 'info']);
export type EvaluationSeverity = z.infer<typeof evaluationSeveritySchema>;

export const evaluationIssueSchema = z.object({
  severity: evaluationSeveritySchema,
  path: z.string(),
  message: z.string(),
});
export type EvaluationIssue = z.infer<typeof evaluationIssueSchema>;

export const evaluationResultSchema = z.object({
  passed: z.boolean(),
  score: z.number(),
  evaluatedAt: z.string(),
  issues: z.array(evaluationIssueSchema),
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export interface TextStore {
  getText(key: string): Promise<TextRecord | null>;
  putText(input: Omit<TextRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TextRecord>;
  deleteText(key: string): Promise<boolean>;
  listTexts(prefix?: string): Promise<TextRecord[]>;
}

export interface AssetStore {
  getAsset(key: string): Promise<AssetRecord | null>;
  putAsset(input: Omit<AssetRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<AssetRecord>;
  deleteAsset(key: string): Promise<boolean>;
  listAssets(prefix?: string): Promise<AssetRecord[]>;
}

export interface DataCollectionStore {
  getDataRecord(collection: string, id: string): Promise<DataCollectionRecord | null>;
  putDataRecord(input: Omit<DataCollectionRecord, 'createdAt' | 'updatedAt'>): Promise<DataCollectionRecord>;
  deleteDataRecord(collection: string, id: string): Promise<boolean>;
  listDataRecords(collection: string): Promise<DataCollectionRecord[]>;
}

export function createEvaluationResult(issues: EvaluationIssue[]): EvaluationResult {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warning').length;
  return {
    passed: errors === 0,
    score: Math.max(0, 100 - errors * 30 - warnings * 2),
    evaluatedAt: new Date().toISOString(),
    issues,
  };
}

export function capabilitiesFromBackendConfig(configs: ResourceBackendConfig[]): ResourceCapability[] {
  const capabilities: ResourceCapability[] = [];

  for (const config of configs) {
    const actions: ResourceAction[] = config.readonly ? ['read', 'list'] : ['read', 'write', 'list', 'delete'];
    if (config.assets) capabilities.push({ resource: 'asset', driver: config.driver, actions });
    if (config.texts) capabilities.push({ resource: 'text', driver: config.driver, actions });
    if (config.dataCollections) {
      capabilities.push({
        resource: 'dataCollection',
        driver: config.driver,
        actions: config.readonly ? ['read', 'list', 'evaluate'] : ['read', 'write', 'list', 'delete', 'version', 'publish', 'preview', 'evaluate', 'audit'],
      });
    }
  }

  return capabilities;
}
