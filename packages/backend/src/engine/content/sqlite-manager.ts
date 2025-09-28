import Database from 'better-sqlite3';
import path from 'path';
import { createId } from '@paralleldrive/cuid2';
import { 
  SiteConfig, 
  SQLiteOperationResult,
  SQLiteTableData,
  SQLiteFileConfig,
  SQLiteTableConfig
} from '../types.js';
import { BaseManager } from './base-manager.js';
import { commonFileOperations } from './common-operations.js';
import { ConfigValidator } from './config-validator.js';

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
   * 获取SQLite文件的表结构和数据 - 重构版本支持可读/可编辑列
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
        const tableConfig = this.findTableConfig(sqliteConfig, tableName);
        if (!tableConfig) {
          throw new Error('Table is not in the allowed editable list');
        }

        // 获取表结构
        const columnsQuery = `PRAGMA table_info(${this.sanitizeIdentifier(tableName)})`;
        const columnsInfo = db.prepare(columnsQuery).all() as any[];
        const allColumns = columnsInfo.map(col => col.name);

        // 确定可读的列（优先使用readableColumns，否则使用editableColumns，最后使用所有列）
        let readableColumns: string[];
        if (tableConfig.readableColumns && tableConfig.readableColumns.length > 0) {
          readableColumns = tableConfig.readableColumns.filter(col => allColumns.includes(col));
        } else if (tableConfig.editableColumns && tableConfig.editableColumns.length > 0) {
          readableColumns = tableConfig.editableColumns.filter(col => allColumns.includes(col));
        } else {
          readableColumns = allColumns;
        }

        // 确定可编辑的列
        const editableColumns = (tableConfig.editableColumns && tableConfig.editableColumns.length > 0)
          ? tableConfig.editableColumns.filter(col => allColumns.includes(col))
          : allColumns;

        // 构建安全的查询
        const sanitizedColumns = readableColumns.map(col => this.sanitizeIdentifier(col)).join(', ');
        const dataQuery = `SELECT ${sanitizedColumns} FROM ${this.sanitizeIdentifier(tableName)} LIMIT ? OFFSET ?`;
        const rows = db.prepare(dataQuery).all(limit, offset) as Record<string, any>[];

        // 获取总行数
        const countQuery = `SELECT COUNT(*) as total FROM ${this.sanitizeIdentifier(tableName)}`;
        const countResult = db.prepare(countQuery).get() as { total: number };

        const tableData: SQLiteTableData = {
          tableName,
          columns: readableColumns,
          rows,
          totalRows: countResult.total
        };

        // 添加元数据
        return {
          ...tableData,
          meta: {
            editableColumns,
            readableColumns,
            allColumns,
            tableConfig: {
              displayName: tableConfig.displayName,
              primaryKeyStrategy: tableConfig.primaryKeyStrategy,
              defaultValues: tableConfig.defaultValues
            }
          }
        };
      },
      siteConfig,
      sqliteFilePath,
      'SQLite query'
    );
  }

  /**
   * 安全地清理SQL标识符（表名、列名等）
   */
  private sanitizeIdentifier(identifier: string): string {
    // 移除危险字符，只允许字母、数字、下划线
    const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    
    // 确保不为空且不以数字开头
    if (!sanitized || /^[0-9]/.test(sanitized)) {
      throw new Error(`Invalid identifier: ${identifier}`);
    }
    
    // 转义标识符以防止SQL注入
    return `"${sanitized}"`;
  }

  /**
   * 验证并清理参数值
   */
  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value === 'string') {
      // 检查是否包含潜在的SQL注入内容
      const dangerousPatterns = [
        /;\s*drop\s+table/i,
        /;\s*delete\s+from/i,
        /;\s*update\s+.*\s+set/i,
        /;\s*insert\s+into/i,
        /union\s+select/i,
        /--/,
        /\/\*/
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          throw new Error('Potentially dangerous SQL content detected in value');
        }
      }
    }
    
    return value;
  }

  /**
   * 查找表配置
   */
  private findTableConfig(sqliteConfig: SQLiteFileConfig, tableName: string): SQLiteTableConfig | undefined {
    return sqliteConfig.editableTables.find(t => t.tableName === tableName);
  }

  /**
   * 生成主键值
   */
  private generatePrimaryKeyValue(strategy: string = 'auto_increment', columnInfo?: any): any {
    switch (strategy) {
      case 'random_string':
        return createId();
      case 'timestamp':
        return Date.now();
      case 'custom':
        // 返回undefined，让调用者处理
        return undefined;
      case 'auto_increment':
      default:
        // 对于自增列，返回null让数据库处理
        return null;
    }
  }

  /**
   * 插入新行到表中 - 重构版本支持默认值和主键策略
   */
  async insertTableRow(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    data: Record<string, any>,
    userProvidedId?: any
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteOperation(
      (db, sqliteConfig) => {
        const tableConfig = this.findTableConfig(sqliteConfig, tableName);
        if (!tableConfig) {
          throw new Error('Table is not in the allowed editable list');
        }

        // 获取表结构信息
        const columnsQuery = `PRAGMA table_info(${this.sanitizeIdentifier(tableName)})`;
        const columnsInfo = db.prepare(columnsQuery).all() as any[];
        const allColumns = columnsInfo.map((col: any) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          primaryKey: col.pk === 1,
          defaultValue: col.dflt_value
        }));

        // 准备插入数据
        const insertData: Record<string, any> = { ...data };

        // 应用默认值
        if (tableConfig.defaultValues) {
          for (const [column, defaultValue] of Object.entries(tableConfig.defaultValues)) {
            if (insertData[column] === undefined) {
              insertData[column] = defaultValue;
            }
          }
        }

        // 处理主键
        const primaryKeyColumn = allColumns.find(col => col.primaryKey);
        if (primaryKeyColumn && insertData[primaryKeyColumn.name] === undefined) {
          if (userProvidedId !== undefined) {
            insertData[primaryKeyColumn.name] = userProvidedId;
          } else {
            const generatedValue = this.generatePrimaryKeyValue(tableConfig.primaryKeyStrategy);
            if (generatedValue !== undefined) {
              insertData[primaryKeyColumn.name] = generatedValue;
            }
          }
        }

        // 检查可编辑性
        const editableColumns = tableConfig.editableColumns || allColumns.map(col => col.name);
        const insertColumns = Object.keys(insertData);
        const unauthorizedColumns = insertColumns.filter(col => !editableColumns.includes(col));
        
        if (unauthorizedColumns.length > 0) {
          throw new Error(`Editing columns not allowed: ${unauthorizedColumns.join(', ')}`);
        }

        // 验证并清理所有值
        const sanitizedData: Record<string, any> = {};
        for (const [column, value] of Object.entries(insertData)) {
          sanitizedData[column] = this.sanitizeValue(value);
        }

        // 构建安全的INSERT语句
        const columns = Object.keys(sanitizedData);
        const sanitizedColumns = columns.map(col => this.sanitizeIdentifier(col)).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const query = `INSERT INTO ${this.sanitizeIdentifier(tableName)} (${sanitizedColumns}) VALUES (${placeholders})`;
        const params = columns.map(col => sanitizedData[col]);

        const result = db.prepare(query).run(...params);
        
        return {
          success: true,
          rowsAffected: result.changes,
          insertedId: result.lastInsertRowid,
          insertedData: sanitizedData
        };
      },
      siteConfig,
      sqliteFilePath,
      'Insert row'
    );
  }

  /**
   * 更新表中的单行 - 重构版本使用行ID而不是复杂条件
   */
  async updateTableRow(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    rowId: any,
    updateData: Record<string, any>,
    idColumn: string = 'id'
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteOperation(
      (db, sqliteConfig) => {
        const tableConfig = this.findTableConfig(sqliteConfig, tableName);
        if (!tableConfig) {
          throw new Error('Table is not in the allowed editable list');
        }

        // 获取表结构
        const columnsQuery = `PRAGMA table_info(${this.sanitizeIdentifier(tableName)})`;
        const columnsInfo = db.prepare(columnsQuery).all() as any[];
        const allColumns = columnsInfo.map(col => col.name);

        // 检查ID列是否存在
        if (!allColumns.includes(idColumn)) {
          throw new Error(`ID column '${idColumn}' does not exist in table`);
        }

        // 检查可编辑性
        const editableColumns = tableConfig.editableColumns || allColumns;
        const updateColumns = Object.keys(updateData);
        const unauthorizedColumns = updateColumns.filter(col => !editableColumns.includes(col));
        
        if (unauthorizedColumns.length > 0) {
          throw new Error(`Editing columns not allowed: ${unauthorizedColumns.join(', ')}`);
        }

        // 验证并清理所有值
        const sanitizedData: Record<string, any> = {};
        for (const [column, value] of Object.entries(updateData)) {
          sanitizedData[column] = this.sanitizeValue(value);
        }

        // 构建安全的UPDATE语句
        const setClause = updateColumns
          .map(col => `${this.sanitizeIdentifier(col)} = ?`)
          .join(', ');
        
        const query = `UPDATE ${this.sanitizeIdentifier(tableName)} SET ${setClause} WHERE ${this.sanitizeIdentifier(idColumn)} = ?`;
        const params = [...updateColumns.map(col => sanitizedData[col]), this.sanitizeValue(rowId)];

        const result = db.prepare(query).run(...params);

        if (result.changes === 0) {
          throw new Error(`No row found with ${idColumn} = ${rowId}`);
        }

        return {
          success: true,
          rowsAffected: result.changes,
          updatedId: rowId,
          updatedData: sanitizedData
        };
      },
      siteConfig,
      sqliteFilePath,
      'Update row'
    );
  }

  /**
   * 删除表中的单行 - 重构版本使用行ID
   */
  async deleteTableRow(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string,
    rowId: any,
    idColumn: string = 'id'
  ): Promise<SQLiteOperationResult> {
    return this.executeSQLiteOperation(
      (db, sqliteConfig) => {
        const tableConfig = this.findTableConfig(sqliteConfig, tableName);
        if (!tableConfig) {
          throw new Error('Table is not in the allowed editable list');
        }

        // 获取表结构
        const columnsQuery = `PRAGMA table_info(${this.sanitizeIdentifier(tableName)})`;
        const columnsInfo = db.prepare(columnsQuery).all() as any[];
        const allColumns = columnsInfo.map(col => col.name);

        // 检查ID列是否存在
        if (!allColumns.includes(idColumn)) {
          throw new Error(`ID column '${idColumn}' does not exist in table`);
        }

        // 构建安全的DELETE语句
        const query = `DELETE FROM ${this.sanitizeIdentifier(tableName)} WHERE ${this.sanitizeIdentifier(idColumn)} = ?`;
        const params = [this.sanitizeValue(rowId)];

        const result = db.prepare(query).run(...params);

        if (result.changes === 0) {
          throw new Error(`No row found with ${idColumn} = ${rowId}`);
        }

        return {
          success: true,
          rowsAffected: result.changes,
          deletedId: rowId
        };
      },
      siteConfig,
      sqliteFilePath,
      'Delete row'
    );
  }

  /**
   * 获取整个表的数据 - 简化版本，无分页
   */
  async getFullTable(
    siteConfig: SiteConfig,
    sqliteFilePath: string,
    tableName: string
  ): Promise<SQLiteOperationResult> {
    return this.getSQLiteTableData(siteConfig, sqliteFilePath, tableName, Number.MAX_SAFE_INTEGER, 0);
  }

  // ==================== LEGACY METHODS (deprecated but kept for compatibility) ====================
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