import { z } from 'zod';
import type { SchemaCheck, SchemaSpec } from './types.js';

function applyChecks(schema: z.ZodType<unknown>, checks: SchemaCheck[] | undefined): z.ZodType<unknown> {
  let current = schema;
  for (const check of checks ?? []) {
    if (check.kind === 'min' && 'min' in current && typeof current.min === 'function') current = current.min(check.value, check.message);
    if (check.kind === 'max' && 'max' in current && typeof current.max === 'function') current = current.max(check.value, check.message);
    if (check.kind === 'length' && 'length' in current && typeof current.length === 'function') current = current.length(check.value, check.message);
    if (check.kind === 'regex' && current instanceof z.ZodString) current = current.regex(new RegExp(check.pattern, check.flags), check.message);
    if (check.kind === 'url' && current instanceof z.ZodString) current = current.url(check.message);
    if (check.kind === 'email' && current instanceof z.ZodString) current = current.email(check.message);
    if (check.kind === 'int' && current instanceof z.ZodNumber) current = current.int(check.message);
  }
  return current;
}

export function zodFromSchemaSpec(spec: SchemaSpec): z.ZodType<unknown> {
  let schema: z.ZodType<unknown>;

  switch (spec.kind) {
    case 'string':
      schema = z.string();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'unknown':
      schema = z.unknown();
      break;
    case 'literal':
      schema = z.literal(spec.value as never);
      break;
    case 'enum':
      if (spec.values.length === 0) throw new Error('Enum schema requires at least one value.');
      schema = z.enum(spec.values as [string, ...string[]]);
      break;
    case 'array':
      schema = z.array(zodFromSchemaSpec(spec.item));
      break;
    case 'object': {
      const shape = Object.fromEntries(Object.entries(spec.properties).map(([key, value]) => [key, zodFromSchemaSpec(value)]));
      schema = spec.strict ? z.object(shape).strict() : z.object(shape);
      break;
    }
    case 'union':
      if (spec.items.length < 2) throw new Error('Union schema requires at least two items.');
      schema = z.union(spec.items.map(zodFromSchemaSpec) as [z.ZodType<unknown>, z.ZodType<unknown>, ...z.ZodType<unknown>[]]);
      break;
    case 'record':
      schema = z.record(z.string(), zodFromSchemaSpec(spec.value));
      break;
  }

  schema = applyChecks(schema, 'checks' in spec ? spec.checks : undefined);
  if (spec.meta && 'meta' in schema && typeof schema.meta === 'function') schema = schema.meta(spec.meta);
  if (spec.defaultValue !== undefined) schema = schema.default(spec.defaultValue);
  if (spec.optional) schema = schema.optional();
  return schema;
}
