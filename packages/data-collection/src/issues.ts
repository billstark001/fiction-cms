import type { EvaluationIssue, FieldHint, LocalizedText } from '@fiction-cms/common';
import type { z } from 'zod';

const localeNames: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  ja: 'Japanese',
  fr: 'French',
};

function localizedHintText(value: string | LocalizedText | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || Object.values(value).find((item) => item.trim().length > 0) || '';
}

function normalizeHintPath(path: string) {
  return path.replace(/\.\d+(?=\.|$)/g, '[]');
}

function titleCase(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pathToParts(path: Array<string | number>, fieldHints: Record<string, FieldHint>) {
  const parts: string[] = [];
  let cursor = '';

  for (const part of path) {
    if (typeof part === 'number') {
      parts.push(`item ${part + 1}`);
      cursor += '.[]';
      continue;
    }

    cursor = cursor ? `${cursor}.${part}` : part;
    if (localeNames[part]) {
      parts.push(localeNames[part]);
      continue;
    }

    const hint = fieldHints[normalizeHintPath(cursor)];
    parts.push(localizedHintText(hint?.label) || titleCase(part));
  }

  return parts;
}

function readablePath(issuePath: Array<string | number>, fieldHints: Record<string, FieldHint>) {
  const parts = pathToParts(issuePath, fieldHints);
  return parts.length ? parts.join(' > ') : 'This value';
}

function issuePath(issue: z.core.$ZodIssue) {
  return issue.path.map(String).join('.');
}

function friendlyMessage(issue: z.core.$ZodIssue, label: string) {
  const code = issue.code;
  const raw = issue as z.core.$ZodIssue & Record<string, unknown>;

  if (code === 'invalid_type') {
    return `${label} has the wrong data type.`;
  }

  if (code === 'too_small') {
    const minimum = typeof raw.minimum === 'number' ? raw.minimum : null;
    const origin = typeof raw.origin === 'string' ? raw.origin : '';
    if (origin === 'string' && minimum === 1) return `${label} is required.`;
    if (origin === 'array' && minimum !== null) return `${label} needs at least ${minimum} item${minimum === 1 ? '' : 's'}.`;
    return `${label} is too short.`;
  }

  if (code === 'invalid_format') {
    if (raw.format === 'url') return `${label} must be a valid URL. Include https:// when linking to a web page.`;
    return `${label} has the wrong format.`;
  }

  if (code === 'invalid_value') {
    return `${label} must use one of the allowed options.`;
  }

  if (code === 'unrecognized_keys') {
    return `${label} includes fields that are not supported.`;
  }

  if (code === 'invalid_union') {
    return `${label} does not match any supported format.`;
  }

  return `${label}: ${issue.message}`;
}

export function translateZodIssues(issues: z.core.$ZodIssue[], fieldHints: Record<string, FieldHint> = {}): EvaluationIssue[] {
  return issues.map((issue) => {
    const path = issue.path.filter((part): part is string | number => typeof part === 'string' || typeof part === 'number');
    const label = readablePath(path, fieldHints);
    return {
      severity: 'error',
      path: issuePath(issue),
      message: friendlyMessage(issue, label),
    };
  });
}
