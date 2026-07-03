import type { SchemaCheck, SchemaSpec } from './types.js';
import type { AllowedFunctionRegistry } from './expr.js';

const builderSpec = Symbol('builderSpec');

type Builder = Record<string, any> & {
  [builderSpec]?: SchemaSpec;
  min(value: number, message?: string): Builder;
  max(value: number, message?: string): Builder;
  length(value: number, message?: string): Builder;
  regex(pattern: string, message?: string, flags?: string): Builder;
  url(message?: string): Builder;
  email(message?: string): Builder;
  int(message?: string): Builder;
  optional(): Builder;
  default(value: unknown): Builder;
  meta(value: Record<string, unknown>): Builder;
  strict(): Builder;
};

function withCheck(spec: SchemaSpec, check: SchemaCheck): SchemaSpec {
  return { ...spec, checks: [...('checks' in spec && spec.checks ? spec.checks : []), check] } as SchemaSpec;
}

function makeBuilder(spec: SchemaSpec, allowed: AllowedFunctionRegistry): Builder {
  const builder: Builder = {
    ...spec,
    min: (value: number, message?: string) => makeBuilder(withCheck(spec, { kind: 'min', value, message }), allowed),
    max: (value: number, message?: string) => makeBuilder(withCheck(spec, { kind: 'max', value, message }), allowed),
    length: (value: number, message?: string) => makeBuilder(withCheck(spec, { kind: 'length', value, message }), allowed),
    regex: (pattern: string, message?: string, flags?: string) => makeBuilder(withCheck(spec, { kind: 'regex', pattern, flags, message }), allowed),
    url: (message?: string) => makeBuilder(withCheck(spec, { kind: 'url', message }), allowed),
    email: (message?: string) => makeBuilder(withCheck(spec, { kind: 'email', message }), allowed),
    int: (message?: string) => makeBuilder(withCheck({ ...spec, kind: 'integer' } as SchemaSpec, { kind: 'int', message }), allowed),
    optional: () => makeBuilder({ ...spec, optional: true }, allowed),
    default: (value: unknown) => makeBuilder({ ...spec, defaultValue: value }, allowed),
    meta: (value: Record<string, unknown>) => makeBuilder({ ...spec, meta: value }, allowed),
    strict: () => makeBuilder(spec.kind === 'object' ? { ...spec, strict: true } : spec, allowed),
  };
  Object.defineProperty(builder, builderSpec, {
    value: spec,
    enumerable: false,
  });
  for (const value of Object.values(builder)) {
    if (typeof value === 'function') allowed.add(value);
  }
  return builder;
}

export function normalizeSchemaSpec(value: SchemaSpec | Builder): SchemaSpec {
  if (builderSpec in value && value[builderSpec]) {
    return value[builderSpec];
  }
  const maybeBuilder = value as Builder;
  if (
    typeof maybeBuilder.min !== 'function' &&
    typeof maybeBuilder.max !== 'function' &&
    typeof maybeBuilder.length !== 'function' &&
    typeof maybeBuilder.regex !== 'function' &&
    typeof maybeBuilder.url !== 'function' &&
    typeof maybeBuilder.email !== 'function' &&
    typeof maybeBuilder.int !== 'function' &&
    typeof maybeBuilder.optional !== 'function' &&
    typeof maybeBuilder.default !== 'function' &&
    typeof maybeBuilder.meta !== 'function' &&
    typeof maybeBuilder.strict !== 'function'
  ) {
    return value as SchemaSpec;
  }
  const { min, max, length, regex, url, email, int, optional, default: defaultFn, meta, strict, ...spec } = maybeBuilder;
  void min;
  void max;
  void length;
  void regex;
  void url;
  void email;
  void int;
  void optional;
  void defaultFn;
  void meta;
  void strict;
  return spec as SchemaSpec;
}

export function createSchemaBuilder(allowed: AllowedFunctionRegistry) {
  const s = {
    string: () => makeBuilder({ kind: 'string' }, allowed),
    number: () => makeBuilder({ kind: 'number' }, allowed),
    integer: () => makeBuilder({ kind: 'integer' }, allowed),
    boolean: () => makeBuilder({ kind: 'boolean' }, allowed),
    unknown: () => makeBuilder({ kind: 'unknown' }, allowed),
    url: (message?: string) => makeBuilder(withCheck({ kind: 'string' }, { kind: 'url', message }), allowed),
    color: (message = 'Use a #RRGGBB color') => makeBuilder(withCheck({ kind: 'string' }, { kind: 'regex', pattern: '^#[0-9a-fA-F]{6}$', message }), allowed),
    literal: (value: unknown) => makeBuilder({ kind: 'literal', value }, allowed),
    enum: (values: string[]) => makeBuilder({ kind: 'enum', values }, allowed),
    array: (item: SchemaSpec | Builder) => makeBuilder({ kind: 'array', item: normalizeSchemaSpec(item) }, allowed),
    object: (properties: Record<string, SchemaSpec | Builder>) =>
      makeBuilder({
        kind: 'object',
        properties: Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, normalizeSchemaSpec(value)])),
        strict: false,
      }, allowed),
    union: (items: Array<SchemaSpec | Builder>) => makeBuilder({ kind: 'union', items: items.map(normalizeSchemaSpec) }, allowed),
    record: (value: SchemaSpec | Builder) => makeBuilder({ kind: 'record', value: normalizeSchemaSpec(value) }, allowed),
    localizedString: (locales = ['en', 'zh', 'ja', 'fr'], requiredLocales: string[] = []) => {
      const properties = Object.fromEntries(
        locales.map((locale) => [
          locale,
          normalizeSchemaSpec(requiredLocales.includes(locale) ? makeBuilder({ kind: 'string' }, allowed).min(1, `${locale.toUpperCase()} text is required`) : makeBuilder({ kind: 'string' }, allowed)),
        ]),
      );
      return makeBuilder({ kind: 'object', properties, strict: true, meta: { widget: 'localizedString' } }, allowed);
    },
    assetReference: (locales = ['en', 'zh', 'ja', 'fr']) => {
      const urlOrEmpty = normalizeSchemaSpec(makeBuilder({ kind: 'union', items: [normalizeSchemaSpec(makeBuilder(withCheck({ kind: 'string' }, { kind: 'url', message: 'Enter a valid URL' }), allowed)), { kind: 'literal', value: '' }] }, allowed));
      return makeBuilder({
        kind: 'object',
        strict: true,
        meta: { widget: 'assetRef' },
        properties: {
          assetId: normalizeSchemaSpec(makeBuilder({ kind: 'string', optional: true }, allowed)),
          url: normalizeSchemaSpec(makeBuilder({ ...urlOrEmpty, optional: true }, allowed)),
          alt: normalizeSchemaSpec(s.localizedString(locales, ['en']).optional()),
        },
      }, allowed);
    },
  };
  for (const value of Object.values(s)) allowed.add(value);
  return s;
}
