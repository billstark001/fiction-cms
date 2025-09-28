/**
 * 服务层导出文件
 * 统一导出所有服务模块，便于其他模块使用
 */

export * from './user-service.js';
export * from './role-service.js';
export * from './site-service.js';

// 便捷导入
import { userService } from './user-service.js';
import { roleService } from './role-service.js';
import { siteService } from './site-service.js';

export const services = {
  user: userService,
  role: roleService,
  site: siteService
};