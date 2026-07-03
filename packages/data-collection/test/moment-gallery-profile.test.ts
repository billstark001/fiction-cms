import { describe, expect, it } from 'vitest';
import { compileDataCollectionDefinition, type DataCollectionTypeDefinition } from '../src/index.js';

type Locale = 'en' | 'zh' | 'ja' | 'fr';
type LocalizedString = Record<Locale, string>;
type AssetRef = { assetId?: string; url?: string; alt?: LocalizedString };
type GalleryProfileData = typeof emptyGalleryProfile;

const locales = ['en', 'zh', 'ja', 'fr'];
const galleryCategories = ['musician', 'artist', 'climber'];
const galleryBadgeIcons = ['music', 'palette', 'mountain', 'sparkles', 'radio', 'camera', 'compass', 'flame', 'gem'];
const galleryMediaTypes = ['photo', 'video', 'music', 'page'];

function l(en: string, zh = '', ja = '', fr = ''): LocalizedString {
  return { en, zh, ja, fr };
}

const emptyLocalizedString = l('');
const defaultGallerySectionNotes = {
  activity: l('', '', '', ''),
  media: l(
    'The visual layer collectors inspect first, and sponsors can confidently stand beside.',
    '这是收藏家第一眼会检查的视觉层，也是赞助商可以放心站在旁边的内容。',
    'コレクターが最初に確認する視覚レイヤーであり、スポンサーも安心して並べる証拠です。',
    'La couche visuelle que les collectionneurs inspectent en premier, et aupres de laquelle les sponsors peuvent se tenir avec confiance.',
  ),
  links: l('', '', '', ''),
};

function emptyAssetRef(): AssetRef {
  return { assetId: '', url: '' };
}

const emptyGalleryProfile = {
  slug: 'new-profile',
  category: 'artist',
  name: { ...emptyLocalizedString, en: 'New profile' },
  handle: 'new.profile',
  role: { ...emptyLocalizedString, en: 'Creator' },
  location: { ...emptyLocalizedString, en: 'City' },
  image: emptyAssetRef(),
  heroImage: emptyAssetRef(),
  summary: { ...emptyLocalizedString, en: 'Short collector-facing summary.' },
  collectorNote: { ...emptyLocalizedString, en: 'Collector note.' },
  sponsorNote: { ...emptyLocalizedString, en: 'Sponsor note.' },
  sectionNotes: defaultGallerySectionNotes,
  sponsorship: {
    amount: l('$10K'),
    useOfFunds: l('Production, travel, and collector proof creation.'),
    exchange: l('Brand exposure and limited release participation.'),
    rights: [{ label: l('Brand exposure'), value: l('Landing page, media proof, and release credits.') }],
  },
  currentActivity: {
    eyebrow: l('Planning'),
    title: l('Upcoming proof drop'),
    date: l('2026'),
    location: l('TBD'),
    description: l('A sponsor-ready activity with collectible media proof.'),
  },
  personalPage: { label: l('Personal page'), href: '' },
  selfBadges: [{ label: l('Sponsor-ready'), icon: 'sparkles', bg: '#fbd784', text: '#0b1d26' }],
  stats: [
    { label: l('Audience'), value: l('TBD') },
    { label: l('Release'), value: l('TBD') },
  ],
  media: [],
  contacts: [],
  socialLinks: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function localized(value: unknown, fallback = emptyLocalizedString) {
  const source = isRecord(value) ? value : {};
  return {
    en: text(source.en, fallback.en),
    zh: text(source.zh, fallback.zh),
    ja: text(source.ja, fallback.ja),
    fr: text(source.fr, fallback.fr),
  };
}

function localizedUnlessEmpty(value: unknown, fallback = emptyLocalizedString) {
  const next = localized(value, emptyLocalizedString);
  return Object.values(next).some((item) => item.trim().length > 0) ? next : fallback;
}

function labelValue(value: unknown, fallback: GalleryProfileData['stats'][number]) {
  const source = isRecord(value) ? value : {};
  return {
    label: localized(source.label, fallback.label),
    value: localized(source.value, fallback.value),
  };
}

function assetRef(value: unknown, fallback: AssetRef = emptyAssetRef()) {
  const source = isRecord(value) ? value : {};
  return {
    assetId: text(source.assetId, fallback.assetId || ''),
    url: text(source.url, fallback.url || ''),
    alt: isRecord(source.alt) ? localized(source.alt, fallback.alt || emptyLocalizedString) : fallback.alt,
  };
}

function list<T>(value: unknown, map: (item: unknown, index: number) => T) {
  return Array.isArray(value) ? value.map(map) : [];
}

function color(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function option<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]) {
  return typeof value === 'string' && options.includes(value) ? value : fallback;
}

