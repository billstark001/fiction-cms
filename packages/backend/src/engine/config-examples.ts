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
  githubPat: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Use environment variable in production
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
          displayName: 'Blog Posts'
        },
        {
          tableName: 'categories',
          editableColumns: ['name', 'description', 'slug', 'color'],
          displayName: 'Category Management'
        },
        {
          tableName: 'tags',
          editableColumns: ['name', 'description', 'slug'],
          displayName: 'Tag Management'
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
          displayName: 'Project Portfolio'
        },
        {
          tableName: 'skills',
          editableColumns: ['name', 'category', 'proficiency', 'years_experience'],
          displayName: 'Skills Management'
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
    errors.push('Site ID cannot be empty');
  }

  if (!config.name) {
    errors.push('Site name cannot be empty');
  }

  if (!config.githubRepositoryUrl) {
    errors.push('GitHub repository URL cannot be empty');
  } else if (!config.githubRepositoryUrl.includes('github.com')) {
    errors.push('Invalid GitHub repository URL format');
  }

  if (!config.githubPat) {
    errors.push('GitHub Personal Access Token cannot be empty');
  } else if (!config.githubPat.startsWith('ghp_')) {
    errors.push('Invalid GitHub Personal Access Token format');
  }

  if (!config.localPath) {
    errors.push('Local path cannot be empty');
  }

  // Validate SQLite file configuration
  if (config.sqliteFiles) {
    config.sqliteFiles.forEach((sqliteFile, index) => {
      if (!sqliteFile.filePath) {
        errors.push(`SQLite file configuration ${index + 1} file path cannot be empty`);
      }
      
      if (!sqliteFile.editableTables || sqliteFile.editableTables.length === 0) {
        errors.push(`SQLite file configuration ${index + 1} must contain at least one editable table`);
      }
      
      sqliteFile.editableTables.forEach((table, tableIndex) => {
        if (!table.tableName) {
          errors.push(`SQLite file ${index + 1} table configuration ${tableIndex + 1} missing table name`);
        }
      });
    });
  }

  return errors;
}