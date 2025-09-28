import Database from 'better-sqlite3';
import path from 'path';
import { 
  SiteConfig, 
  SQLiteOperationResult,
  SQLiteTableData,
  SQLiteFileConfig 
} from '../types.js';
import { BaseManager } from './base-manager.js';
import { commonFileOperations } from './common-operations.js';

/**
 * SQLite 数据库管理器
 * 负责处理 SQLite 数据库的 CRUD 操作
 */
export class SQLiteManager extends BaseManager {
  private sqliteConnections: Map<string, Database.Database> = new Map();

  /**
   * 执行SQLite操作的安全包装器
   */
  private async executeSQLiteOperation<T>(
    operation: (db: Database.Database, config: SQLiteFileConfig) => T,
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    operationName: string
  ): Promise<SQLiteOperationResult> {
    try {
      const sqliteConfig = this.getSQLiteFileConfig(siteConfig, sqliteFilePath);
      if (!sqliteConfig) {
        return {
          success: false,
          error: 'SQLite file is not in the allowed editable list'
        };
      }

      const db = await this.getSQLiteConnection(siteConfig, sqliteFilePath);
      const result = operation(db, sqliteConfig);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `${operationName} failed`
      };
    }
  }

  /**
   * 获取SQLite文件的表结构和数据
   */
  async getSQLiteTableData(
    siteConfig: SiteConfig, 
    sqliteFilePath: string, 
    tableName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteOperation(
      (db, sqliteConfig) => {
        const tableConfig = sqliteConfig.editableTables.find(t => t.tableName === tableName);
        if (!tableConfig) {
          throw new Error('Table is not in the allowed editable list');
        }

        // 获取表结构
        const columnsQuery = `PRAGMA table_info(${tableName})`;
        const columnsInfo = db.prepare(columnsQuery).all() as any[];
        const allColumns = columnsInfo.map(col => col.name);

        // 过滤可编辑的列
        const editableColumns = (tableConfig.editableColumns && tableConfig.editableColumns.length > 0)
          ? tableConfig.editableColumns.filter(col => allColumns.includes(col))
          : allColumns;

        // 获取数据
        const dataQuery = `SELECT ${editableColumns.join(', ')} FROM ${tableName} LIMIT ? OFFSET ?`;
        const rows = db.prepare(dataQuery).all(limit, offset) as Record<string, any>[];

        // 获取总行数
        const countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
        const countResult = db.prepare(countQuery).get() as { total: number };

        const tableData: SQLiteTableData = {
          tableName,
          columns: editableColumns,
          rows,
          totalRows: countResult.total
        };

        return tableData;
      },
      siteConfig,
      sqliteFilePath,
      'SQLite query'
    );
  }

  /**
   * 执行SQLite修改操作的包装器（带事务支持）
   */
  private async executeSQLiteModifyOperation(
    operation: (db: Database.Database, tableConfig: any) => number,
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    operationName: string
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteOperation(
      (db, sqliteConfig) => {
        const tableConfig = sqliteConfig.editableTables.find(t => t.tableName === tableName);
        if (!tableConfig) {
          throw new Error('Table is not in the allowed editable list');
        }

        const rowsAffected = operation(db, tableConfig);
        return { rowsAffected };
      },
      siteConfig,
      sqliteFilePath,
      operationName
    ).then(result => ({
      ...result,
      rowsAffected: result.success ? (result.data as any)?.rowsAffected : 0
    }));
  }

  /**
   * 更新SQLite表中的数据
   */
  async updateSQLiteData(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    updates: Array<{
      whereCondition: Record<string, any>;
      updateData: Record<string, any>;
    }>
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteModifyOperation(
      (db, tableConfig) => {
        let totalRowsAffected = 0;

        // 开启事务
        const transaction = db.transaction(() => {
          for (const update of updates) {
            // 检查要更新的列是否在允许列表中
            const updateColumns = Object.keys(update.updateData);
            const unauthorizedColumns = updateColumns.filter(
              col => tableConfig.editableColumns.length > 0 && !tableConfig.editableColumns.includes(col)
            );

            if (unauthorizedColumns.length > 0) {
              throw new Error(`Editing columns not allowed: ${unauthorizedColumns.join(', ')}`);
            }

            // 构建UPDATE语句
            const setClause = updateColumns.map(col => `${col} = ?`).join(', ');
            const whereClause = Object.keys(update.whereCondition).map(col => `${col} = ?`).join(' AND ');
            
            const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
            const params = [
              ...updateColumns.map(col => update.updateData[col]),
              ...Object.values(update.whereCondition)
            ];

            const result = db.prepare(query).run(...params);
            totalRowsAffected += result.changes;
          }
        });

        transaction();
        return totalRowsAffected;
      },
      siteConfig,
      sqliteFilePath,
      tableName,
      'SQLite update'
    );
  }

  /**
   * 在SQLite表中插入新数据
   */
  async insertSQLiteData(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    insertData: Record<string, any>[]
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteModifyOperation(
      (db, tableConfig) => {
        let totalRowsAffected = 0;

        const transaction = db.transaction(() => {
          for (const data of insertData) {
            const insertColumns = Object.keys(data);
            const unauthorizedColumns = insertColumns.filter(
              col => tableConfig.editableColumns.length > 0 && !tableConfig.editableColumns.includes(col)
            );

            if (unauthorizedColumns.length > 0) {
              throw new Error(`Editing columns not allowed: ${unauthorizedColumns.join(', ')}`);
            }

            const columns = insertColumns.join(', ');
            const placeholders = insertColumns.map(() => '?').join(', ');
            const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
            const params = insertColumns.map(col => data[col]);

            const result = db.prepare(query).run(...params);
            totalRowsAffected += result.changes;
          }
        });

        transaction();
        return totalRowsAffected;
      },
      siteConfig,
      sqliteFilePath,
      tableName,
      'SQLite insert'
    );
  }

  /**
   * 删除SQLite表中的数据
   */
  async deleteSQLiteData(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    whereConditions: Record<string, any>[]
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteModifyOperation(
      (db, tableConfig) => {
        let totalRowsAffected = 0;

        const transaction = db.transaction(() => {
          for (const condition of whereConditions) {
            const whereClause = Object.keys(condition).map(col => `${col} = ?`).join(' AND ');
            const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
            const params = Object.values(condition);

            const result = db.prepare(query).run(...params);
            totalRowsAffected += result.changes;
          }
        });

        transaction();
        return totalRowsAffected;
      },
      siteConfig,
      sqliteFilePath,
      tableName,
      'SQLite delete'
    );
  }

  /**
   * 获取SQLite数据库中的所有表名
   */
  async getSQLiteTables(siteConfig: SiteConfig, sqliteFilePath: string): Promise<SQLiteOperationResult> {
    return this.executeSQLiteOperation(
      (db, sqliteConfig) => {
        // 获取所有表名
        const tablesQuery = "SELECT name FROM sqlite_master WHERE type='table'";
        const tables = db.prepare(tablesQuery).all() as { name: string }[];
        
        // 过滤可编辑的表
        const editableTables = sqliteConfig.editableTables.map(t => ({
          tableName: t.tableName,
          displayName: t.displayName || t.tableName,
          editableColumns: t.editableColumns,
          exists: tables.some(table => table.name === t.tableName)
        }));

        return {
          allTables: tables.map(t => t.name),
          editableTables
        };
      },
      siteConfig,
      sqliteFilePath,
      'Get table list'
    );
  }

  /**
   * 执行自定义SQLite查询（只读）
   */
  async executeReadOnlyQuery(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    query: string,
    params: any[] = []
  ): Promise<SQLiteOperationResult> {
    // 确保是只读查询
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select') && !normalizedQuery.startsWith('pragma')) {
      return {
        success: false,
        error: 'Only SELECT and PRAGMA queries are allowed'
      };
    }

    return this.executeSQLiteOperation(
      (db) => {
        return db.prepare(query).all(...params);
      },
      siteConfig,
      sqliteFilePath,
      'Query execution'
    );
  }

  /**
   * 获取SQLite文件配置
   */
  private getSQLiteFileConfig(siteConfig: SiteConfig, sqliteFilePath: string): SQLiteFileConfig | null {
    const { sqliteFiles = [] } = siteConfig;
    return sqliteFiles.find(config => config.filePath === sqliteFilePath) || null;
  }

  /**
   * 获取SQLite数据库连接
   */
  private async getSQLiteConnection(siteConfig: SiteConfig, sqliteFilePath: string): Promise<Database.Database> {
    const fullPath = path.join(siteConfig.localPath, sqliteFilePath);
    const connectionKey = `${siteConfig.id}:${sqliteFilePath}`;

    if (!this.sqliteConnections.has(connectionKey)) {
      // 检查文件是否存在
      if (!(await commonFileOperations.fileExists(fullPath))) {
        throw new Error(`SQLite file does not exist: ${sqliteFilePath}`);
      }

      const db = new Database(fullPath);
      this.sqliteConnections.set(connectionKey, db);
    }

    return this.sqliteConnections.get(connectionKey)!;
  }

  /**
   * 关闭SQLite连接
   */
  closeSQLiteConnection(siteId: string, sqliteFilePath?: string): void {
    if (sqliteFilePath) {
      const connectionKey = `${siteId}:${sqliteFilePath}`;
      const connection = this.sqliteConnections.get(connectionKey);
      if (connection) {
        connection.close();
        this.sqliteConnections.delete(connectionKey);
      }
    } else {
      // 关闭该站点的所有SQLite连接
      for (const [key, connection] of this.sqliteConnections.entries()) {
        if (key.startsWith(`${siteId}:`)) {
          connection.close();
          this.sqliteConnections.delete(key);
        }
      }
    }
  }

  /**
   * 关闭所有SQLite连接
   */
  closeAllSQLiteConnections(): void {
    for (const connection of this.sqliteConnections.values()) {
      connection.close();
    }
    this.sqliteConnections.clear();
  }
}

// 导出单例实例
export const sqliteManager = new SQLiteManager();