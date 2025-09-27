# Configuration Guide

This guide covers all configuration options for Fiction CMS, including environment variables, site configuration, and system settings.

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in `packages/backend/` with the following variables:

#### Required Settings

```bash
# Database Configuration
DATABASE_PATH=./fiction-cms.db

# Authentication (REQUIRED - Generate secure keys)
PASETO_SECRET_KEY=your-64-character-secret-key-here
```

#### Optional Settings

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# Authentication Tokens
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Settings
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,https://your-domain.com

# File Handling
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
RATE_LIMIT_MAX=100        # Max requests per window

# Logging
LOG_LEVEL=info            # debug, info, warn, error
LOG_FILE=./logs/app.log

# GitHub Integration
GITHUB_PAT=your_github_personal_access_token

# Security
ENCRYPTION_KEY=your-64-character-encryption-key
SECURE_COOKIES=true       # Set to false in development
```

### Frontend Environment Variables

Create a `.env` file in `packages/frontend/` with:

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# Development Settings
VITE_NODE_ENV=development
VITE_DEBUG=true

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEVTOOLS=true
```

### Production Environment

For production deployments, ensure these critical settings:

```bash
NODE_ENV=production
SECURE_COOKIES=true
LOG_LEVEL=warn
CORS_ORIGINS=https://your-production-domain.com
FRONTEND_URL=https://your-production-domain.com

# Generate secure keys for production
PASETO_SECRET_KEY=generate-new-64-char-key
ENCRYPTION_KEY=generate-new-64-char-key
```

## Site Configuration

### Site Configuration Schema

Each site managed by Fiction CMS requires configuration:

```typescript
interface SiteConfig {
  id: string;                    // Unique site identifier
  name: string;                  // Display name
  githubRepositoryUrl: string;   // Full GitHub repository URL
  githubPat: string;            // GitHub Personal Access Token
  localPath: string;            // Local path for repository
  buildCommand: string;         // Build command (e.g., "npm run build")
  buildOutputDir: string;       // Build output directory
  editablePaths: string[];      // Editable directory paths
  sqliteFiles: SQLiteFileConfig[]; // Database configurations
}

interface SQLiteFileConfig {
  filePath: string;             // Path to SQLite file
  editableTables: EditableTable[]; // Editable table configurations
}

interface EditableTable {
  tableName: string;            // Database table name
  editableColumns: string[];    // Columns that can be edited
  displayName: string;          // Human-readable table name
}
```

### Example Site Configurations

#### Hugo Blog Site

```typescript
const hugoBlogConfig: SiteConfig = {
  id: 'hugo-blog',
  name: 'Personal Hugo Blog',
  githubRepositoryUrl: 'https://github.com/username/hugo-blog',
  githubPat: process.env.GITHUB_PAT_BLOG || '',
  localPath: '/var/fiction-cms/repos/hugo-blog',
  buildCommand: 'hugo',
  buildOutputDir: 'public',
  editablePaths: [
    'content/',
    'data/',
    'static/',
    'config.toml'
  ],
  sqliteFiles: [
    {
      filePath: 'data/comments.db',
      editableTables: [
        {
          tableName: 'comments',
          editableColumns: ['author', 'content', 'approved'],
          displayName: 'Blog Comments'
        }
      ]
    }
  ]
};
```

#### Next.js Documentation Site

```typescript
const docsConfig: SiteConfig = {
  id: 'docs-site',
  name: 'Project Documentation',
  githubRepositoryUrl: 'https://github.com/company/docs',
  githubPat: process.env.GITHUB_PAT_DOCS || '',
  localPath: '/var/fiction-cms/repos/docs',
  buildCommand: 'npm run build',
  buildOutputDir: 'out',
  editablePaths: [
    'pages/',
    'content/',
    'public/images/',
    'next.config.js'
  ],
  sqliteFiles: [] // No database for this site
};
```

#### Jekyll Portfolio

```typescript
const portfolioConfig: SiteConfig = {
  id: 'portfolio',
  name: 'Designer Portfolio',
  githubRepositoryUrl: 'https://github.com/designer/portfolio',
  githubPat: process.env.GITHUB_PAT_PORTFOLIO || '',
  localPath: '/var/fiction-cms/repos/portfolio',
  buildCommand: 'bundle exec jekyll build',
  buildOutputDir: '_site',
  editablePaths: [
    '_posts/',
    '_data/',
    '_config.yml',
    'assets/'
  ],
  sqliteFiles: [
    {
      filePath: '_data/portfolio.db',
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
            'featured'
          ],
          displayName: 'Portfolio Projects'
        }
      ]
    }
  ]
};
```

