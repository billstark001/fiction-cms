# User Guide - Fiction CMS

This comprehensive guide explains how to use Fiction CMS for managing content across multiple static sites. Whether you're a content manager, editor, or site administrator, this guide will help you get the most out of Fiction CMS.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication & User Management](#authentication--user-management)
- [Site Management](#site-management)
- [Content Editing](#content-editing)
- [File Management](#file-management)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Login

1. **Access Fiction CMS** at your deployment URL (e.g., `https://your-cms.domain.com`)

2. **Log in with default credentials**:
   - Username: `admin`
   - Password: `admin123`

3. **Change default password immediately** after first login:
   - Go to **Settings** → **Profile**
   - Click **Change Password**
   - Enter a secure password

### Dashboard Overview

After logging in, you'll see the main dashboard with:

- **Sites Overview**: Quick access to your managed sites
- **Recent Activity**: Latest content changes and deployments
- **Quick Actions**: Create new site, manage users, system settings
- **System Status**: Health indicators and deployment status

## Authentication & User Management

### User Roles

Fiction CMS supports role-based access control:

#### Administrator

- **Full system access**: Manage all sites, users, and system settings
- **User management**: Create, modify, and delete user accounts
- **Site creation**: Create and configure new sites
- **System configuration**: Modify global settings and permissions

#### Editor

- **Content management**: Edit content across assigned sites
- **File operations**: Create, modify, and delete content files
- **Site access**: Access sites they're assigned to
- **Preview changes**: Use preview modes before publishing

#### Viewer

- **Read-only access**: View content and site information
- **Browse files**: Navigate file structures without editing
- **View history**: See change history and commit logs

### Managing User Accounts

**For Administrators:**

1. **Create New User**:
   - Go to **Settings** → **Users**
   - Click **Add User**
   - Fill in user details (username, email, password)
   - Assign appropriate role
   - Select site permissions

2. **Modify Existing Users**:
   - Find user in user list
   - Click **Edit** to modify details
   - Adjust role assignments and site permissions
   - Save changes

3. **Site Access Management**:
   - Assign users to specific sites
   - Set permission levels per site
   - Remove access when needed

## Site Management

### Understanding Sites

In Fiction CMS, a "site" represents a GitHub repository containing a static website. Each site can have:

- **Repository URL**: GitHub repository location
- **Local Path**: Server location for file management  
- **Build Configuration**: Commands and settings for building the site
- **Editable Paths**: Directories that can be modified through the CMS
- **SQLite Databases**: Database files that can be edited via the interface

### Creating a New Site

**Prerequisites:**

- GitHub repository with static site content
- GitHub Personal Access Token (PAT) with repo permissions
- Admin role in Fiction CMS

**Steps:**

1. **Navigate to Sites**: Click **Sites** in the main navigation

2. **Create New Site**: Click **Create New Site** button

3. **Basic Configuration**:
   - **Site Name**: Choose a descriptive name
   - **Repository URL**: Full HTTPS URL to your GitHub repo
   - **Description**: Brief description of the site

4. **GitHub Configuration**:
   - **GitHub PAT**: Personal Access Token for repo access
   - **Local Path**: Server path for cloning (auto-generated if empty)

5. **Build Configuration**:
   - **Build Command**: Command to build your site (e.g., `npm run build`)
   - **Build Output Directory**: Where built files are placed (e.g., `dist`, `_site`)

6. **Content Configuration**:
   - **Editable Paths**: Comma-separated list of directories that can be edited
     - Example: `content/, data/, posts/`
   - **SQLite Files**: Database files to make editable through the interface

7. **Save Configuration**: Click **Create Site** to save and initialize

### Site Configuration Examples

#### Hugo Blog Site

```
Site Name: My Hugo Blog
Repository URL: https://github.com/username/hugo-blog
Build Command: hugo
Build Output Directory: public
Editable Paths: content/, data/, static/
SQLite Files: data/blog.db (if using database content)
```

#### Next.js Documentation Site

```
Site Name: Project Documentation  
Repository URL: https://github.com/company/docs-site
Build Command: npm run build
Build Output Directory: out
Editable Paths: content/, public/images/
SQLite Files: (none)
```

#### Jekyll Portfolio

```
Site Name: Designer Portfolio
Repository URL: https://github.com/designer/portfolio
Build Command: bundle exec jekyll build
Build Output Directory: _site  
Editable Paths: _posts/, _data/, assets/
SQLite Files: _data/portfolio.db
```

## Content Editing

### File Browser

The file browser provides an organized view of your site's content:

**Features:**

- **Search Files**: Filter files by name using the search box
- **File Type Filters**: Show only specific types (Markdown, JSON, SQLite, Assets)
- **File Icons**: Visual indicators for different file types
- **File Information**: Displays file size and modification date
- **Folder Navigation**: Expand/collapse directories

**File Type Icons:**

- 📝 Markdown files (`.md`, `.mdx`)
- 📊 JSON files (`.json`)  
- 🗃️ SQLite databases (`.db`, `.sqlite`)
- 🖼️ Images (`.png`, `.jpg`, `.gif`, etc.)
- 📄 Other text files

### Markdown Editor

The Markdown editor provides a rich editing experience with live preview:

**Features:**

- **Dual Mode**: Switch between Edit and Preview modes
- **Live Preview**: Real-time rendering as you type
- **Syntax Highlighting**: Markdown syntax highlighting in edit mode
- **Auto-complete**: Smart suggestions for Markdown syntax
- **Image Support**: Preview embedded images
- **Table Editing**: Enhanced table editing experience

**Markdown Editing Tips:**

- Use `# Title` for headings (up to 6 levels)
- `**bold**` and `*italic*` for emphasis
- Create links with `[text](url)`  
- Add images with `![alt text](image-url)`
- Use \`code\` for inline code and \`\`\`language blocks for code blocks
- Create tables with pipe symbols: `| Column 1 | Column 2 |`

### JSON Editor

The JSON editor supports both standard JSON and JSON5 (extended JSON):

**Features:**

- **Real-time Validation**: Immediate feedback on syntax errors
- **Format Support**: Switch between JSON and JSON5 modes
- **Auto-formatting**: Automatic indentation and formatting
- **Error Highlighting**: Visual indicators for syntax problems
- **Validation Blocking**: Prevents saving invalid JSON

**JSON5 Enhancements:**

- Comments allowed (`// single line` and `/* multi-line */`)
- Trailing commas permitted
- Unquoted object keys (when valid identifiers)
- Multi-line strings with backslashes

**Example JSON5:**

```json5
{
  // Site configuration
  title: "My Website",
  description: "A sample site",
  features: [
    "responsive design",
    "fast loading", // trailing comma OK
  ],
  /* 
   Multi-line comment
   with configuration notes
  */
  buildSettings: {
    minify: true,
    sourceMaps: false,
  }
}
```

### Code Editor

For other file types, Fiction CMS provides syntax-highlighted code editing:

**Supported Languages:**

- JavaScript/TypeScript (`.js`, `.ts`, `.jsx`, `.tsx`)
- CSS/SCSS/LESS (`.css`, `.scss`, `.less`)
- HTML/XML (`.html`, `.xml`, `.svg`)
- YAML (`.yml`, `.yaml`)  
- SQL (`.sql`)
- Python (`.py`)
- Shell scripts (`.sh`, `.bash`)

**Editor Features:**

- Line numbers
- Code folding
- Find and replace (Ctrl/Cmd + F)
- Auto-completion
- Error detection (for supported languages)

### SQLite Database Editor

For SQLite database files, Fiction CMS provides a table-based editing interface:

**Current Features:**

- **Table Listing**: View all tables in the database
- **Data Viewing**: Browse table contents with pagination
- **Row Creation**: Add new rows through forms

**Upcoming Features:**

- Visual table editor
- Advanced querying
- Data export/import
- Schema modification

## File Management

### File Operations

**Creating Files:**

1. Navigate to desired directory in file browser
2. Right-click in empty space or use **New File** button
3. Enter filename with appropriate extension
4. Select file type (determines editor mode)
5. Begin editing in the appropriate editor

**Deleting Files:**

1. Right-click on file in browser
2. Select **Delete File**
3. Confirm deletion in modal dialog
4. File is removed and changes are committed to Git

**Moving/Renaming Files:**

1. Right-click on file
2. Select **Rename** or **Move**
3. Enter new name or path
4. Confirm changes

### Git Integration

Every save operation in Fiction CMS creates a Git commit:

**Automatic Git Operations:**

- **Auto-commit**: Each file save creates a commit
- **Commit Messages**: Optional custom commit messages
- **Author Attribution**: Uses authenticated user's information
- **Auto-push**: Changes pushed to GitHub repository

**Commit Message Guidelines:**

- Be descriptive about the changes made
- Use present tense ("Add new blog post" not "Added new blog post")
- Reference relevant issues or tickets if applicable
- Keep messages concise but informative

**Examples of Good Commit Messages:**

- "Update homepage content for summer campaign"
- "Add new product images to gallery"
- "Fix typos in about page"
- "Update site navigation menu structure"

## Advanced Features

### Search and Replace

**Global Search:**

- Use Ctrl/Cmd + Shift + F for global search across files
- Search supports regular expressions
- Filter results by file type
- Replace across multiple files

**File-specific Search:**

- Use Ctrl/Cmd + F within individual files
- Supports case-sensitive and regex searches
- Navigate between matches with F3/Shift+F3

### Keyboard Shortcuts

**General Navigation:**

- `Ctrl/Cmd + S`: Save current file
- `Ctrl/Cmd + F`: Find in current file  
- `Ctrl/Cmd + Shift + F`: Global search
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo

**Editor-specific:**

- `Ctrl/Cmd + D`: Select next occurrence
- `Alt + Up/Down`: Move lines up/down
- `Shift + Alt + Down`: Duplicate line
- `Ctrl/Cmd + /`: Toggle comment

### Preview and Staging

**Preview Mode:**

- Switch to Preview mode in Markdown editor
- See exactly how content will appear
- Test links and embedded content
- Check formatting and layout

**Staging Workflow:**

- Save changes commits to repository
- Changes automatically trigger builds (if configured)
- Use GitHub Pages for staging previews
- Review changes before making them public

## Troubleshooting

### Common Issues

**Problem: "Authentication Failed" errors**

- **Solution**: Check if your session has expired. Log out and back in.
- **Prevention**: Keep the browser tab active or log in again when needed.

**Problem: File won't save**  

- **Solution**: Check file permissions and Git repository access.
- **Check**: Ensure your GitHub PAT has write permissions to the repository.

**Problem: Preview not updating**

- **Solution**: Refresh the preview panel or switch between Edit/Preview modes.
- **Check**: Ensure there are no syntax errors in the Markdown.

**Problem: JSON validation errors**

- **Solution**: Check for missing commas, quotes, or brackets.
- **Tip**: Switch to JSON5 mode if you need comments or trailing commas.

**Problem: Can't see certain files**

- **Solution**: Check that the file paths are included in the site's editable paths configuration.
- **Admin**: Site administrators can modify editable paths in site settings.

### Getting Help

1. **Check Error Messages**: Read error messages carefully for specific guidance
2. **Browser Console**: Open browser developer tools (F12) to see detailed errors  
3. **Contact Administrator**: Report issues to your Fiction CMS administrator
4. **Documentation**: Refer to specific sections of this guide for detailed help

### Browser Requirements

**Supported Browsers:**

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**

- JavaScript enabled
- LocalStorage support
- Modern ES6+ features
- WebSocket support (for future real-time features)

---

This user guide covers the essential features of Fiction CMS. For more advanced topics, administrator guides, or technical documentation, please refer to the other sections of the documentation.
