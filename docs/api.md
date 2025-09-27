# API Documentation

This document provides comprehensive reference for Fiction CMS REST API endpoints. The API provides programmatic access to site management, content editing, user management, and deployment features.

## Base URL

All API endpoints are relative to the base URL:
```
http://localhost:3001/api  # Development
https://your-cms-domain.com/api  # Production
```

## Authentication

Fiction CMS uses PASETO v4 tokens for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-paseto-token>
```

### Getting an Authentication Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "v4.local.xxx...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "roles": ["admin"]
  },
  "expiresIn": "15m"
}
```

## API Endpoints

### Authentication (`/api/auth`)

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "number",
    "username": "string", 
    "email": "string",
    "roles": ["string"]
  },
  "expiresIn": "string"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "string",
  "expiresIn": "string"
}
```

### User Management (`/api/users`)

#### List Users
```http
GET /api/users
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)  
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search users by username/email

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com", 
      "roles": ["admin"],
      "createdAt": "2024-12-01T00:00:00.000Z",
      "updatedAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Get User Details  
```http
GET /api/users/{userId}
Authorization: Bearer <token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "roles": ["editor"]
}
```

#### Update User
```http
PUT /api/users/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "updateduser",
  "email": "updated@example.com",
  "roles": ["editor", "viewer"]
}
```

#### Delete User
```http
DELETE /api/users/{userId}
Authorization: Bearer <token>
```

### Site Management (`/api/sites`)

