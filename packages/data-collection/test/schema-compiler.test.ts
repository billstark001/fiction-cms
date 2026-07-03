import { describe, expect, it } from 'vitest';
import { compileDataCollectionDefinition, type DataCollectionTypeDefinition } from '../src/index.js';

const profileDefinition: DataCollectionTypeDefinition = {
  type: 'profile',
  title: 'Profile',
  schemaVersion: 1,
  schemaContext: {
    locales: ['en', 'zh', 'ja', 'fr'],
  },
  schemaSource: `
s.object({
  slug: s.string().min(1).regex("^[a-z0-9]+(?:-[a-z0-9]+)*$", "Use kebab-case"),
  name: s.localizedString(locales, ["en"]),
  website: s.union([s.url("Enter a valid URL"), s.literal("")]).optional(),
  image: s.assetReference(locales),
  badge: s.object({
    label: s.localizedString(locales, ["en"]),
    icon: s.enum(["sparkles", "camera"]),
    bg: s.color(),
    text: s.color()
  }).strict()
}).strict().meta({ widget: "profileSchema" })
`,
  defaultValue: {
    slug: 'atlas-noir',
    name: { en: 'Atlas Noir', zh: '', ja: '', fr: '' },
    website: '',
    image: { assetId: 'asset-1' },
    badge: {
      label: { en: 'Sponsor-ready', zh: '', ja: '', fr: '' },
      icon: 'sparkles',
      bg: '#fbd784',
      text: '#0b1d26',
    },
  },
  fieldHints: {
    slug: { label: 'Profile URL slug' },
    website: { label: 'Website' },
  },
};

describe('schema source compiler', () => {
  it('compiles builder source into zod and JSON schema', () => {
    const compiled = compileDataCollectionDefinition(profileDefinition);

    expect(compiled.schemaSpec.kind).toBe('object');
    expect(compiled.jsonSchema).toEqual(expect.objectContaining({ type: 'object' }));
    expect(compiled.schema.safeParse(profileDefinition.defaultValue).success).toBe(true);
  });

  it('reports friendly schema issues with field hints', () => {
    const compiled = compileDataCollectionDefinition(profileDefinition);
    const result = compiled.evaluate({
      ...profileDefinition.defaultValue as Record<string, unknown>,
      slug: 'Atlas Noir',
      website: 'example.com',
    });

    expect(result.passed).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'slug',
          message: 'Profile URL slug has the wrong format.',
        }),
        expect.objectContaining({
          path: 'website',
          message: 'Website must be a valid URL. Include https:// when linking to a web page.',
        }),
      ]),
    );
  });

  it('rejects schema source outside the allowed expression surface', () => {
    expect(() =>
      compileDataCollectionDefinition({
        ...profileDefinition,
        schemaSource: 'process.exit()',
      }),
    ).toThrow();
  });
});
