# Fiction CMS Backend

The backend is a Hono API shell for integrating Fiction CMS packages. It now uses PostgreSQL through Drizzle for application data and capability discovery. SQLite support was removed from the backend database layer and remains only inside `@fiction-cms/git-engine` for editing repository-local SQLite files.

## Current Responsibilities

- PASETO access and refresh token auth
- password login plus OIDC/OAuth authorization-code login
- RBAC users, roles, permissions, and site records
- static resource capability reporting for `psql`, `s3`, and `git`
- bridge routes to the existing git engine

## Important Endpoints

- `GET /api/auth/providers`
- `GET /api/auth/oidc/start`
- `GET /api/auth/oauth/start`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/system/capabilities`
- `GET /api/system/info`
- `GET /api/engine/sites/:siteId/files`

## Environment

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fiction_cms
FRONTEND_URL=http://localhost:3000
PASETO_SECRET_KEY=replace-with-a-stable-secret-at-least-32-chars
ENCRYPTION_KEY=64-hex-characters
```

Optional OIDC/OAuth variables are documented in the root README.

## Scripts

```bash
pnpm --filter @fiction-cms/backend dev
pnpm --filter @fiction-cms/backend type-check
pnpm --filter @fiction-cms/backend build
pnpm --filter @fiction-cms/backend db:push
```