function coerceGalleryProfile(value: unknown, defaults: GalleryProfileData = emptyGalleryProfile): GalleryProfileData {
  const source = isRecord(value) ? value : {};

  return {
    slug: text(source.slug, defaults.slug),
    category: option(source.category, galleryCategories, defaults.category),
    name: localized(source.name, defaults.name),
    handle: text(source.handle, defaults.handle),
    role: localized(source.role, defaults.role),
    location: localized(source.location, defaults.location),
    image: assetRef(source.image, defaults.image),
    heroImage: assetRef(source.heroImage, defaults.heroImage),
    summary: localized(source.summary, defaults.summary),
    collectorNote: localized(source.collectorNote, defaults.collectorNote),
    sponsorNote: localized(source.sponsorNote, defaults.sponsorNote),
    sectionNotes: {
      activity: localizedUnlessEmpty(isRecord(source.sectionNotes) ? source.sectionNotes.activity : null, defaultGallerySectionNotes.activity),
      media: localizedUnlessEmpty(isRecord(source.sectionNotes) ? source.sectionNotes.media : null, defaultGallerySectionNotes.media),
      links: localizedUnlessEmpty(isRecord(source.sectionNotes) ? source.sectionNotes.links : null, defaultGallerySectionNotes.links),
    },
    sponsorship: {
      amount: localized(isRecord(source.sponsorship) ? source.sponsorship.amount : null, defaults.sponsorship.amount),
      useOfFunds: localized(isRecord(source.sponsorship) ? source.sponsorship.useOfFunds : null, defaults.sponsorship.useOfFunds),
      exchange: localized(isRecord(source.sponsorship) ? source.sponsorship.exchange : null, defaults.sponsorship.exchange),
      rights: list(isRecord(source.sponsorship) ? source.sponsorship.rights : null, (item, index) =>
        labelValue(item, defaults.sponsorship.rights[index] || defaults.sponsorship.rights[0]),
      ),
    },
    currentActivity: {
      eyebrow: localized(isRecord(source.currentActivity) ? source.currentActivity.eyebrow : null, defaults.currentActivity.eyebrow),
      title: localized(isRecord(source.currentActivity) ? source.currentActivity.title : null, defaults.currentActivity.title),
      date: localized(isRecord(source.currentActivity) ? source.currentActivity.date : null, defaults.currentActivity.date),
      location: localized(isRecord(source.currentActivity) ? source.currentActivity.location : null, defaults.currentActivity.location),
      description: localized(isRecord(source.currentActivity) ? source.currentActivity.description : null, defaults.currentActivity.description),
    },
    personalPage: {
      label: localized(isRecord(source.personalPage) ? source.personalPage.label : null, defaults.personalPage.label),
      href: text(isRecord(source.personalPage) ? source.personalPage.href : null, defaults.personalPage.href),
    },
    selfBadges: list(source.selfBadges, (item, index) => {
      const badge = isRecord(item) ? item : {};
      const fallback = defaults.selfBadges[index] || defaults.selfBadges[0];
      return {
        label: localized(badge.label, fallback.label),
        icon: option(badge.icon, galleryBadgeIcons, fallback.icon),
        bg: color(badge.bg, fallback.bg),
        text: color(badge.text, fallback.text),
      };
    }),
    stats: list(source.stats, (item, index) => labelValue(item, defaults.stats[index] || defaults.stats[0])),
    media: list(source.media, (item) => {
      const media = isRecord(item) ? item : {};
      return {
        type: option(media.type, galleryMediaTypes, 'photo'),
        title: localized(media.title),
        asset: assetRef(media.asset),
        href: text(media.href, ''),
      };
    }),
    contacts: list(source.contacts, (item) => {
      const contact = isRecord(item) ? item : {};
      return {
        label: localized(contact.label),
        value: text(contact.value),
        href: text(contact.href),
      };
    }),
    socialLinks: list(source.socialLinks, (item) => {
      const link = isRecord(item) ? item : {};
      return {
        label: localized(link.label),
        value: text(link.value),
        href: text(link.href),
      };
    }),
  };
}

