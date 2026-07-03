# API Notes

The backend API is transitional. Stable package APIs live in the package exports.

## Auth

- `GET /api/auth/providers` returns enabled password/OIDC/OAuth providers.
- `GET /api/auth/oidc/start` starts OIDC login.
- `GET /api/auth/oauth/start` starts generic OAuth2 login.
- external auth callbacks issue the existing PASETO access/refresh tokens and redirect to the frontend login route.

## System

- `GET /api/system/capabilities` returns configured resource backends and capabilities.
- `GET /api/system/info` includes the same capability summary with process metadata.

## Package APIs

- `@fiction-cms/common` owns common resource types and validation.
- `@fiction-cms/psql` exports Drizzle tables and adapter factories.
- `@fiction-cms/s3` exports injected-client S3 helpers.
- `@fiction-cms/data-collection` exports schema/rule compilation and evaluation.
- `@fiction-cms/git-engine` exports existing git/file/sqlite repository operations.
