# Architecture

Fiction CMS is organized around resource kinds and backend drivers.

## Resource Kinds

- asset: binary object, image, video, document, or a binary record.
- text: one text resource identified by a key/path.
- data collection: structured records validated and evaluated by a content type definition.

## Drivers

- psql: stores texts and data collection records.
- s3: stores asset and text object bodies.
- git: stores assets, texts, and data collection files in a repository; SQLite remains available here for repository-local databases.

## Rule Engine

`@fiction-cms/data-collection` compiles a safe schema expression into a serializable schema spec, then into Zod. It uses `pure-expr` from npm with a restricted call policy, AST/source/step budgets, and an explicit helper scope.

Rules are split into:

- compilation: schema source, coercion expressions, validation expressions
- application: coerce data, validate with Zod, evaluate warnings/errors, return an `EvaluationResult`

The package performs no SQL, S3, or filesystem IO.

## Backend Integration

The backend reads static capability configuration from environment variables and exposes the resulting capabilities. It wires auth and bridge routes, but each storage package owns only contracts and helper logic, not process-level external resources.