const localizedWarningPaths = [
  'name',
  'role',
  'location',
  'summary',
  'collectorNote',
  'sponsorNote',
  'sponsorship.amount',
  'sponsorship.useOfFunds',
  'sponsorship.exchange',
  'currentActivity.title',
  'currentActivity.description',
];

const galleryProfileDefinition: DataCollectionTypeDefinition = {
  type: 'galleryProfile',
  title: 'Gallery Profile',
  schemaVersion: 1,
  schemaContext: {
    locales,
    galleryCategories,
    galleryBadgeIcons,
    galleryMediaTypes,
    defaultGallerySectionNotes,
  },
  schemaSource: `
s.object({
  slug: s.string().min(1).regex("^[a-z0-9]+(?:-[a-z0-9]+)*$", "Use kebab-case, for example atlas-noir"),
  category: s.enum(galleryCategories),
  name: s.localizedString(locales, ["en"]),
  handle: s.string().min(1),
  role: s.localizedString(locales, ["en"]),
  location: s.localizedString(locales, ["en"]),
  image: s.assetReference(locales),
  heroImage: s.assetReference(locales),
  summary: s.localizedString(locales, ["en"]),
  collectorNote: s.localizedString(locales, ["en"]),
  sponsorNote: s.localizedString(locales, ["en"]),
  sectionNotes: s.object({
    activity: s.localizedString(locales).default(defaultGallerySectionNotes.activity),
    media: s.localizedString(locales).default(defaultGallerySectionNotes.media),
    links: s.localizedString(locales).default(defaultGallerySectionNotes.links)
  }).strict().default(defaultGallerySectionNotes),
  sponsorship: s.object({
    amount: s.localizedString(locales, ["en"]),
    useOfFunds: s.localizedString(locales, ["en"]),
    exchange: s.localizedString(locales, ["en"]),
    rights: s.array(s.object({
      label: s.localizedString(locales, ["en"]),
      value: s.localizedString(locales, ["en"])
    }).strict())
  }).strict(),
  currentActivity: s.object({
    eyebrow: s.localizedString(locales, ["en"]),
    title: s.localizedString(locales, ["en"]),
    date: s.localizedString(locales, ["en"]),
    location: s.localizedString(locales, ["en"]),
    description: s.localizedString(locales, ["en"])
  }).strict(),
  personalPage: s.object({
    label: s.localizedString(locales, ["en"]),
    href: s.union([s.url("Enter a valid URL"), s.literal("")])
  }).strict(),
  selfBadges: s.array(s.object({
    label: s.localizedString(locales, ["en"]),
    icon: s.enum(galleryBadgeIcons),
    bg: s.color(),
    text: s.color()
  }).strict()),
  stats: s.array(s.object({
    label: s.localizedString(locales, ["en"]),
    value: s.localizedString(locales, ["en"])
  }).strict()),
  media: s.array(s.object({
    type: s.enum(galleryMediaTypes),
    title: s.localizedString(locales, ["en"]),
    asset: s.assetReference(locales),
    href: s.union([s.url("Enter a valid URL"), s.literal("")]).optional()
  }).strict()),
  contacts: s.array(s.object({
    label: s.localizedString(locales, ["en"]),
    value: s.string(),
    href: s.union([s.url("Enter a valid URL"), s.literal("")])
  }).strict()),
  socialLinks: s.array(s.object({
    label: s.localizedString(locales, ["en"]),
    value: s.string(),
    href: s.union([s.url("Enter a valid URL"), s.literal("")])
  }).strict())
}).strict()
`,
  defaultValue: emptyGalleryProfile,
  fieldHints: {
    slug: { label: 'Profile URL slug' },
    image: { label: 'Profile image', widget: 'assetRef' },
    heroImage: { label: 'Hero image', widget: 'assetRef' },
    'personalPage.href': { label: 'Personal page URL', widget: 'url' },
  },
  transform: 'coerceGalleryProfile(data, defaultValue)',
  validations: [
    {
      path: '{{ item.path }}.{{ item.locale }}',
      severity: 'warning',
      each: { source: `missingLocalizedPaths(data, ${JSON.stringify(localizedWarningPaths)})` },
      when: 'true',
      message: 'Missing {{ upper(item.locale) }} translation. English will be used as fallback.',
    },
    { path: 'image', severity: 'error', when: '!hasAssetRef(data.image)', message: 'A library asset or external URL is required.' },
    { path: 'image.assetId', severity: 'error', when: 'data.image.assetId && !assetExists(data.image, assets)', message: 'Referenced asset does not exist.' },
    { path: 'heroImage', severity: 'error', when: '!hasAssetRef(data.heroImage)', message: 'A library asset or external URL is required.' },
    { path: 'heroImage.assetId', severity: 'error', when: 'data.heroImage.assetId && !assetExists(data.heroImage, assets)', message: 'Referenced asset does not exist.' },
    { path: 'selfBadges', severity: 'warning', when: 'data.selfBadges.length === 0', message: 'Add at least one badge so cards have a visible signal.' },
    { path: 'media', severity: 'warning', when: 'data.media.length < 2', message: 'Gallery profiles read better with at least two media items.' },
    {
      path: 'media.{{ item.index }}.title.{{ item.locale }}',
      severity: 'warning',
      each: { source: 'missingLocalesInList(data.media, "title")' },
      when: 'true',
      message: 'Missing {{ upper(item.locale) }} translation. English will be used as fallback.',
    },
    { path: 'media.{{ index }}.asset', severity: 'error', each: { source: 'data.media' }, when: '!hasAssetRef(item.asset)', message: 'A library asset or external URL is required.' },
    { path: 'media.{{ index }}.asset.assetId', severity: 'error', each: { source: 'data.media' }, when: 'item.asset.assetId && !assetExists(item.asset, assets)', message: 'Referenced asset does not exist.' },
    {
      path: 'sponsorship.rights.{{ item.index }}.label.{{ item.locale }}',
      severity: 'warning',
      each: { source: 'missingLocalesInList(data.sponsorship.rights, "label")' },
      when: 'true',
      message: 'Missing {{ upper(item.locale) }} translation. English will be used as fallback.',
    },
    {
      path: 'sponsorship.rights.{{ item.index }}.value.{{ item.locale }}',
      severity: 'warning',
      each: { source: 'missingLocalesInList(data.sponsorship.rights, "value")' },
      when: 'true',
      message: 'Missing {{ upper(item.locale) }} translation. English will be used as fallback.',
    },
    { path: 'personalPage.href', severity: 'warning', when: '!data.personalPage.href', message: 'Personal page URL is empty.' },
  ],
};

