import { z } from 'zod';
import { compileTemplate } from 'pure-expr/template';
import { createEvaluationResult, type EvaluationIssue } from '@fiction-cms/common';
import { defaultRuleOptions, evaluateExpression, registerFunctions, type AllowedFunctionRegistry } from './expr.js';
import { ruleHelpers, getPath, setPath } from './helpers.js';
import { createSchemaBuilder, normalizeSchemaSpec } from './schema-builder.js';
import { translateZodIssues } from './issues.js';
import type { CompiledDataCollectionDefinition, DataCollectionTypeDefinition, RuleContext, RuleEngineOptions, SchemaSpec } from './types.js';
import { zodFromSchemaSpec } from './zod-compiler.js';

function compileSchemaSource(source: string, context: Record<string, unknown> | undefined, options?: RuleEngineOptions): SchemaSpec {
  const allowed: AllowedFunctionRegistry = new Set();
  const s = createSchemaBuilder(allowed);
  registerFunctions(allowed, ruleHelpers);
  registerFunctions(allowed, context);
  const value = evaluateExpression(source, { s, ...ruleHelpers, ...(context ?? {}) }, allowed, options);
  if (!value || typeof value !== 'object' || !('kind' in value)) {
    throw new Error('Schema source must evaluate to a schema builder result.');
  }
  return normalizeSchemaSpec(value as SchemaSpec);
}

function createRuleScope(data: unknown, context: RuleContext, path?: string, extras: Record<string, unknown> = {}) {
  const helpers = { ...ruleHelpers, ...(context.helpers ?? {}) };
  return {
    data,
    value: path ? getPath(data, path) : data,
    fieldPath: path ?? '',
    context,
    assets: context.assets ?? {},
    now: context.now ?? new Date().toISOString(),
    ...helpers,
    ...extras,
  };
}

function renderTemplateValue(source: string, scope: Record<string, unknown>, allowed: AllowedFunctionRegistry, options?: RuleEngineOptions) {
  const rendered = compileTemplate(source, { evalOptions: defaultRuleOptions(options, allowed) }).render(scope);
  if (rendered.errors.length > 0) {
    throw new Error(rendered.errors[0]?.message || 'Rule template rendering failed.');
  }
  return rendered.output;
}

function applyTransform(data: unknown, definition: DataCollectionTypeDefinition, context: RuleContext, options?: RuleEngineOptions) {
  if (!definition.transform) return data;
  const allowed: AllowedFunctionRegistry = new Set();
  registerFunctions(allowed, ruleHelpers);
  registerFunctions(allowed, context.helpers);
  return evaluateExpression(
    definition.transform,
    {
      ...createRuleScope(data, context),
      defaultValue: definition.defaultValue,
    },
    allowed,
    options,
  );
}

function applyCoercions(data: unknown, definition: DataCollectionTypeDefinition, context: RuleContext, options?: RuleEngineOptions) {
  let next = applyTransform(data, definition, context, options);
  const allowed: AllowedFunctionRegistry = new Set();
  registerFunctions(allowed, ruleHelpers);
  registerFunctions(allowed, context.helpers);

  for (const [path, source] of Object.entries(definition.coercions ?? {})) {
    const scope = createRuleScope(next, context, path);
    const coerced = evaluateExpression(source, scope, allowed, options);
    next = setPath(next, path, coerced);
  }

  return next;
}

function evaluateRules(data: unknown, definition: DataCollectionTypeDefinition, context: RuleContext, options?: RuleEngineOptions) {
  const issues: EvaluationIssue[] = [];
  const allowed: AllowedFunctionRegistry = new Set();
  registerFunctions(allowed, ruleHelpers);
  registerFunctions(allowed, context.helpers);

  for (const rule of definition.validations ?? []) {
    const baseScope = createRuleScope(data, context, rule.path);
    const itemValues = rule.each
      ? evaluateExpression(rule.each.source, baseScope, allowed, options)
      : null;
    const iterable = rule.each ? (Array.isArray(itemValues) ? itemValues : []) : [undefined];

    for (const [index, item] of iterable.entries()) {
      const itemName = rule.each?.itemName ?? 'item';
      const indexName = rule.each?.indexName ?? 'index';
      const scope = rule.each
        ? createRuleScope(data, context, rule.path, {
            [itemName]: item,
            [indexName]: index,
            item,
            index,
            baseValue: baseScope.value,
            value: item,
          })
        : baseScope;
      const failed = Boolean(evaluateExpression(rule.when, scope, allowed, options));
      if (failed) {
        issues.push({
          severity: rule.severity,
          path: renderTemplateValue(rule.path, scope, allowed, options),
          message: renderTemplateValue(rule.message, scope, allowed, options),
        });
      }
    }
  }

  return createEvaluationResult(issues);
}

export function compileDataCollectionDefinition(
  definition: DataCollectionTypeDefinition,
  options?: RuleEngineOptions,
): CompiledDataCollectionDefinition {
  const schemaSpec = definition.schemaSpec ?? (definition.schemaSource ? compileSchemaSource(definition.schemaSource, definition.schemaContext, options) : undefined);
  if (!schemaSpec) {
    throw new Error(`Data collection '${definition.type}' does not define schemaSpec or schemaSource.`);
  }

  const schema = zodFromSchemaSpec(schemaSpec);
  const jsonSchema = z.toJSONSchema(schema);

  return {
    type: definition.type,
    title: definition.title,
    schemaVersion: definition.schemaVersion,
    schema,
    jsonSchema,
    schemaSpec,
    defaultValue: definition.defaultValue,
    templates: definition.templates ?? [],
    listFields: definition.listFields ?? [],
    fieldHints: definition.fieldHints ?? {},
    coerce(data, context = {}) {
      return applyCoercions(data, definition, context, options);
    },
    evaluate(data, context = {}) {
      const coerced = applyCoercions(data, definition, context, options);
      const parsed = schema.safeParse(coerced);
      if (!parsed.success) {
        return createEvaluationResult(translateZodIssues(parsed.error.issues, definition.fieldHints ?? {}));
      }
      return evaluateRules(parsed.data, definition, context, options);
    },
  };
}
