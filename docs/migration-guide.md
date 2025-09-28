# Migration Guide: Upgrading to Enhanced Fiction CMS

This guide helps you migrate from the basic Fiction CMS to the enhanced version with advanced configuration features.

## Overview of Changes

The enhanced Fiction CMS introduces several new features:

1. **Validation Commands** - Pre-deployment validation
2. **Model Files** - Structured data with Zod validation  
3. **Enhanced SQLite** - Column-level permissions and glob patterns
4. **Custom File Types** - Extensible file type system
5. **Improved Security** - Stronger SQL sanitization and validation

## Database Migration

### New Database Columns

The `sites` table has new optional columns. Run this SQL to update your database:

```sql
-- Add new columns to sites table
ALTER TABLE sites ADD COLUMN validateCommand TEXT;
ALTER TABLE sites ADD COLUMN sqliteFiles TEXT;
ALTER TABLE sites ADD COLUMN modelFiles TEXT;  
ALTER TABLE sites ADD COLUMN customFileTypes TEXT;
```

### Migration Script

Create `migrate.sql` and run it against your database:

```bash
# For SQLite
sqlite3 fiction-cms.db < migrate.sql

# For other databases, adjust accordingly
```

## Configuration Migration

### Basic Sites (No Changes Required)

Existing basic site configurations continue to work unchanged:

```typescript
// This continues to work as before
const basicSite: SiteConfig = {
  id: 'blog',
  name: 'My Blog',
  githubRepositoryUrl: 'https://github.com/user/blog',
  githubPat: 'ghp_xxx',
  localPath: '/path/to/blog',
  buildCommand: 'hugo',
  editablePaths: ['content/']
};
```

### Migrating SQLite Configuration

**Before (v1):**
```typescript
sqliteFiles: [
  {
    filePath: 'data/blog.db',  // Exact file path only
    editableTables: [
      {
        tableName: 'posts',
        editableColumns: ['title', 'content'],  // Required field
        displayName: 'Blog Posts'
      }
    ]
  }
]
```

**After (v2) - Enhanced:**
```typescript
sqliteFiles: [
  {
    filePath: 'data/**/*.db',  // NOW: Supports glob patterns
    editableTables: [
      {
        tableName: 'posts',
        editableColumns: ['title', 'content'],     // NOW: Optional (defaults to all)
        readableColumns: ['id', 'title', 'content', 'created_at'], // NEW: Separate read permissions
        displayName: 'Blog Posts',
        defaultValues: {                           // NEW: Default values for new rows
          created_at: '${current_timestamp}',
          status: 'draft'
        },
        primaryKeyStrategy: 'auto_increment'       // NEW: Primary key generation
      }
    ]
  }
]
```

### Adding New Features Gradually

You can adopt new features incrementally:

**Step 1: Add Validation**
```typescript
const siteConfig: SiteConfig = {
  // ... existing config
  validateCommand: 'npm run lint && npm test'  // Add validation
};
```

**Step 2: Add Model Files**
```typescript
const siteConfig: SiteConfig = {
  // ... existing config
  modelFiles: [
    {
      filePath: 'data/config.json',
      zodValidator: 'z.object({ title: z.string(), description: z.string() })',
      displayName: 'Site Configuration'
    }
  ]
};
```

**Step 3: Add Custom File Types**
```typescript
const siteConfig: SiteConfig = {
  // ... existing config
  customFileTypes: [
    {
      name: 'notes',
      extensions: ['.txt', '.note'],
      displayName: 'Notes',
      isText: true
    }
  ]
};
```

## API Changes

### SQLite Operations

**Before (v1) - Direct SQL clauses:**
```typescript
// Old method (still works but deprecated)
await sqliteManager.updateSQLiteData(siteConfig, 'blog.db', 'posts', [
  {
    whereCondition: { id: 1 },
    updateData: { title: 'New Title' }
  }
]);
```

**After (v2) - Sanitized operations:**
```typescript
// New recommended method
await sqliteManager.updateTableRow(siteConfig, 'blog.db', 'posts', 1, {
  title: 'New Title'
});

// Other new methods:
await sqliteManager.insertTableRow(siteConfig, 'blog.db', 'posts', data);
await sqliteManager.deleteTableRow(siteConfig, 'blog.db', 'posts', 1);
await sqliteManager.getFullTable(siteConfig, 'blog.db', 'posts');
```

### File Type Detection

**Before (v1) - Limited types:**
```typescript
type FileType = 'markdown' | 'json' | 'sqlite' | 'asset';
```

**After (v2) - Extensible:**
```typescript
type FileType = string; // Now supports custom types

// Enhanced detection
const fileType = commonFileOperations.determineFileType('document.bib', siteConfig);
// Returns 'bibtex' if configured as custom type
```

## Frontend Changes

### Site Creation Form

The site creation form now includes fields for:
- Validation command
- SQLite files configuration (JSON)
- Model files configuration (JSON)  
- Custom file types (JSON)

These are optional - leave empty to maintain current behavior.

### Validation UI

New validation button in site management:
- Runs the configured `validateCommand`
- Displays results with color-coded status
- Shows execution time and output logs

## Testing Your Migration

### 1. Test Basic Functionality
```bash
# Ensure existing features still work
curl -X GET http://localhost:3001/api/sites
curl -X GET http://localhost:3001/api/engine/sites/{siteId}/files
```

### 2. Test New Features
```bash
# Test validation endpoint
curl -X POST http://localhost:3001/api/engine/sites/{siteId}/validate

# Test enhanced SQLite operations
curl -X GET http://localhost:3001/api/engine/sites/{siteId}/sqlite/data.db/tables/posts
```

### 3. Verify File Type Detection
Create files with custom extensions and verify they appear with correct types in the file browser.

## Rollback Plan

If you need to rollback:

1. **Database:** The new columns are optional, so the old system will ignore them
2. **Code:** Use git to revert to the previous version
3. **Data:** No data loss - new features are additive

```bash
# Rollback database (if needed)
ALTER TABLE sites DROP COLUMN validateCommand;
ALTER TABLE sites DROP COLUMN sqliteFiles;
ALTER TABLE sites DROP COLUMN modelFiles;
ALTER TABLE sites DROP COLUMN customFileTypes;
```

## Common Issues and Solutions

### Issue: Validation Command Fails
**Solution:** Check that the command exists and is executable from the site's local path.

### Issue: Zod Validator Syntax Error
**Solution:** Test your Zod schemas in isolation before adding to configuration.

### Issue: Glob Patterns Not Matching
**Solution:** Use absolute paths and test patterns with a glob testing tool.

### Issue: Custom File Types Not Recognized
**Solution:** Ensure extensions include the leading dot (`.bib` not `bib`).

## Getting Help

If you encounter issues during migration:

1. Check the logs in `packages/backend/logs/`
2. Test new features individually
3. Refer to the configuration examples in `docs/configuration.md`
4. Use the validation endpoint to debug site issues

The enhanced system is designed to be fully backward compatible, so your existing sites should continue working without any changes.