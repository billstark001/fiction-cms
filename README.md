# Fiction CMS

A modern, git-native content management system for static sites with GitHub Pages integration.

[中文版本](./README_zh.md) | [Documentation](./docs/README.md)

## Overview

Fiction CMS is a comprehensive content management solution designed for managing multiple static site projects hosted on GitHub. It provides a user-friendly interface for non-technical users to edit Markdown, JSON, and SQLite files within Git repositories, while maintaining full version control and automated deployment capabilities.

### Key Features

- **Git-Native Workflow**: Direct integration with GitHub repositories
- **Multi-Site Management**: Manage multiple static sites from one dashboard  
- **Rich Content Editing**: Markdown editor with live preview, JSON editor with validation, and SQLite database management
- **User Management**: Role-based access control with authentication
- **Automated Deployment**: GitHub Pages integration with build automation
- **File Management**: Asset handling and file organization tools
- **Real-time Collaboration**: Git-based version control and conflict resolution

## Architecture

Fiction CMS follows a modern full-stack architecture:

- **Frontend**: React + TypeScript + Vite with Monaco Editor integration
- **Backend**: Hono.js API server with TypeScript
- **Database**: SQLite with Drizzle ORM for user management
- **Authentication**: PASETO v4 tokens with role-based permissions
- **Content Storage**: Git repositories as the source of truth
- **Deployment**: GitHub Pages with automated builds

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git
- GitHub Personal Access Token (for repository management)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/billstark001/fiction-cms.git
cd fiction-cms
```

2. **Install dependencies**

```bash
pnpm install
# or npm install
```

3. **Configure environment variables**

```bash
# Backend configuration (.env in packages/backend/)
DATABASE_PATH=./fiction-cms.db
PASETO_SECRET_KEY=your-32-character-secret-key-here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Add your GitHub PAT for repository access
GITHUB_PAT=your_github_personal_access_token
```

4. **Start development servers**

```bash
pnpm dev
```

This will start both the backend API server (<http://localhost:3001>) and frontend development server (<http://localhost:3000>).

### Default Access

- **Admin Username**: `admin`
- **Admin Password**: `admin123`

> ⚠️ **Security**: Change the default credentials immediately after first login in production environments.

## Project Structure

```
fiction-cms/
├── packages/
│   ├── backend/           # Hono.js API server
│   │   ├── src/
│   │   │   ├── routes/    # API endpoints
│   │   │   ├── engine/    # CMS core engine
│   │   │   ├── auth/      # Authentication system
│   │   │   └── db/        # Database models
│   │   └── README.md      # Backend documentation
│   └── frontend/          # React frontend
│       ├── src/
│       │   ├── components/ # UI components
│       │   ├── pages/     # Application pages
│       │   ├── hooks/     # Custom React hooks
│       │   └── utils/     # Utility functions
│       └── README.md      # Frontend documentation
├── docs/                  # Comprehensive documentation
└── README.md             # This file
```

## Documentation

Comprehensive documentation is available in the [docs](./docs/) directory:

### For Users

- **[User Guide](./docs/user-guide.md)** - Complete guide for content managers
- **[Site Management](./docs/site-management.md)** - Managing multiple sites
- **[Content Editing](./docs/content-editing.md)** - Working with different file types

### For Maintainers & Developers  

- **[Architecture Overview](./docs/architecture.md)** - System architecture and design decisions
- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Development Setup](./docs/development.md)** - Setting up development environment
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

### Technical References

- **[Engine Documentation](./packages/backend/src/engine/README.md)** - CMS engine integration guide
- **[Configuration Guide](./docs/configuration.md)** - Environment and site configuration
- **[Security Guide](./docs/security.md)** - Security considerations and best practices

## Development

### Development Workflow

1. **Development Server**

```bash
pnpm dev              # Start both frontend and backend
pnpm --filter backend dev   # Backend only  
pnpm --filter frontend dev  # Frontend only
```

2. **Building for Production**  

```bash
pnpm build            # Build both packages
pnpm --filter backend build # Backend only
pnpm --filter frontend build # Frontend only
```

3. **Code Quality**

```bash
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript type checking
```

### Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details on:

- Development workflow
- Code standards
- Testing requirements  
- Pull request process

## Deployment

Fiction CMS can be deployed to various platforms:

- **Docker**: Container-ready with provided Dockerfile
- **Traditional VPS**: Direct deployment with PM2 or systemd
- **Cloud Platforms**: Heroku, Railway, DigitalOcean App Platform

See the [Deployment Guide](./docs/deployment.md) for detailed instructions.

## Use Cases

Fiction CMS is ideal for:

- **Documentation Sites**: Managing technical documentation across multiple projects
- **Blog Networks**: Running multiple blogs with shared user management  
- **Portfolio Sites**: Managing designer/developer portfolios with database-driven content
- **Small Business Sites**: Multiple site management for agencies
- **Educational Content**: Course materials and educational resources

## Technology Stack

### Frontend

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Vanilla Extract** - Type-safe CSS-in-JS
- **Monaco Editor** - VS Code-like editing experience

### Backend  

- **Hono.js** - Fast, lightweight web framework
- **TypeScript** - End-to-end type safety
- **Drizzle ORM** - Type-safe database operations
- **SQLite** - Embedded database for user management
- **PASETO** - Secure token-based authentication

### DevOps & Tools

- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **GitHub Actions** - CI/CD workflows

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/billstark001/fiction-cms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/billstark001/fiction-cms/discussions)
- **Documentation**: [Project Documentation](./docs/)

## Roadmap

Upcoming features and improvements:

- [ ] **Enhanced Database Management**: Visual SQLite table editor
- [ ] **File Upload System**: Asset management with drag-and-drop
- [ ] **Template System**: Site templates and content scaffolding
- [ ] **Plugin Architecture**: Extensible plugin system
- [ ] **Real-time Collaboration**: Multi-user editing with conflict resolution
- [ ] **Advanced Search**: Full-text search across all managed sites
- [ ] **Deployment Monitoring**: Build status and deployment tracking
- [ ] **Backup & Recovery**: Automated backup solutions

---

*Built with ❤️ by [Bill Toshiaki Stark](https://github.com/billstark001)*
