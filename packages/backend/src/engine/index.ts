import { gitManager } from './git-manager.js';
import { contentManager } from './content/index.js';
import { deploymentEngine } from './deployment-engine.js';

// 导出所有类型
export * from './types.js';

// 导出管理器实例
export { gitManager, contentManager, deploymentEngine };

// 导出类定义（用于扩展或测试）
export { GitManager } from './git-manager.js';
export { ContentManager } from './content/index.js';
export { DeploymentEngine } from './deployment-engine.js';

// 导出内容管理的各个子模块
export { textFileManager } from './content/text-manager.js';
export { sqliteManager } from './content/sqlite-manager.js';
export { assetManager } from './content/asset-manager.js';
export { commonFileOperations } from './content/common-operations.js';

// 导出各个子模块的类
export { TextFileManager } from './content/text-manager.js';
export { SQLiteManager } from './content/sqlite-manager.js';
export { AssetManager } from './content/asset-manager.js';
export { CommonFileOperations } from './content/common-operations.js';