# Development

Install dependencies:

```bash
pnpm install
```

Run checks:

```bash
pnpm type-check
pnpm build
```

Run the app shell:

```bash
pnpm dev
```

Build order matters because package exports point at `dist` declarations. The root `build` script compiles shared packages before backend/frontend.

Backend database tasks target PostgreSQL:

```bash
pnpm --filter @fiction-cms/backend db:push
pnpm --filter @fiction-cms/backend db:generate
```

SQLite dependencies are expected only in `@fiction-cms/git-engine`.