#### List Sites
```http
GET /api/sites
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `search` (optional): Search sites by name/URL

**Success Response (200):**
```json
{
  "success": true,
  "sites": [
    {
      "id": 1,
      "name": "My Blog",
      "repositoryUrl": "https://github.com/user/blog",
      "localPath": "/var/fiction-cms/repos/blog",
      "buildCommand": "hugo",
      "buildOutputDir": "public",
      "editablePaths": ["content/", "data/"],
      "sqliteFiles": [],
      "createdAt": "2024-12-01T00:00:00.000Z",
      "updatedAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Get Site Details
```http
GET /api/sites/{siteId}
Authorization: Bearer <token>
```

#### Create Site
```http
POST /api/sites
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Site",
  "repositoryUrl": "https://github.com/user/new-site",
  "localPath": "/var/fiction-cms/repos/new-site",
  "githubPat": "github_pat_xxx",
  "buildCommand": "npm run build",
  "buildOutputDir": "dist",
  "editablePaths": ["content/", "data/", "static/"],
  "sqliteFiles": [
    {
      "filePath": "data/site.db",
      "editableTables": [
        {
          "tableName": "posts",
          "editableColumns": ["title", "content", "published"],
          "displayName": "Blog Posts"
        }
      ]
    }
  ]
}
```

#### Update Site
```http
PUT /api/sites/{siteId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Site Name",
  "buildCommand": "yarn build",
  "editablePaths": ["content/", "assets/"]
}
```

#### Delete Site
```http
DELETE /api/sites/{siteId}
Authorization: Bearer <token>
```

### Content Management (`/api/engine/sites/{siteId}`)

#### List Files
```http
GET /api/engine/sites/{siteId}/files
Authorization: Bearer <token>
```

**Query Parameters:**
- `path` (optional): Directory path to list (default: "/")
- `type` (optional): Filter by file type (`markdown`, `json`, `sqlite`, `asset`)

**Success Response (200):**
```json
{
  "success": true,
  "files": [
    {
      "name": "index.md",
      "path": "content/index.md",
      "type": "markdown",
      "size": 1024,
      "lastModified": "2024-12-01T00:00:00.000Z",
      "isDirectory": false
    },
    {
      "name": "posts",
      "path": "content/posts/",
      "type": "directory", 
      "isDirectory": true,
      "children": 5
    }
  ],
  "path": "/content"
}
```

#### Get File Content
```http
GET /api/engine/sites/{siteId}/files/*
Authorization: Bearer <token>
```

**Example:**
```http
GET /api/engine/sites/1/files/content/index.md
```

**Success Response (200):**
```json
{
  "success": true,
  "path": "content/index.md",
  "content": "# Welcome to My Site\n\nThis is the homepage content.",
  "type": "markdown",
  "size": 1024,
  "lastModified": "2024-12-01T00:00:00.000Z"
}
```

#### Update File Content
```http
PUT /api/engine/sites/{siteId}/files/*
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "# Updated Content\n\nThis is the new content.",
  "commitMessage": "Update homepage content"
}
```

#### Create File
```http
POST /api/engine/sites/{siteId}/files
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "content/new-post.md",
  "content": "# New Post\n\nThis is a new blog post.",
  "commitMessage": "Add new blog post"
}
```

#### Delete File
```http
DELETE /api/engine/sites/{siteId}/files/*
Authorization: Bearer <token>
Content-Type: application/json

{
  "commitMessage": "Delete old file"
}
```

### SQLite Database Management

#### Get Tables
```http
GET /api/engine/sites/{siteId}/sqlite/{database}/tables
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "database": "data/blog.db",
  "tables": [
    {
      "name": "posts",
      "displayName": "Blog Posts",
      "columns": [
        {
          "name": "id",
          "type": "INTEGER",
          "primaryKey": true,
          "editable": false
        },
        {
          "name": "title", 
          "type": "TEXT",
          "editable": true
        },
        {
          "name": "content",
          "type": "TEXT", 
          "editable": true
        }
      ],
      "rowCount": 10
    }
  ]
}
```

#### Get Table Data
```http
GET /api/engine/sites/{siteId}/sqlite/{database}/tables/{table}
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Rows per page
- `orderBy` (optional): Column to sort by
- `order` (optional): Sort direction (`asc` or `desc`)

**Success Response (200):**
```json
{
  "success": true,
  "table": "posts",
  "columns": [
    {"name": "id", "type": "INTEGER"},
    {"name": "title", "type": "TEXT"},
    {"name": "content", "type": "TEXT"}
  ],
  "rows": [
    {"id": 1, "title": "First Post", "content": "Content here..."},
    {"id": 2, "title": "Second Post", "content": "More content..."}
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

#### Insert Table Row
```http
POST /api/engine/sites/{siteId}/sqlite/{database}/tables/{table}/rows
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "title": "New Post Title",
    "content": "Post content here...",
    "published": true
  },
  "commitMessage": "Add new blog post via API"
}
```

#### Update Table Row
```http
PUT /api/engine/sites/{siteId}/sqlite/{database}/tables/{table}/rows/{rowId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "title": "Updated Title",
    "content": "Updated content..."
  },
  "commitMessage": "Update post via API"
}
```

#### Delete Table Row
```http
DELETE /api/engine/sites/{siteId}/sqlite/{database}/tables/{table}/rows/{rowId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "commitMessage": "Delete post via API"
}
```

### System Information (`/api`)

#### Health Check
```http
GET /api/health
```

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

#### System Information
```http
GET /api/system/info
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "system": {
    "version": "1.0.0",
    "nodeVersion": "18.17.0",
    "platform": "linux",
    "memory": {
      "used": 50000000,
      "total": 1000000000
    },
    "uptime": 3600
  },
  "database": {
    "type": "sqlite",
    "path": "./fiction-cms.db",
    "size": 1024000
  }
}
```

#### List All Permissions
```http
GET /api/permissions
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "permissions": [
    {
      "id": "site:read",
      "name": "Read Site Information", 
      "description": "View site details and configuration"
    },
    {
      "id": "site:write",
      "name": "Modify Sites",
      "description": "Create and modify site configurations"
    },
    {
      "id": "content:read",
      "name": "Read Content",
      "description": "View file contents and structure"
    },
    {
      "id": "content:write", 
      "name": "Modify Content",
      "description": "Edit and create files"
    }
  ]
}
```

## Error Responses

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details if applicable"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully  
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

### Error Codes

- `INVALID_CREDENTIALS` - Login failed
- `TOKEN_EXPIRED` - Authentication token expired
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `SITE_NOT_FOUND` - Site ID doesn't exist
- `FILE_NOT_FOUND` - File path doesn't exist
- `VALIDATION_ERROR` - Request data validation failed
- `GIT_ERROR` - Git operation failed
- `DATABASE_ERROR` - SQLite operation failed

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authentication**: 10 login attempts per minute per IP
- **File operations**: 30 requests per minute per authenticated user

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks (Future Feature)

Planned webhook support for:
- File change notifications
- Site deployment status
- User activity events
- System health alerts

## SDK and Integration Examples

### JavaScript/Node.js Example

```javascript
class FictionCMSClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Site operations
  async getSites() {
    return this.request('/api/sites');
  }

  async createSite(siteData) {
    return this.request('/api/sites', {
      method: 'POST',
      body: JSON.stringify(siteData)
    });
  }

  // File operations  
  async getFileContent(siteId, filePath) {
    return this.request(`/api/engine/sites/${siteId}/files/${filePath}`);
  }

  async updateFile(siteId, filePath, content, commitMessage) {
    return this.request(`/api/engine/sites/${siteId}/files/${filePath}`, {
      method: 'PUT',
      body: JSON.stringify({ content, commitMessage })
    });
  }
}

// Usage
const client = new FictionCMSClient('http://localhost:3001', 'your-token');
const sites = await client.getSites();
```

### Python Example

```python
import requests

class FictionCMSClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def get_sites(self):
        response = self.session.get(f'{self.base_url}/api/sites')
        return response.json()

    def update_file(self, site_id, file_path, content, commit_message):
        data = {
            'content': content,
            'commitMessage': commit_message
        }
        response = self.session.put(
            f'{self.base_url}/api/engine/sites/{site_id}/files/{file_path}',
            json=data
        )
        return response.json()

# Usage
client = FictionCMSClient('http://localhost:3001', 'your-token')
sites = client.get_sites()
```

This API documentation provides comprehensive coverage of Fiction CMS's REST API. For additional examples or specific integration questions, please refer to the GitHub repository or create an issue for support.