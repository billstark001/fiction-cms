import { describe, expect, it } from 'vitest';
import { ConfigValidator, type SiteConfig } from '../src/index.js';

const createSiteConfig = (overrides: Partial<SiteConfig> = {}): SiteConfig => ({
  id: 'site_1',
  name: 'Demo site',
  githubRepositoryUrl: 'https://github.com/acme/demo',
  githubPat: 'ghp_1234567890',
  localPath: '/tmp/demo',
  ...overrides
});

describe('ConfigValidator', () => {
  it('accepts a valid site config', () => {
    const errors = ConfigValidator.validateSiteConfig(createSiteConfig());

    expect(errors).toEqual([]);
  });

  it('reports required site config fields', () => {
    const errors = ConfigValidator.validateSiteConfig(createSiteConfig({
      id: '',
      name: '',
      githubRepositoryUrl: 'https://gitlab.com/acme/demo',
      githubPat: 'token',
      localPath: ''
    }));

    expect(errors).toEqual(expect.arrayContaining([
      'Site ID cannot be empty',
      'Site name cannot be empty',
      'Invalid GitHub repository URL format',
      'Invalid GitHub Personal Access Token format',
      'Local path cannot be empty'
    ]));
  });

  it('validates editable path restrictions', () => {
    const siteConfig = createSiteConfig({ editablePaths: ['content', 'data/posts'] });

    expect(ConfigValidator.validateFilePath(siteConfig, 'content/page.md')).toEqual({ isValid: true });
    expect(ConfigValidator.validateFilePath(siteConfig, 'private/page.md')).toEqual({
      isValid: false,
      error: 'Access denied: file is not within allowed editable paths'
    });
  });

  it('creates a working zod validator from a model definition', () => {
    const result = ConfigValidator.createZodValidator('z.object({ title: z.string() })');

    expect(result.isValid).toBe(true);
    expect(() => result.validator?.parse({ title: 'Hello' })).not.toThrow();
    expect(() => result.validator?.parse({ title: 1 })).toThrow();
  });
});
