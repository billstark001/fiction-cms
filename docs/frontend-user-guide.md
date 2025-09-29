# Fiction CMS Frontend - Enhanced Site Management User Guide

This guide explains how to use the comprehensive site management features implemented in Fiction CMS with the latest improvements.

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

### 3. Enhanced Content Management Interface

Click "Manage" on any site or navigate to `/sites/{siteId}/manage`.

**New Compact Layout:**

- **Left Panel (300px)**: File browser with search and filtering
- **Center Panel (flexible)**: Tabbed editor interface with multiple open files
- **Right Panel (400px)**: Collapsible preview panel (can be toggled)
- **Bottom Status Bar**: Git status, file counts, and action buttons

#### Enhanced Sidebar Features

**Opened Sites Management:**
- All opened sites are listed in the sidebar below user information
- Shows site name with unsaved changes indicator (red dot)
- Click to switch between sites
- Close button with confirmation for sites with unsaved changes

#### File Browser Features

- **Compact Search**: Inline search and filter controls
- **File Status Indicators**: 
  - ● Red dot: Local changes (saved to IndexedDB)
  - ◐ Half circle: Remote saved (uploaded to server)
  - ○ Empty circle: Committed (in Git repository)
- **File Icons**: Visual indicators for different file types
- **File Information**: Shows file type, size, and status
- **Click to Open**: Opens file in new tab in the editor

## Advanced Editor Features

### Tabbed Multi-File Editing

- **Multiple Files**: Open and edit multiple files simultaneously
- **File Tabs**: Easy switching between opened files
- **Tab Indicators**: 
  - File name with type icon
  - Red dot for unsaved changes
  - Close button (× ) with confirmation for dirty files
- **Tab Management**: Close individual files or switch between them

### Persistent Local Storage

**IndexedDB Integration:**
- All file changes are automatically saved locally
- Edit history is preserved across browser sessions
- State persistence for opened files and selections
- Conflict detection between local and remote changes

### File Status Management

**Three-Stage Workflow:**

1. **Local Save**: Changes saved to IndexedDB automatically
2. **Remote Save**: Upload all local changes to server (batch operation)
3. **Commit**: Commit saved changes to Git repository

### Git Integration and Conflict Resolution

**Enhanced Git Operations:**
- Automatic git pull when entering a site
- Conflict detection based on file modification times
- Interactive conflict resolution dialog
- Manual merge capabilities with side-by-side comparison

#### Conflict Resolution Dialog

When conflicts are detected:
- **File List**: Shows all conflicted files with resolution status
- **Resolution Options**:
  - Keep Local Version
  - Use Remote Version  
  - Manual Merge (with editable content)
- **Bulk Actions**: Resolve individual files or all at once
- **Preview**: See content changes before resolving

### Enhanced Preview Panel

**Collapsible Preview:**
- Toggle show/hide with button in editor header
- Supports Markdown preview with live updates
- Extensible for other file types
- Independent scrolling and content

## Editor Controls

### Enhanced Save Functionality

- **Auto-detection**: Shows unsaved changes indicator (●) in tabs and file list
- **Local Persistence**: All changes saved to IndexedDB immediately
- **Batch Remote Save**: "Save to Remote" button saves all modified files
- **Commit Integration**: "Commit Changes" button for git operations
- **Status Tracking**: File status indicators throughout the interface

### Git Integration

- **Pull on Entry**: Automatic git pull when opening a site
- **Conflict Handling**: Intelligent merge conflict detection and resolution
- **User Permissions**: Checks and handles permission issues gracefully
- **Commit Tracking**: Shows last pull time and modified file counts

## File Type Support

- **✅ Markdown Files**: Full editing with live preview in collapsible panel
- **✅ JSON Files**: Text editing with validation and formatting
- **✅ Code Files**: Syntax-highlighted editing (JS, TS, CSS, HTML, SQL, etc.)
- **⏳ SQLite Files**: Database editing interface (coming soon)
- **✅ Binary Assets**: View-only with preview capability where supported

## Technical Features

### Performance

- **Monaco Editor**: Professional VS Code-like editing experience
- **IndexedDB Storage**: Local persistence for all file content and history
- **Lazy Loading**: File content loaded on demand
- **Responsive Design**: Optimized for desktop with collapsible panels
- **Real-time Feedback**: Immediate validation and status updates

### Security

- **Authentication Required**: All routes protected
- **Role-based Access**: Admin-only features for site creation
- **Input Validation**: All form inputs validated
- **Secure Token Handling**: Proper localStorage management
- **Git Security**: Handles authentication and permission errors gracefully

### User Experience

**Improved Navigation:**
- **Compact Interface**: Minimal spacing, maximum productivity
- **Persistent State**: Opened files and selections preserved
- **Visual Status**: File status indicators throughout
- **Smart Dialogs**: Confirmation dialogs for destructive actions
- **Keyboard Shortcuts**: Standard editor shortcuts work
- **No Data Loss**: Local persistence prevents data loss

**Enhanced Workflow:**
- **Multi-file Editing**: Work on multiple files simultaneously
- **Status Awareness**: Always know the state of your files
- **Batch Operations**: Save multiple files or resolve conflicts in bulk
- **Intelligent Conflicts**: Automatic detection and resolution workflows

## Troubleshooting

### Common Issues

1. **Conflict Resolution**: Use the conflict dialog to manually resolve merge conflicts
2. **Local vs Remote**: Check file status indicators to understand sync state
3. **Permission Issues**: Git pull failures are handled gracefully with user guidance
4. **Storage Issues**: IndexedDB provides reliable local storage for file contents
5. **Tab Management**: Use confirmation dialogs to prevent accidental file closure

### Browser Compatibility

- Modern browsers with IndexedDB support
- Chrome, Firefox, Safari, Edge (latest versions)
- Local storage fallback for older browsers
- Mobile browsers (limited functionality on small screens)

## Future Enhancements

The following features are planned for future releases:

- **Backend API Extensions**: Full git pull/push API integration
- **Advanced Conflict Resolution**: Three-way merge with visual diff
- **Real-time Collaboration**: Multi-user editing with conflict prevention
- **Extended Preview**: Support for more file types in preview panel
- **Deployment Integration**: Build and deploy status monitoring
- **Advanced Search**: Search across file contents with regex support
- **Git Branch Management**: Switch between branches and manage merges
- **Performance Monitoring**: File load times and editor performance metrics

## Support

For issues or questions about the enhanced site management features:

1. Check the browser console for detailed error messages
2. Verify IndexedDB is working properly in your browser
3. Ensure proper Git permissions for pull/push operations
4. Review the conflict resolution dialog for merge issues
5. Check the file status indicators for sync state information
