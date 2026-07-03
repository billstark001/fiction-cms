# Migration Notes

## From the Earlier Fiction CMS Prototype

- Backend Drizzle storage moved from SQLite to PostgreSQL.
- SQLite editing remains in `@fiction-cms/git-engine` for repository-local `.sqlite` files.
- Shared resource contracts moved to `@fiction-cms/common`.
- Text/data collection persistence for PostgreSQL lives in `@fiction-cms/psql`.
- S3/R2 object IO lives in `@fiction-cms/s3`.
- Data collection schema/rule execution lives in `@fiction-cms/data-collection`.

## For Future moment-landing Adoption

`moment-landing` should consume:

- `@fiction-cms/common` for field hints, evaluation result, asset/text/data types
- `@fiction-cms/data-collection` for schema/coercion/validation rule execution
- `@fiction-cms/psql` for content records when using PostgreSQL
- `@fiction-cms/s3` for asset/text object IO

The existing moment-specific public projection logic should stay app-side until it is made generic.
