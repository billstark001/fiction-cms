# Fiction CMS

Fiction CMS is being reshaped into a composable CMS toolkit for three resource kinds:

- assets: binary files or binary object records
- texts: individual text resources
- data collections: structured records governed by editable schema, coercion, validation, and evaluation rules

The workspace is intentionally package-first. The backend and frontend remain useful scaffolding, but the immediate goal is reusable packages that another app, such as `moment-landing`, can consume directly.

## Packages

- `@fiction-cms/common`: shared resource contracts, capability descriptors, and Zod validators.
- `@fiction-cms/psql`: Drizzle PostgreSQL schema and adapters for texts and data collections. It does not create database connections.
- `@fiction-cms/s3`: S3/R2 object helpers for assets and texts. It accepts an injected S3 client and bucket.
- `@fiction-cms/git-engine`: Git-backed assets, texts, and data collections through files or SQLite files.
- `@fiction-cms/data-collection`: pure-expr based rule compilation plus generic rule application.
- `@fiction-cms/backend`: Hono API shell integrating auth, psql, s3, and git capabilities.
- `@fiction-cms/frontend`: React admin shell with a reusable JSON Schema visual editor.

## Development

```bash
pnpm install
pnpm type-check
pnpm build
```

The backend now expects PostgreSQL through `DATABASE_URL`. SQLite is intentionally limited to `@fiction-cms/git-engine` for repository-local SQLite files.

Useful environment variables:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fiction_cms
FRONTEND_URL=http://localhost:3000
PASETO_SECRET_KEY=replace-with-a-stable-secret-at-least-32-chars
ENCRYPTION_KEY=64-hex-characters-for-github-pat-encryption

CMS_ENABLE_PSQL=true
CMS_ENABLE_S3=false
CMS_ENABLE_GIT=true

OIDC_ISSUER=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=

OAUTH_AUTHORIZATION_ENDPOINT=
OAUTH_TOKEN_ENDPOINT=
OAUTH_USERINFO_ENDPOINT=
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
```

## Documentation

Start with:

- [Architecture](./docs/architecture.md)
- [Development](./docs/development.md)
- [API Notes](./docs/api.md)
- [Security](./docs/security.md)
- [Migration Notes](./docs/migration-guide.md)

## Status

Version `0.1.0` is an architecture baseline. The packages compile and expose the intended boundaries, but the backend/frontend product flow is still transitional.
