import { compile, defaultCallPermissionPolicy, type EvalOptions, type JSCallPermissionContext } from 'pure-expr';
import type { RuleEngineOptions } from './types.js';

export type AllowedFunctionRegistry = Set<CallableFunction>;

export function defaultRuleOptions(options: RuleEngineOptions = {}, allowedFunctions: AllowedFunctionRegistry = new Set()): EvalOptions {
  return {
    allowCalls: true,
    allowIn: false,
    allowRegexLiterals: false,
    allowTemplateLiterals: true,
    allowTaggedTemplates: false,
    maxSourceLength: options.maxSourceLength ?? 2000,
    maxAstNodes: options.maxAstNodes ?? 240,
    maxAstDepth: options.maxAstDepth ?? 24,
    maxArrayElements: 100,
    maxObjectProperties: 200,
    maxCallArguments: 8,
    maxTemplateExpressions: 20,
    maxSteps: options.maxSteps ?? 2000,
    maxCallDepth: 12,
    rootContextMode: 'require-plain-object',
    objectLiteralMode: 'safe',
    isCallableAllowed(details: Readonly<JSCallPermissionContext>) {
      return allowedFunctions.has(details.fn) || defaultCallPermissionPolicy(details);
    },
  };
}

export function evaluateExpression(source: string, scope: Record<string, unknown>, allowedFunctions: AllowedFunctionRegistry, options?: RuleEngineOptions) {
  return compile(source, defaultRuleOptions(options, allowedFunctions)).evaluate(scope);
}

export function registerFunctions(target: AllowedFunctionRegistry, value: unknown): void {
  if (typeof value === 'function') {
    target.add(value);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const child of Object.values(value as Record<string, unknown>)) {
    registerFunctions(target, child);
  }
}
