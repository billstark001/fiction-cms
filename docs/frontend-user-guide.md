# Fiction CMS Frontend - Site Management User Guide

This guide explains how to use the comprehensive site management features implemented in Fiction CMS.

## Authentication

The application now properly handles authentication tokens with the following fixes:

- Fixed localStorage token storage bug that was saving `undefined`
- Added safe localStorage access for SSR compatibility
- Improved token persistence across browser sessions

**Default Admin Credentials:**

- Username: `admin`
- Password: `admin123`

## Site Management Features

### 1. Site Listing and Management

Navigate to `/sites` to access the main site management interface.

**Features:**

- **Search Sites**: Use the search bar to find sites by name, repository URL, or local path
- **Pagination**: Navigate through multiple pages of sites
- **Site Cards**: Each site shows:
  - Site name and description
  - GitHub repository link (opens in new tab)
  - Local path information
  - Active/Inactive status
  - Creation date
  - Direct "Manage" button

### 2. Creating New Sites

Click "Create New Site" button (admin only) or navigate to `/sites/create`.

**Required Fields:**

- **Site Name**: Unique identifier for your site
- **GitHub Repository URL**: Full HTTPS URL to your GitHub repository
- **Local Path**: Server path where the site files are stored

**Optional Configuration:**

- **Description**: Brief description of the site
- **GitHub Personal Access Token**: Required for private repos or push access
- **Build Command**: Command to build the site (e.g., `npm run build`)
- **Build Output Directory**: Where built files are output (e.g., `dist`)
- **Editable Paths**: Comma-separated list of directories that can be edited via CMS

### 3. Content Management Interface

Click "Manage" on any site or navigate to `/sites/{siteId}/manage`.

**Layout:**

- **Left Panel**: File browser with search and filtering
- **Right Panel**: Advanced code editor with multiple modes

#### File Browser Features

- **Search Files**: Filter files by name
- **Type Filtering**: Show only specific file types (Markdown, JSON, SQLite, Assets)
- **File Icons**: Visual indicators for different file types
- **File Information**: Shows file type and size
- **Click to Edit**: Select any file to load it in the editor

## Advanced Editor Features

### Markdown Editor

- **Dual Mode**: Switch between "Edit" and "Preview" modes
- **Live Preview**: Real-time rendering of Markdown content
- **Styled Output**: Professional formatting with:
  - Heading hierarchy with borders
  - Code syntax highlighting
  - Blockquotes with left border
  - Properly formatted tables
  - Inline and block code styling

### JSON Editor

- **Dual Mode**: Visual editor (coming soon) and text editor
- **Format Support**: Standard JSON and JSON5 (extended JSON syntax)
- **Real-time Validation**: Immediate feedback on syntax errors
- **Validation Blocking**: Prevents saving invalid JSON
- **Formatting**: Automatic code formatting and indentation

### Generic Code Editor

- **Syntax Highlighting**: Supports multiple languages:
  - JavaScript/TypeScript
  - HTML/CSS
  - SQL
  - YAML/XML
  - Python
  - And more based on file extension
- **Code Features**:
  - Line numbers
  - Code folding
  - Find/replace
  - Auto-completion
  - Format on paste

## Editor Controls

### Save Functionality

- **Auto-detection**: Shows unsaved changes indicator (●)
- **Commit Messages**: Optional Git commit messages for each save
- **Validation**: Prevents saving files with validation errors
- **Real-time Status**: Shows save status and character count

### Git Integration

- Each file save creates a Git commit
- Commits are automatically pushed to the configured repository
- Uses the authenticated user's name and email for commits

## File Type Support

- **✅ Markdown Files**: Full editing with live preview
- **✅ JSON Files**: Text editing with validation
- **✅ Code Files**: Syntax-highlighted editing (JS, TS, CSS, HTML, SQL, etc.)
- **⏳ SQLite Files**: Database editing interface (coming soon)
- **❌ Binary Assets**: View-only (images, PDFs, etc.)

## Technical Features

### Performance

- **Monaco Editor**: Professional VS Code-like editing experience
- **Lazy Loading**: File content loaded on demand
- **Responsive Design**: Works on desktop and tablet devices
- **Real-time Feedback**: Immediate validation and status updates

### Security

- **Authentication Required**: All routes protected
- **Role-based Access**: Admin-only features for site creation
- **Input Validation**: All form inputs validated
- **Secure Token Handling**: Proper localStorage management

### User Experience

- **Intuitive Navigation**: Breadcrumb-style navigation
- **Visual Feedback**: Hover effects, loading states, error messages
- **Keyboard Shortcuts**: Standard editor shortcuts work
- **No Data Loss**: Warns about unsaved changes

## Troubleshooting

### Common Issues

1. **Token Issues**: If you get authentication errors, try logging out and back in
2. **File Not Loading**: Check that the file path exists and is within editable paths
3. **Save Failures**: Ensure you have write permissions and valid Git configuration
4. **JSON Validation**: Switch between JSON and JSON5 modes if strict JSON fails

### Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (limited functionality on small screens)

## Future Enhancements

The following features are planned for future releases:

- Visual JSON editor with form-based editing
- SQLite database table management interface
- File upload and asset management
- Deployment status monitoring
- Real-time collaboration features
- Advanced search and replace across files
- Git branch management
- Automated backup and restore functionality

## Support

For issues or questions about the site management features:

1. Check the browser console for detailed error messages
2. Verify your authentication and permissions
3. Ensure the backend server is running and accessible
4. Review the site configuration for correct paths and settings
