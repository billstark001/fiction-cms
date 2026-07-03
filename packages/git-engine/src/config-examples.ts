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
