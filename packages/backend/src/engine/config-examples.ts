import { SiteConfig } from './types.js';

/**
 * 示例站点配置
 * 展示如何配置不同类型的站点
 */

// 博客站点示例
export const blogSiteConfig: SiteConfig = {
  id: 'my-blog',
  name: 'My Personal Blog',
  githubRepositoryUrl: 'https://github.com/username/my-blog',
  githubPat: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // 实际使用时从环境变量获取
  localPath: '/var/fiction-cms/repos/my-blog',
  buildCommand: 'npm run build',
  buildOutputDir: 'dist',
  editablePaths: [
    'content/posts/',
    'content/pages/',
    'data/',
    'static/images/'
  ],
  sqliteFiles: [
    {
      filePath: 'data/blog.db',
      editableTables: [
        {
          tableName: 'posts',
          editableColumns: ['title', 'slug', 'content', 'excerpt', 'published_at', 'featured'],
          displayName: '博客文章'
        },
        {
          tableName: 'categories',
          editableColumns: ['name', 'description', 'slug', 'color'],
          displayName: '分类管理'
        },
        {
          tableName: 'tags',
          editableColumns: ['name', 'description', 'slug'],
          displayName: '标签管理'
        }
      ]
    }
  ]
};

// 文档站点示例
export const docsSiteConfig: SiteConfig = {
  id: 'project-docs',
  name: 'Project Documentation',
  githubRepositoryUrl: 'https://github.com/company/project-docs',
  githubPat: process.env.GITHUB_PAT_DOCS || '',
  localPath: '/var/fiction-cms/repos/project-docs',
  buildCommand: 'yarn build',
  buildOutputDir: 'build',
  editablePaths: [
    'docs/',
    'i18n/',
    'static/'
  ],
  sqliteFiles: []
};

// 作品集站点示例
export const portfolioSiteConfig: SiteConfig = {
  id: 'portfolio',
  name: 'Designer Portfolio',
  githubRepositoryUrl: 'https://github.com/designer/portfolio',
  githubPat: process.env.GITHUB_PAT_PORTFOLIO || '',
  localPath: '/var/fiction-cms/repos/portfolio',
  buildCommand: 'pnpm build',
  buildOutputDir: 'out',
  editablePaths: [
    'content/',
    'public/images/',
    'data/'
  ],
  sqliteFiles: [
    {
      filePath: 'data/portfolio.db',
      editableTables: [
        {
          tableName: 'projects',
          editableColumns: [
            'title',
            'description', 
            'technologies',
            'image_url',
            'project_url',
            'github_url',
            'featured',
            'completed_at'
          ],
          displayName: '项目作品'
        },
        {
          tableName: 'skills',
          editableColumns: ['name', 'category', 'proficiency', 'years_experience'],
          displayName: '技能管理'
        }
      ]
    }
  ]
};

/**
 * 根据环境变量构建站点配置的工厂函数
 */
export function createSiteConfig(
  id: string,
  overrides: Partial<SiteConfig> = {}
): SiteConfig {
  const baseConfig: SiteConfig = {
    id,
    name: id,
    githubRepositoryUrl: '',
    githubPat: '',
    localPath: `/var/fiction-cms/repos/${id}`,
    buildCommand: 'npm run build',
    buildOutputDir: 'dist',
    editablePaths: ['content/', 'data/', 'static/'],
    sqliteFiles: [],
    ...overrides
  };

  return baseConfig;
}

/**
 * 从环境变量加载站点配置
 */
export function loadSiteConfigFromEnv(siteId: string): SiteConfig | null {
  const envPrefix = `SITE_${siteId.toUpperCase()}_`;
  
  const githubRepo = process.env[`${envPrefix}GITHUB_REPO`];
  const githubPat = process.env[`${envPrefix}GITHUB_PAT`];
  
  if (!githubRepo || !githubPat) {
    return null;
  }

  return createSiteConfig(siteId, {
    name: process.env[`${envPrefix}NAME`] || siteId,
    githubRepositoryUrl: githubRepo,
    githubPat: githubPat,
    localPath: process.env[`${envPrefix}LOCAL_PATH`] || `/var/fiction-cms/repos/${siteId}`,
    buildCommand: process.env[`${envPrefix}BUILD_COMMAND`] || 'npm run build',
    buildOutputDir: process.env[`${envPrefix}BUILD_OUTPUT`] || 'dist',
    editablePaths: process.env[`${envPrefix}EDITABLE_PATHS`]?.split(',') || ['content/', 'data/'],
  });
}

/**
 * 验证站点配置
 */
export function validateSiteConfig(config: SiteConfig): string[] {
  const errors: string[] = [];

  if (!config.id) {
    errors.push('站点ID不能为空');
  }

  if (!config.name) {
    errors.push('站点名称不能为空');
  }

  if (!config.githubRepositoryUrl) {
    errors.push('GitHub仓库URL不能为空');
  } else if (!config.githubRepositoryUrl.includes('github.com')) {
    errors.push('GitHub仓库URL格式不正确');
  }

  if (!config.githubPat) {
    errors.push('GitHub个人访问令牌不能为空');
  } else if (!config.githubPat.startsWith('ghp_')) {
    errors.push('GitHub个人访问令牌格式不正确');
  }

  if (!config.localPath) {
    errors.push('本地路径不能为空');
  }

  // 验证SQLite文件配置
  if (config.sqliteFiles) {
    config.sqliteFiles.forEach((sqliteFile, index) => {
      if (!sqliteFile.filePath) {
        errors.push(`SQLite文件配置${index + 1}的文件路径不能为空`);
      }
      
      if (!sqliteFile.editableTables || sqliteFile.editableTables.length === 0) {
        errors.push(`SQLite文件配置${index + 1}必须至少包含一个可编辑的表`);
      }
      
      sqliteFile.editableTables.forEach((table, tableIndex) => {
        if (!table.tableName) {
          errors.push(`SQLite文件${index + 1}的表配置${tableIndex + 1}缺少表名`);
        }
      });
    });
  }

  return errors;
}