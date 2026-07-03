import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ContentManager,
  commonFileOperations,
  type SiteConfig
} from '../src/index.js';

let tempDir: string;
let siteConfig: SiteConfig;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-engine-content-'));
  siteConfig = {
    id: 'site_content',
    name: 'Content site',
    githubRepositoryUrl: 'https://github.com/acme/content',
    githubPat: 'ghp_1234567890',
    localPath: tempDir,
    editablePaths: ['content']
  };
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('ContentManager', () => {
  it('writes, reads, lists and searches editable text files', async () => {
    const manager = new ContentManager();

    const writeResult = await manager.writeTextFile(siteConfig, 'content/page.md', '# Hello\nFiction CMS');
    const readResult = await manager.readTextFile(siteConfig, 'content/page.md');
    const filesResult = await manager.getEditableFiles(siteConfig);
    const searchResult = await manager.searchFileContent(siteConfig, 'fiction');

    expect(writeResult.success).toBe(true);
    expect(readResult.success).toBe(true);
    expect(readResult.data).toMatchObject({
      path: 'content/page.md',
      content: '# Hello\nFiction CMS'
    });
    expect(filesResult.success).toBe(true);
    expect(filesResult.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'content/page.md', type: 'markdown' })
    ]));
    expect(searchResult.success).toBe(true);
    expect(searchResult.data).toMatchObject({
      searchTerm: 'fiction',
      matchingFiles: 1
    });
  });

  it('blocks file operations outside editable paths', async () => {
    const manager = new ContentManager();

    const result = await manager.writeTextFile(siteConfig, 'private/page.md', 'secret');

    expect(result).toEqual({
      success: false,
      error: 'Access denied: file is not within allowed editable paths'
    });
  });
});

describe('CommonFileOperations', () => {
  it('detects custom text file types', () => {
    const type = commonFileOperations.determineFileType('book.chapter', {
      ...siteConfig,
      customFileTypes: [
        {
          name: 'chapter',
          extensions: ['chapter'],
          isText: true
        }
      ]
    });

    expect(type).toBe('chapter');
    expect(commonFileOperations.isTextFileType(type, {
      ...siteConfig,
      customFileTypes: [
        {
          name: 'chapter',
          extensions: ['chapter'],
          isText: true
        }
      ]
    })).toBe(true);
  });
});
