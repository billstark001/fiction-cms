import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLiteManager, type SiteConfig } from '../src/index.js';

let tempDir: string;
let dbPath: string;
let manager: SQLiteManager;
let siteConfig: SiteConfig;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-engine-sqlite-'));
  dbPath = path.join(tempDir, 'content.db');

  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      secret TEXT
    );
    INSERT INTO posts (title, body, secret) VALUES ('First', 'Hello', 'hidden');
  `);
  db.close();

  manager = new SQLiteManager();
  siteConfig = {
    id: 'site_sqlite',
    name: 'SQLite site',
    githubRepositoryUrl: 'https://github.com/acme/sqlite',
    githubPat: 'ghp_1234567890',
    localPath: tempDir,
    sqliteFiles: [
      {
        filePath: 'content.db',
        editableTables: [
          {
            tableName: 'posts',
            editableColumns: ['title', 'body'],
            readableColumns: ['id', 'title', 'body']
          }
        ]
      }
    ]
  };
});

afterEach(async () => {
  manager.closeAllSQLiteConnections();
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('SQLiteManager integration', () => {
  it('reads configured columns and hides non-readable columns', async () => {
    const result = await manager.getSQLiteTableData(siteConfig, 'content.db', 'posts');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      tableName: 'posts',
      columns: ['id', 'title', 'body'],
      totalRows: 1
    });
    expect(result.data.rows[0]).toEqual({
      id: 1,
      title: 'First',
      body: 'Hello'
    });
  });

  it('inserts and updates rows while enforcing editable columns', async () => {
    const insertResult = await manager.insertTableRow(siteConfig, 'content.db', 'posts', {
      title: 'Second',
      body: 'World'
    });

    expect(insertResult.success).toBe(true);
    expect(insertResult.data.rowsAffected).toBe(1);

    const updateResult = await manager.updateTableRow(siteConfig, 'content.db', 'posts', '2', {
      title: 'Second updated'
    });
    const blockedResult = await manager.updateTableRow(siteConfig, 'content.db', 'posts', '2', {
      secret: 'leaked'
    });

    expect(updateResult.success).toBe(true);
    expect(blockedResult).toEqual({
      success: false,
      error: 'Editing columns not allowed: secret'
    });
  });

  it('deletes rows by id', async () => {
    const result = await manager.deleteTableRow(siteConfig, 'content.db', 'posts', '1');
    const tableResult = await manager.getSQLiteTableData(siteConfig, 'content.db', 'posts');

    expect(result.success).toBe(true);
    expect(tableResult.data.totalRows).toBe(0);
  });
});
