# Development Setup Guide

This guide provides comprehensive instructions for setting up a development environment for Fiction CMS, including tools, dependencies, and workflows for contributors and maintainers.

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0 or higher (LTS recommended)
- **Package Manager**: pnpm (recommended) or npm
- **Git**: Version 2.20 or higher
- **Operating System**: Linux, macOS, or Windows (with WSL2 recommended)

### Tools and Software

**Required:**

- **Code Editor**: VS Code (recommended) with TypeScript extensions
- **Terminal**: Modern terminal with Git bash support
- **GitHub Account**: For repository access and testing

**Recommended:**

- **GitHub CLI**: For streamlined GitHub operations
- **Docker**: For containerized development (optional)
- **SQLite Browser**: For database inspection

### VS Code Extensions

Install these extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-typescript.vscode-typescript-next",
    "esbenp.prettier-vscode", 
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one",
    "ms-vscode.vscode-sqlite"
  ]
}
```

## Getting Started

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/billstark001/fiction-cms.git
cd fiction-cms

# If you're a contributor, fork first and clone your fork
git clone https://github.com/YOUR_USERNAME/fiction-cms.git
cd fiction-cms
git remote add upstream https://github.com/billstark001/fiction-cms.git
```

### 2. Install Dependencies

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install

# Alternative: Use npm if you prefer
npm install
```

### 3. Environment Configuration

Create environment files for development:

```bash
# Backend environment (.env in packages/backend/)
cd packages/backend
cp .env.example .env
```

**Backend Environment Variables (.env):**

```bash
# Database Configuration
DATABASE_PATH=./fiction-cms.db

# Authentication
PASETO_SECRET_KEY=your-32-character-development-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# File Handling
MAX_FILE_SIZE=10485760

# GitHub Integration (for testing)
GITHUB_PAT=your_github_personal_access_token_here

# Logging
LOG_LEVEL=debug
```

**Frontend Environment Variables (.env in packages/frontend/):**

```bash
# API Configuration
VITE_API_URL=http://localhost:3001

# Development
VITE_NODE_ENV=development
```

### 4. Database Setup

The SQLite database will be created automatically on first run, but you can initialize it manually:

```bash
cd packages/backend
pnpm run db:push  # Push schema to database
pnpm run db:studio  # Optional: Open Drizzle Studio
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
pnpm --filter backend dev    # Backend only (port 3001)
pnpm --filter frontend dev   # Frontend only (port 3000)
```

**Development URLs:**

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:3001>
- API Health Check: <http://localhost:3001/api/health>

## Project Structure

### Monorepo Organization

```
fiction-cms/
├── packages/
│   ├── backend/                 # Hono.js API server
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts  
│   │   │   │   ├── sites.ts
│   │   │   │   └── engine.ts
│   │   │   ├── engine/         # CMS core engine
│   │   │   │   ├── content-manager.ts
│   │   │   │   ├── git-manager.ts
│   │   │   │   ├── deployment-engine.ts
│   │   │   │   └── config-examples.ts
│   │   │   ├── auth/           # Authentication system
│   │   │   │   ├── middleware.ts
│   │   │   │   └── tokens.ts
│   │   │   ├── db/             # Database layer
│   │   │   │   ├── schema.ts
│   │   │   │   └── migrations/
│   │   │   ├── utils/          # Utilities
│   │   │   │   ├── logger.ts
│   │   │   │   └── validation.ts
│   │   │   └── config/         # Configuration
│   │   │       └── environment.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── frontend/               # React frontend
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   │   ├── ui/        # Basic UI components
│       │   │   ├── forms/     # Form components
│       │   │   └── editors/   # Editor components
│       │   ├── pages/         # Application pages
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Sites.tsx
│       │   │   ├── SiteManage.tsx
│       │   │   └── Auth.tsx
│       │   ├── hooks/         # Custom React hooks
│       │   │   ├── useAuth.ts
│       │   │   ├── useApi.ts
│       │   │   └── useFileOperations.ts
│       │   ├── utils/         # Utility functions
│       │   │   ├── api.ts
│       │   │   └── constants.ts
│       │   ├── types/         # TypeScript type definitions
│       │   │   └── api.ts
│       │   └── styles/        # CSS and styling
│       │       └── components/
│       ├── public/            # Static assets
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── docs/                      # Documentation
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

### Key Directories Explained

**Backend (`packages/backend/src/`):**

- `routes/`: API endpoint handlers using Hono.js
- `engine/`: Core CMS functionality (file operations, Git, deployment)
- `auth/`: Authentication and authorization logic
- `db/`: Database schema, migrations, and ORM setup
- `utils/`: Shared utilities and helpers
- `config/`: Environment and application configuration

**Frontend (`packages/frontend/src/`):**

- `components/`: Reusable React components organized by feature
- `pages/`: Top-level page components and routing
- `hooks/`: Custom React hooks for state management and API calls
- `utils/`: Client-side utilities and API helpers
- `types/`: TypeScript type definitions
- `styles/`: CSS modules and styling using Vanilla Extract

## Development Workflows

### Code Standards

**TypeScript Configuration:**

- Strict mode enabled for type safety
- Path aliases configured for clean imports
- Consistent tsconfig.json across packages

**ESLint Rules:**

```javascript
// eslint.config.js (if available)
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error'
  }
};
```

**Prettier Configuration:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Git Workflow

**Branch Naming:**

- `feature/description` - New features
- `fix/description` - Bug fixes  
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

**Commit Messages:**
Follow conventional commits format:

```
type(scope): description

feat(engine): add SQLite database editing support
fix(auth): resolve token expiration handling
docs(api): update endpoint documentation
refactor(ui): improve file browser performance
```

