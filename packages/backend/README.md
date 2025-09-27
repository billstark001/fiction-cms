# Fiction CMS Backend

A comprehensive user management and engine control system built with Hono.js, SQLite, and TypeScript.

## Features

- **User Management**: Complete CRUD operations with role-based access control
- **Authentication**: PASETO v4 tokens with access/refresh token pattern
- **Role-Based Access Control**: Flexible permissions system for multi-site management
- **Engine Integration**: File operations and SQLite data management
- **Input Validation**: Zod schemas for all endpoints
- **Multi-Site Support**: Manage multiple GitHub repositories

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (npm or yarn is also acceptable)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The server will start on `http://localhost:3001`

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@fictioncms.local`

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (revoke refresh token)
- `POST /api/auth/logout-all` - Logout from all devices
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user info

### User Management (`/api/users`)

- `GET /api/users` - List users (with pagination/search)
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/profile` - Update current user profile

### Role Management (`/api/roles`)

- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get specific role
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Site Management (`/api/sites`)

- `GET /api/sites` - List sites
- `GET /api/sites/:id` - Get specific site
- `POST /api/sites` - Create new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site
- `GET /api/sites/:id/config` - Get site configuration

### Engine Control (`/api/engine`)

- `GET /api/engine/sites/:siteId/files` - List editable files
- `GET /api/engine/sites/:siteId/files/*` - Get file content
- `PUT /api/engine/sites/:siteId/files/*` - Update file content
- `POST /api/engine/sites/:siteId/files` - Create new file
- `DELETE /api/engine/sites/:siteId/files/*` - Delete file
- `GET /api/engine/sites/:siteId/sqlite/:database/tables/:table` - Get SQLite table data
- `POST /api/engine/sites/:siteId/sqlite/:database/tables/:table/rows` - Create table row

### System (`/api`)

- `GET /api/health` - Health check
- `GET /api/system/info` - System information
- `GET /api/permissions` - List all permissions

## Example Requests

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create User (requires authentication)

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "username": "new_user",
    "email": "user@example.com", 
    "password": "password123",
    "displayName": "New User"
  }'
```

### List Sites

```bash
curl -X GET http://localhost:3001/api/sites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

The system uses SQLite with the following main tables:

- **users** - User accounts and profiles
- **roles** - User roles (admin, editor, author, viewer)
- **permissions** - Fine-grained permissions
- **sites** - GitHub repository configurations
- **user_roles** - User-role assignments
- **role_permissions** - Role-permission assignments  
- **user_sites** - User-site access with roles
- **refresh_tokens** - Secure session management

## Default Permissions

The system comes with predefined permissions:

- **System**: `system.read`, `system.admin`
- **Users**: `user.read`, `user.write`, `user.delete`, `user.admin`
- **Sites**: `site.read`, `site.write`, `site.delete`, `site.admin`, `site.deploy`
- **Content**: `content.read`, `content.write`, `content.delete`

## Default Roles

- **admin** - Full system access
- **editor** - Content and site management
- **author** - Content creation and editing
- **viewer** - Read-only access

## Environment Variables

```bash
# Database
DATABASE_PATH=./fiction-cms.db

# Authentication
PASETO_SECRET_KEY=your-32-character-secret-key-here

# Server
PORT=3001
NODE_ENV=development
```

## Development Scripts

```bash
# Start development server with hot reload
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Database operations
pnpm run db:push    # Push schema to database
pnpm run db:studio  # Open Drizzle Studio
```

## Architecture

- **Framework**: Hono.js for fast, lightweight API
- **Database**: SQLite with Drizzle ORM
- **Authentication**: PASETO v4 tokens with ed25519 keys
- **Validation**: Zod schemas for type-safe requests
- **File Management**: Integration with Fiction CMS Engine
- **Security**: bcrypt password hashing, token revocation, CORS

## Security Features

- Secure password hashing with bcrypt
- PASETO v4 tokens with ed25519 cryptographic keys
- Token expiration and refresh mechanism
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection protection via ORM
- CORS configuration for cross-origin requests

---

Built with ❤️ for Fiction CMS
