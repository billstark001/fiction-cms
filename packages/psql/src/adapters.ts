import { and, eq, like } from 'drizzle-orm';
import type { DataCollectionRecord, DataCollectionStore, TextRecord, TextStore } from '@fiction-cms/common';
import { cmsDataRecords, cmsTexts } from './schema.js';

type DrizzleDb = {
  select: (...args: unknown[]) => any;
  insert: (...args: unknown[]) => any;
  update: (...args: unknown[]) => any;
  delete: (...args: unknown[]) => any;
};

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapText(row: typeof cmsTexts.$inferSelect): TextRecord {
  return {
    id: row.id,
    key: row.key,
    content: row.content,
    contentType: row.contentType,
    encoding: 'utf8',
    metadata: row.metadata,
    version: row.version,
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!,
  };
}

function mapDataRecord(row: typeof cmsDataRecords.$inferSelect): DataCollectionRecord {
  return {
    id: row.id,
    collection: row.collection,
    slug: row.slug ?? undefined,
    status: row.status as DataCollectionRecord['status'],
    schemaVersion: Number(row.schemaVersion),
    data: row.data,
    evaluation: row.evaluation,
    metadata: row.metadata,
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!,
    publishedAt: iso(row.publishedAt),
  };
}

export function createPsqlTextStore(db: DrizzleDb): TextStore {
  return {
    async getText(key) {
      const rows = await db.select().from(cmsTexts).where(eq(cmsTexts.key, key)).limit(1);
      return rows[0] ? mapText(rows[0]) : null;
    },

    async putText(input) {
      const now = new Date();
      const current = await this.getText(input.key);
      if (current) {
        const rows = await db
          .update(cmsTexts)
          .set({
            content: input.content,
            contentType: input.contentType,
            encoding: input.encoding,
            metadata: input.metadata,
            version: input.version ?? null,
            updatedAt: now,
          })
          .where(eq(cmsTexts.key, input.key))
          .returning();
        return mapText(rows[0]);
      }

      const rows = await db
        .insert(cmsTexts)
        .values({
          id: input.id,
          key: input.key,
          content: input.content,
          contentType: input.contentType,
          encoding: input.encoding,
          metadata: input.metadata,
          version: input.version ?? null,
        })
        .returning();
      return mapText(rows[0]);
    },

    async deleteText(key) {
      const rows = await db.delete(cmsTexts).where(eq(cmsTexts.key, key)).returning({ id: cmsTexts.id });
      return rows.length > 0;
    },

    async listTexts(prefix = '') {
      const query = db.select().from(cmsTexts);
      const rows = prefix ? await query.where(like(cmsTexts.key, `${prefix}%`)) : await query;
      return rows.map(mapText);
    },
  };
}

export function createPsqlDataCollectionStore(db: DrizzleDb): DataCollectionStore {
  return {
    async getDataRecord(collection, id) {
      const rows = await db
        .select()
        .from(cmsDataRecords)
        .where(and(eq(cmsDataRecords.collection, collection), eq(cmsDataRecords.id, id)))
        .limit(1);
      return rows[0] ? mapDataRecord(rows[0]) : null;
    },

    async putDataRecord(input) {
      const now = new Date();
      const current = await this.getDataRecord(input.collection, input.id);
      if (current) {
        const rows = await db
          .update(cmsDataRecords)
          .set({
            slug: input.slug ?? null,
            status: input.status,
            schemaVersion: String(input.schemaVersion),
            data: input.data,
            evaluation: input.evaluation ?? null,
            metadata: input.metadata,
            publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
            updatedAt: now,
          })
          .where(and(eq(cmsDataRecords.collection, input.collection), eq(cmsDataRecords.id, input.id)))
          .returning();
        return mapDataRecord(rows[0]);
      }

      const rows = await db
        .insert(cmsDataRecords)
        .values({
          id: input.id,
          collection: input.collection,
          slug: input.slug ?? null,
          status: input.status,
          schemaVersion: String(input.schemaVersion),
          data: input.data,
          evaluation: input.evaluation ?? null,
          metadata: input.metadata,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        })
        .returning();
      return mapDataRecord(rows[0]);
    },

    async deleteDataRecord(collection, id) {
      const rows = await db
        .delete(cmsDataRecords)
        .where(and(eq(cmsDataRecords.collection, collection), eq(cmsDataRecords.id, id)))
        .returning({ id: cmsDataRecords.id });
      return rows.length > 0;
    },

    async listDataRecords(collection) {
      const rows = await db.select().from(cmsDataRecords).where(eq(cmsDataRecords.collection, collection));
      return rows.map(mapDataRecord);
    },
  };
}
