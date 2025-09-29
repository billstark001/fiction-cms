import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { loggers } from "../utils/logger";

export async function safeExecute<T>(operation: () => Promise<T>, context: string, params?: any): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    loggers.database.error({ ...params, error }, `Failed to ${context}`);
    throw error;
  }
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in (obj as any)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * 通用查找方法
 */
export async function findByField<T>(
  table: any,
  fields: any,
  fieldName: string,
  value: string,
  entityType: string
): Promise<T | null> {
  return safeExecute(
    async () => {
      const result = await db.select(fields)
        .from(table)
        .where(eq(table[fieldName], value))
        .get();
      return result || null;
    },
    `find ${entityType} by ${fieldName}`,
    { [fieldName]: value }
  );
}

/**
 * 通用获取所有记录方法
 */
export async function findAll<T>(table: any, fields: any, entityType: string): Promise<T[]> {
  return safeExecute(
    () => db.select(fields).from(table),
    `get all ${entityType}s`
  );
}

/**
 * 检查实体是否存在
 */
export async function entityExists(table: any, fieldName: string, value: string, excludeId?: string): Promise<boolean> {
  return safeExecute(
    async () => {
      let condition = eq(table[fieldName], value);
      if (excludeId) {
        condition = and(condition, ne(table.id, excludeId))!;
      }
      const result = await db.select({ id: table.id }).from(table).where(condition).get();
      return !!result;
    },
    `check ${fieldName} existence`,
    { [fieldName]: value, excludeId }
  );
}