### Site Configuration Management

#### Loading from Environment Variables

You can configure sites using environment variables with the pattern `SITE_{SITE_ID}_{SETTING}`:

```bash
# Site configuration via environment
SITE_BLOG_NAME=My Blog
SITE_BLOG_GITHUB_REPO=https://github.com/user/blog
SITE_BLOG_GITHUB_PAT=ghp_xxxxxxxxxxxx
SITE_BLOG_LOCAL_PATH=/var/repos/blog
SITE_BLOG_BUILD_COMMAND=hugo
SITE_BLOG_BUILD_OUTPUT=public
SITE_BLOG_EDITABLE_PATHS=content/,data/,static/
```

#### Configuration Factory Function

```typescript
export function loadSiteConfigFromEnv(siteId: string): SiteConfig | null {
  const envPrefix = `SITE_${siteId.toUpperCase()}_`;
  
  const githubRepo = process.env[`${envPrefix}GITHUB_REPO`];
  const githubPat = process.env[`${envPrefix}GITHUB_PAT`];
  
  if (!githubRepo || !githubPat) {
    return null;
  }

  return {
    id: siteId,
    name: process.env[`${envPrefix}NAME`] || siteId,
    githubRepositoryUrl: githubRepo,
    githubPat: githubPat,
    localPath: process.env[`${envPrefix}LOCAL_PATH`] || `/var/repos/${siteId}`,
    buildCommand: process.env[`${envPrefix}BUILD_COMMAND`] || 'npm run build',
    buildOutputDir: process.env[`${envPrefix}BUILD_OUTPUT`] || 'dist',
    editablePaths: (process.env[`${envPrefix}EDITABLE_PATHS`] || 'content/').split(','),
    sqliteFiles: [] // Configure separately if needed
  };
}
```

## Security Configuration

### Authentication Security

#### PASETO Key Generation

Generate secure PASETO keys:

```bash
# Generate 64-character hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use a proper key derivation
node -e "
const crypto = require('crypto');
const key = crypto.scrypt('your-password', 'your-salt', 32);
console.log(key.toString('hex'));
"
```

#### GitHub Personal Access Token

Create a GitHub PAT with appropriate permissions:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a new token with these scopes:
   - `repo` - Full repository access
   - `workflow` - Update GitHub Actions workflows (if needed)
   - `read:org` - Read organization membership (if applicable)

### CORS Configuration

Configure CORS for production:

```bash
# Single domain
CORS_ORIGINS=https://your-cms-domain.com

# Multiple domains
CORS_ORIGINS=https://your-cms.com,https://admin.your-cms.com,https://staging.your-cms.com

# Development (allows all origins - NOT for production)
CORS_ORIGINS=*
```

### File System Security

#### Editable Paths Validation

Ensure editable paths are properly scoped:

```typescript
// Good: Specific directories
editablePaths: ['content/', 'data/', 'static/images/']

// Bad: Root access (security risk)
editablePaths: ['/']

// Bad: Parent directory access
editablePaths: ['../sensitive-data/']
```

#### File Size Limits

Configure appropriate file size limits:

```bash
# 10MB limit for content files
MAX_FILE_SIZE=10485760

# 50MB limit for asset uploads
MAX_ASSET_SIZE=52428800

# Individual file type limits (if needed)
MAX_MARKDOWN_SIZE=1048576    # 1MB
MAX_JSON_SIZE=5242880        # 5MB
MAX_IMAGE_SIZE=10485760      # 10MB
```

## Database Configuration

### SQLite Configuration

Fiction CMS uses SQLite for user management and configuration:

```bash
# Database file location
DATABASE_PATH=./data/fiction-cms.db

# Connection settings
DATABASE_TIMEOUT=5000        # Connection timeout in ms
DATABASE_JOURNAL_MODE=WAL    # Write-Ahead Logging mode
DATABASE_SYNCHRONOUS=NORMAL  # Synchronization mode
```

### Migration Configuration

Database migrations are handled automatically, but you can configure behavior:

```bash
# Migration settings
AUTO_MIGRATE=true           # Run migrations on startup
MIGRATION_TIMEOUT=30000     # Migration timeout in ms
BACKUP_BEFORE_MIGRATE=true  # Backup DB before migrations
```

## Logging Configuration

