import type { FieldHint, EvaluationResult, EvaluationSeverity } from '@fiction-cms/common';
import type { z } from 'zod';

export type PrimitiveSchemaKind = 'string' | 'number' | 'integer' | 'boolean' | 'unknown';

export type SchemaSpec =
  | { kind: PrimitiveSchemaKind; checks?: SchemaCheck[]; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> }
  | { kind: 'literal'; value: unknown; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> }
  | { kind: 'enum'; values: string[]; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> }
  | { kind: 'array'; item: SchemaSpec; checks?: SchemaCheck[]; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> }
  | { kind: 'object'; properties: Record<string, SchemaSpec>; strict?: boolean; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> }
  | { kind: 'union'; items: SchemaSpec[]; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> }
  | { kind: 'record'; value: SchemaSpec; optional?: boolean; defaultValue?: unknown; meta?: Record<string, unknown> };

export type SchemaCheck =
  | { kind: 'min'; value: number; message?: string }
  | { kind: 'max'; value: number; message?: string }
  | { kind: 'length'; value: number; message?: string }
  | { kind: 'regex'; pattern: string; flags?: string; message?: string }
  | { kind: 'url'; message?: string }
  | { kind: 'email'; message?: string }
  | { kind: 'int'; message?: string };

export interface RuleExpression {
  path: string;
  severity: EvaluationSeverity;
  when: string;
  message: string;
  each?: {
    source: string;
    itemName?: string;
    indexName?: string;
  };
}

export type CoercionMap = Record<string, string>;

export interface DataCollectionTypeDefinition {
  type: string;
  title: string;
  schemaVersion: number;
  schemaSource?: string;
  schemaContext?: Record<string, unknown>;
  schemaSpec?: SchemaSpec;
  defaultValue: unknown;
  templates?: unknown[];
  listFields?: string[];
  fieldHints?: Record<string, FieldHint>;
  transform?: string;
  coercions?: CoercionMap;
  validations?: RuleExpression[];
}

export interface CompiledDataCollectionDefinition {
  type: string;
  title: string;
  schemaVersion: number;
  schema: z.ZodType<unknown>;
  jsonSchema: unknown;
  schemaSpec: SchemaSpec;
  defaultValue: unknown;
  templates: unknown[];
  listFields: string[];
  fieldHints: Record<string, FieldHint>;
  coerce(data: unknown, context?: RuleContext): unknown;
  evaluate(data: unknown, context?: RuleContext): EvaluationResult;
}

export interface RuleContext {
  assets?: Record<string, unknown> | Map<string, unknown>;
  now?: string;
  helpers?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RuleEngineOptions {
  maxSourceLength?: number;
  maxAstNodes?: number;
  maxAstDepth?: number;
  maxSteps?: number;
}
