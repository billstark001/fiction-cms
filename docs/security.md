# Security

## Rule Execution

Editable data collection rules use `pure-expr`, not arbitrary TypeScript execution. The rule engine:

- uses explicit helper scopes
- applies source, AST, call depth, and step budgets
- disables tagged templates and `in`
- restricts callable functions with a whitelist
- performs no IO inside the rule package

Do not expose real Zod objects, database clients, S3 clients, filesystem APIs, or process globals to rule scopes.

## Authentication

The backend supports password login plus OIDC/OAuth authorization-code login. External providers create users with an editor role by default and issue the same PASETO access/refresh token pair used by password login.

## Storage

Backend application data uses PostgreSQL. SQLite is limited to git-engine operations against repository-local SQLite files.

S3 helpers require injected clients and do not read credentials themselves.
