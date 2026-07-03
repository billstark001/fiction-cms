import type { AssetRef } from '@fiction-cms/common';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getPath(value: unknown, path: string): unknown {
  if (!path) return value;
  return path.split('.').reduce<unknown>((cursor, part) => {
    if (cursor == null) return undefined;
    if (/^\d+$/.test(part) && Array.isArray(cursor)) return cursor[Number(part)];
    return isRecord(cursor) ? cursor[part] : undefined;
  }, value);
}

export function setPath(value: unknown, path: string, nextValue: unknown): unknown {
  if (!path) return nextValue;
  const root = isRecord(value) ? { ...value } : {};
  const parts = path.split('.').filter(Boolean);
  let cursor: Record<string, unknown> = root;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const existing = cursor[part];
    const next = isRecord(existing) ? { ...existing } : {};
    cursor[part] = next;
    cursor = next;
  }

  const last = parts[parts.length - 1];
  if (last) cursor[last] = nextValue;
  return root;
}

export const ruleHelpers = {
  isRecord,
  get: getPath,
  hasAssetRef(ref: AssetRef | undefined | null) {
    return Boolean(ref?.assetId || ref?.url);
  },
  assetExists(ref: AssetRef | undefined | null, assets: unknown) {
    if (!ref?.assetId) return true;
    if (assets instanceof Map) return assets.has(ref.assetId);
    return isRecord(assets) && Object.prototype.hasOwnProperty.call(assets, ref.assetId);
  },
  oneOf(value: unknown, options: readonly unknown[], fallback: unknown) {
    return options.includes(value) ? value : fallback;
  },
  text(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
  },
  trim(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  },
  upper(value: unknown) {
    return typeof value === 'string' ? value.toUpperCase() : String(value ?? '').toUpperCase();
  },
  list(value: unknown) {
    return Array.isArray(value) ? value : [];
  },
  color(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
  },
  assetRef(value: unknown, fallback: AssetRef = { assetId: '', url: '', alt: { en: '', zh: '', ja: '', fr: '' } }) {
    const source = isRecord(value) ? value : {};
    return {
      assetId: typeof source.assetId === 'string' ? source.assetId : fallback.assetId || '',
      url: typeof source.url === 'string' ? source.url : fallback.url || '',
      alt: isRecord(source.alt) ? ruleHelpers.localizedWithFallback(source.alt, fallback.alt as Record<string, string> | undefined) : fallback.alt,
    };
  },
  slugify(value: unknown, fallback = 'untitled') {
    const source = typeof value === 'string' && value.trim() ? value : fallback;
    return source
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || fallback;
  },
  localized(value: unknown, locales: string[] = ['en', 'zh', 'ja', 'fr']) {
    const source = isRecord(value) ? value : {};
    return Object.fromEntries(locales.map((locale) => [locale, typeof source[locale] === 'string' ? source[locale] : '']));
  },
  localizedWithFallback(value: unknown, fallback: Record<string, string> = {}, locales: string[] = ['en', 'zh', 'ja', 'fr']) {
    const source = isRecord(value) ? value : {};
    return Object.fromEntries(locales.map((locale) => [locale, typeof source[locale] === 'string' ? source[locale] : fallback[locale] || '']));
  },
  localizedUnlessEmpty(value: unknown, fallback: Record<string, string>, locales: string[] = ['en', 'zh', 'ja', 'fr']) {
    const next = ruleHelpers.localized(value, locales);
    return Object.values(next).some((item) => item.trim().length > 0) ? next : fallback;
  },
  missingLocales(value: unknown, locales: string[] = ['zh', 'ja', 'fr']) {
    const source = isRecord(value) ? value : {};
    return locales.filter((locale) => typeof source[locale] !== 'string' || !source[locale].trim());
  },
  missingLocalizedPaths(value: unknown, paths: string[], locales: string[] = ['zh', 'ja', 'fr']) {
    return paths.flatMap((path) =>
      ruleHelpers.missingLocales(getPath(value, path), locales).map((locale) => ({ path, locale })),
    );
  },
  missingLocalesInList(list: unknown, propertyPath: string, locales: string[] = ['zh', 'ja', 'fr']) {
    if (!Array.isArray(list)) return [];
    return list.flatMap((item, index) =>
      ruleHelpers.missingLocales(getPath(item, propertyPath), locales).map((locale) => ({ index, locale })),
    );
  },
};