### Log Levels and Output

Configure logging behavior:

```bash
# Log levels: error, warn, info, http, verbose, debug, silly
LOG_LEVEL=info

# Log output destinations
LOG_TO_CONSOLE=true
LOG_TO_FILE=true
LOG_FILE=./logs/fiction-cms.log

# Log rotation
LOG_MAX_SIZE=10m            # Max log file size
LOG_MAX_FILES=5             # Number of rotated files to keep
LOG_DATE_PATTERN=YYYY-MM-DD # Date pattern for rotation
```

### Structured Logging

Enable structured logging for better parsing:

```bash
# JSON formatted logs
LOG_FORMAT=json

# Additional context
LOG_INCLUDE_TIMESTAMP=true
LOG_INCLUDE_LEVEL=true
LOG_INCLUDE_METADATA=true
```

## Performance Configuration

### Caching Settings

Configure caching behavior:

```bash
# In-memory cache settings
CACHE_ENABLED=true
CACHE_TTL=300000           # Cache TTL in ms (5 minutes)
CACHE_MAX_ITEMS=1000       # Max items in cache

# File system cache
FILE_CACHE_ENABLED=true
FILE_CACHE_DIR=./cache
FILE_CACHE_TTL=600000      # 10 minutes
```

### Rate Limiting

Configure API rate limits:

```bash
# General rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000   # 15 minutes
RATE_LIMIT_MAX=100         # Max requests per window

# Authentication rate limiting
AUTH_RATE_LIMIT_WINDOW=300000  # 5 minutes  
AUTH_RATE_LIMIT_MAX=5          # Max login attempts

# File operation rate limiting
FILE_RATE_LIMIT_WINDOW=60000   # 1 minute
FILE_RATE_LIMIT_MAX=30         # Max file operations
```

## Development Configuration

### Development-specific Settings

Settings for development environment:

```bash
# Development server
NODE_ENV=development
DEBUG=fiction-cms:*
VITE_DEBUG=true

# Hot reloading
WATCH_FILES=true
WATCH_EXTENSIONS=.ts,.js,.md,.json

# Development database
USE_IN_MEMORY_DB=false      # Use file-based DB even in dev
SEED_DEV_DATA=true          # Seed with sample data

# Development security (relaxed for convenience)
SECURE_COOKIES=false
CORS_ORIGINS=*
PASETO_SECRET_KEY=dev-secret-key-not-for-production
```

### Testing Configuration

Settings for testing environment:

```bash
NODE_ENV=test
DATABASE_PATH=:memory:      # Use in-memory database for tests
LOG_LEVEL=silent           # Suppress logs during tests
RATE_LIMIT_ENABLED=false   # Disable rate limiting in tests
```

## Configuration Validation

Fiction CMS validates configuration on startup:

### Required Configuration Check

The system checks for required environment variables:

```typescript
const requiredEnvVars = [
  'DATABASE_PATH',
  'PASETO_SECRET_KEY'
];

const missingVars = requiredEnvVars.filter(
  varName => !process.env[varName]
);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}
```

### Production Security Validation

Additional validation for production:

```typescript
if (process.env.NODE_ENV === 'production') {
  const securityIssues = [];
  
  if (process.env.PASETO_SECRET_KEY === 'dev-secret-key-not-for-production') {
    securityIssues.push('Using development PASETO key in production');
  }
  
  if (process.env.CORS_ORIGINS === '*') {
    securityIssues.push('CORS allows all origins in production');
  }
  
  if (securityIssues.length > 0) {
    console.warn('Security warnings:', securityIssues);
  }
}
```

## Configuration Best Practices

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment-specific configurations** for different deployment stages
3. **Generate unique keys** for each environment
4. **Restrict CORS origins** in production
5. **Enable secure cookies** in production
6. **Use HTTPS** in production

### Performance Best Practices

1. **Enable caching** for better performance
2. **Configure appropriate rate limits** to prevent abuse
3. **Use connection pooling** for database operations
4. **Set reasonable file size limits** to prevent resource exhaustion
5. **Enable log rotation** to manage disk usage

### Operational Best Practices

1. **Use structured logging** for better monitoring
2. **Configure health checks** for deployment platforms
3. **Set up monitoring and alerting** for critical metrics
4. **Backup configuration** alongside database backups
5. **Document environment-specific settings** for your team

This configuration guide provides comprehensive coverage of all configurable aspects of Fiction CMS. Adjust settings based on your specific deployment requirements and security policies.