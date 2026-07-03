import type { FieldHint, JsonSchema, Locale } from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizePath(path: string) {
  return path.replace(/\.\d+(?=\.|$)/g, '[]');
}

export function unwrapSchema(schema: JsonSchema): JsonSchema {
  if (schema.anyOf?.length) {
    const nonNull = schema.anyOf.find((item) => item.type !== 'null');
    return nonNull ? unwrapSchema(nonNull) : schema.anyOf[0];
  }
  if (schema.oneOf?.length) return unwrapSchema(schema.oneOf[0]);
  return schema;
}

export function localizedValue(value: FieldHint['label'], locale: Locale) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || Object.values(value)[0] || '';
}

export function titleCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isLocalizedSchema(schema: JsonSchema) {
  const props = schema.properties || {};
  return Boolean(props.en && props.zh && props.ja && props.fr);
}

export function schemaDefault(schema: JsonSchema, path: string, hints: Record<string, FieldHint>): unknown {
  const unwrapped = unwrapSchema(schema);
  if (unwrapped.default !== undefined) return unwrapped.default;
  const hint = hints[path] || hints[normalizePath(path)];
  if (hint?.widget === 'localizedString' || isLocalizedSchema(unwrapped)) return { en: '', zh: '', ja: '', fr: '' };
  if (hint?.widget === 'assetRef') return { assetId: '', url: '', alt: { en: '', zh: '', ja: '', fr: '' } };
  if (unwrapped.enum?.length) return unwrapped.enum[0];
  if (unwrapped.type === 'array') return [];
  if (unwrapped.type === 'object' || unwrapped.properties) {
    return Object.fromEntries(Object.entries(unwrapped.properties || {}).map(([key, child]) => [key, schemaDefault(child, path ? `${path}.${key}` : key, hints)]));
  }
  if (unwrapped.type === 'number' || unwrapped.type === 'integer') return 0;
  if (unwrapped.type === 'boolean') return false;
  return '';
}
