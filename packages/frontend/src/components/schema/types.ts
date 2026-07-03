export type Locale = 'en' | 'zh' | 'ja' | 'fr' | string;

export interface JsonSchema {
  type?: string;
  enum?: string[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  widget?: string;
  format?: string;
  default?: unknown;
}

export interface FieldHint {
  widget?: 'localizedString' | 'assetRef' | 'textarea' | 'color' | 'url' | 'text' | 'number' | 'select';
  label?: string | Partial<Record<Locale, string>>;
  tooltip?: string | Partial<Record<Locale, string>>;
  assetKinds?: string[];
  options?: Array<{ label: string; value: string }>;
}

export interface EvaluationIssue {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
}

export interface SchemaAssetOption {
  id: string;
  kind: string;
  publicUrl: string;
  label?: string;
}