### Development Commands

**Package Scripts:**

```bash
# Development
pnpm dev                        # Start both services
pnpm --filter backend dev       # Backend development server
pnpm --filter frontend dev      # Frontend development server

# Building
pnpm build                      # Build all packages
pnpm --filter backend build    # Build backend only
pnpm --filter frontend build   # Build frontend only

# Code Quality
pnpm lint                       # Lint all packages
pnpm lint:fix                   # Fix linting issues
pnpm type-check                 # TypeScript type checking
pnpm format                     # Format code with Prettier

# Database (Backend)
pnpm --filter backend db:push     # Push schema changes
pnpm --filter backend db:studio   # Open Drizzle Studio
pnpm --filter backend db:generate # Generate migrations
```

### Testing

**Test Setup:**

```bash
# Install testing dependencies (if not included)
pnpm add -D vitest @testing-library/react jsdom

# Run tests
pnpm test                       # All tests
pnpm --filter backend test     # Backend tests
pnpm --filter frontend test    # Frontend tests

# Watch mode
pnpm test:watch                # Watch mode for all tests
```

**Backend Testing:**

```typescript
// Example: src/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../index';

describe('Authentication API', () => {
  it('should login with valid credentials', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
  });
});
```

**Frontend Testing:**

```typescript
// Example: src/__tests__/components/SiteCard.test.tsx
import { render, screen } from '@testing-library/react';
import { SiteCard } from '../components/SiteCard';

describe('SiteCard', () => {
  it('renders site information correctly', () => {
    const mockSite = {
      id: 1,
      name: 'Test Site',
      repositoryUrl: 'https://github.com/user/test',
      description: 'A test site'
    };

    render(<SiteCard site={mockSite} />);
    
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('A test site')).toBeInTheDocument();
  });
});
```

## Database Development

### Schema Management

Fiction CMS uses Drizzle ORM for type-safe database operations:

```typescript
// packages/backend/src/db/schema.ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
});

export const sites = sqliteTable('sites', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  repositoryUrl: text('repository_url').notNull(),
  localPath: text('local_path').notNull(),
  config: text('config'), // JSON
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});
```

### Migrations

```bash
# Generate migration after schema changes
pnpm --filter backend db:generate

# Apply migrations
pnpm --filter backend db:push

# Open database browser
pnpm --filter backend db:studio
```

## Debugging

### Backend Debugging

**VS Code Launch Configuration (`.vscode/launch.json`):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/backend/src/index.ts",
      "outFiles": ["${workspaceFolder}/packages/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Logging:**

```typescript
import { logger } from '../utils/logger';

// Use structured logging
logger.info('Processing file operation', {
  siteId,
  filePath,
  operation: 'read',
  userId: user.id
});

logger.error('Git operation failed', {
  error: error.message,
  siteId,
  operation: 'push'
});
```

### Frontend Debugging

**React Developer Tools:**

- Install React DevTools browser extension
- Use React DevTools Profiler for performance analysis

**Browser Console:**

```javascript
// Enable detailed logging in development
localStorage.setItem('debug', 'fiction-cms:*');

// Access application state
window.__FICTION_CMS_DEBUG__ = {
  user: getCurrentUser(),
  sites: getSites(),
  version: getVersion()
};
```

## Performance Optimization

### Backend Optimization

- **Database Indexing**: Add indexes for frequently queried columns
- **Connection Pooling**: Optimize SQLite connection management  
- **Caching**: Implement Redis or in-memory caching for static data
- **Background Jobs**: Use job queues for long-running operations

### Frontend Optimization

- **Code Splitting**: Implement route-based code splitting
- **Lazy Loading**: Load Monaco Editor and large components on demand
- **Memoization**: Use React.memo and useMemo for expensive computations
- **Bundle Analysis**: Regular bundle size analysis and optimization

## Troubleshooting

### Common Development Issues

**Port Already in Use:**

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different ports
PORT=3002 pnpm --filter backend dev
```

**Database Lock Issues:**

```bash
# Close any open database connections
pkill -f "fiction-cms.db"

# Delete database and reinitialize
rm packages/backend/fiction-cms.db
pnpm --filter backend db:push
```

**Node Version Issues:**

```bash
# Use nvm to manage Node versions
nvm use 18
nvm alias default 18
```

**Package Installation Issues:**

```bash
# Clear package manager cache
pnpm store prune
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Getting Help

1. **Check Logs**: Review console output for error details
2. **GitHub Issues**: Search existing issues or create new ones
3. **Discussions**: Use GitHub Discussions for questions
4. **Documentation**: Refer to API docs and architecture overview

## Contributing Guidelines

### Before Contributing

1. **Fork the Repository**: Create your own fork for development
2. **Create Feature Branch**: Use descriptive branch names
3. **Follow Code Standards**: Maintain consistent code style
4. **Write Tests**: Include tests for new functionality
5. **Update Documentation**: Keep docs in sync with changes

### Pull Request Process

1. **Sync with Upstream**: Rebase against latest main branch
2. **Run Quality Checks**: Ensure tests pass and code is formatted
3. **Write Clear Description**: Explain changes and motivation
4. **Link Issues**: Reference related issues in PR description
5. **Request Review**: Tag appropriate reviewers

### Code Review Guidelines

- **Focus on Logic**: Review business logic and edge cases
- **Check Performance**: Consider performance implications
- **Verify Tests**: Ensure adequate test coverage
- **Documentation**: Confirm documentation is updated
- **Security**: Review for potential security issues

This development guide provides the foundation for productive Fiction CMS development. For specific technical questions or advanced topics, please refer to the architecture documentation or create an issue for discussion.