const compileOptions = {
  maxSourceLength: 12_000,
  maxAstNodes: 1_500,
  maxAstDepth: 80,
};

function compileGalleryProfile() {
  return compileDataCollectionDefinition(galleryProfileDefinition, compileOptions);
}

const ruleContext = {
  helpers: { coerceGalleryProfile },
};

describe('moment gallery profile fixture', () => {
  it('coerces loose editor data with the same shape as the moment profile editor', () => {
    const compiled = compileGalleryProfile();
    const coerced = compiled.coerce(
      {
        category: 'unknown',
        name: { en: 'Atlas Noir', zh: 42 },
        selfBadges: [{ icon: 'unknown', bg: 'gold', text: '#ffffff' }],
        media: [{ type: 'bad', title: { en: 'Portrait' }, asset: { assetId: 'media-1' } }],
      },
      ruleContext,
    ) as GalleryProfileData;

    expect(coerced.category).toBe('artist');
    expect(coerced.name).toEqual({ en: 'Atlas Noir', zh: '', ja: '', fr: '' });
    expect(coerced.selfBadges[0]).toEqual(
      expect.objectContaining({
        icon: 'sparkles',
        bg: '#fbd784',
        text: '#ffffff',
      }),
    );
    expect(coerced.media[0]).toEqual(
      expect.objectContaining({
        type: 'photo',
        title: { en: 'Portrait', zh: '', ja: '', fr: '' },
      }),
    );
  });

  it('evaluates missing translations, required assets, and editorial warnings', () => {
    const compiled = compileGalleryProfile();
    const result = compiled.evaluate(emptyGalleryProfile, { ...ruleContext, assets: {} });

    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        { severity: 'warning', path: 'name.zh', message: 'Missing ZH translation. English will be used as fallback.' },
        { severity: 'error', path: 'image', message: 'A library asset or external URL is required.' },
        { severity: 'error', path: 'heroImage', message: 'A library asset or external URL is required.' },
        { severity: 'warning', path: 'media', message: 'Gallery profiles read better with at least two media items.' },
        { severity: 'warning', path: 'personalPage.href', message: 'Personal page URL is empty.' },
      ]),
    );
  });

  it('checks referenced assets inside nested media items', () => {
    const compiled = compileGalleryProfile();
    const profile = {
      ...emptyGalleryProfile,
      image: { assetId: 'image-1' },
      heroImage: { assetId: 'hero-1' },
      personalPage: { ...emptyGalleryProfile.personalPage, href: 'https://example.com/atlas-noir' },
      media: [
        { type: 'photo', title: l('Portrait'), asset: { assetId: 'missing-media' }, href: '' },
        { type: 'video', title: l('Proof film'), asset: { url: 'https://cdn.example.com/proof.mp4' }, href: 'https://example.com/proof' },
      ],
    };
    const result = compiled.evaluate(profile, {
      ...ruleContext,
      assets: {
        'image-1': { id: 'image-1' },
        'hero-1': { id: 'hero-1' },
      },
    });

    expect(result.passed).toBe(false);
    expect(result.issues).toContainEqual({
      severity: 'error',
      path: 'media.0.asset.assetId',
      message: 'Referenced asset does not exist.',
    });
    expect(result.issues).not.toContainEqual({
      severity: 'error',
      path: 'image.assetId',
      message: 'Referenced asset does not exist.',
    });
  });

  it('passes structural evaluation when required assets are available', () => {
    const compiled = compileGalleryProfile();
    const profile = {
      ...emptyGalleryProfile,
      image: { assetId: 'image-1' },
      heroImage: { assetId: 'hero-1' },
      personalPage: { ...emptyGalleryProfile.personalPage, href: 'https://example.com/atlas-noir' },
      media: [
        { type: 'photo', title: l('Portrait', '肖像', 'ポートレート', 'Portrait'), asset: { assetId: 'media-1' }, href: '' },
        { type: 'video', title: l('Proof film', '证明影片', 'プルーフ映像', 'Film de preuve'), asset: { url: 'https://cdn.example.com/proof.mp4' }, href: 'https://example.com/proof' },
      ],
    };
    const result = compiled.evaluate(profile, {
      ...ruleContext,
      assets: {
        'image-1': { id: 'image-1' },
        'hero-1': { id: 'hero-1' },
        'media-1': { id: 'media-1' },
      },
    });

    expect(result.passed).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });
});
