import { createId } from '@paralleldrive/cuid2';
import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const cmsTexts = pgTable(
  'cms_texts',
  {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    key: text('key').notNull(),
    content: text('content').notNull(),
    contentType: text('content_type').notNull().default('text/plain'),
    encoding: text('encoding').notNull().default('utf8'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    version: text('version'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('cms_texts_key_idx').on(table.key),
    index('cms_texts_updated_at_idx').on(table.updatedAt),
  ],
);

export const cmsDataRecords = pgTable(
  'cms_data_records',
  {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    collection: text('collection').notNull(),
    slug: text('slug'),
    status: text('status').notNull().default('draft'),
    schemaVersion: text('schema_version').notNull().default('1'),
    data: jsonb('data').$type<unknown>().notNull(),
    evaluation: jsonb('evaluation').$type<unknown | null>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('cms_data_records_collection_idx').on(table.collection),
    uniqueIndex('cms_data_records_collection_slug_active_idx').on(table.collection, table.slug),
  ],
);

export const cmsAuditEvents = pgTable(
  'cms_audit_events',
  {
    id: text('id').$defaultFn(() => createId()).primaryKey(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before').$type<unknown | null>(),
    after: jsonb('after').$type<unknown | null>(),
    diff: jsonb('diff').$type<unknown | null>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('cms_audit_events_entity_idx').on(table.entityType, table.entityId),
    index('cms_audit_events_created_at_idx').on(table.createdAt),
  ],
);

export const cmsPsqlSchema = {
  cmsTexts,
  cmsDataRecords,
  cmsAuditEvents,
};
