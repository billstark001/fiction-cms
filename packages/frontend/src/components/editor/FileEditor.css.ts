import { style } from '@vanilla-extract/css';

// Editor container
export const editorContainer = style({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

// Editor header with controls
export const editorHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
});

// Editor control buttons group
export const editorControls = style({
  display: 'flex',
  gap: '0.5rem',
});

// Mode toggle button
export const modeToggle = style({
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#6b7280',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  ':hover': {
    backgroundColor: '#f9fafb',
  },
});

export const modeToggleActive = style([modeToggle, {
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderColor: '#2563eb',
  
  ':hover': {
    backgroundColor: '#1d4ed8',
  },
}]);

// Save button
export const saveButton = style({
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  ':hover': {
    backgroundColor: '#15803d',
  },
  
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

// Editor content area
export const editorContent = style({
  flex: 1,
  display: 'flex',
});

// Editor panel (for split view)
export const editorPanel = style({
  flex: 1,
});

export const previewPanel = style({
  flex: 1,
  padding: '1rem',
  borderLeft: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  overflow: 'auto',
});

// Markdown preview styles
export const markdownPreview = style({
  fontSize: '0.875rem',
  lineHeight: 1.6,
  color: '#374151',
});

export const previewHeading1 = style({
  color: '#1f2937',
  borderBottom: '2px solid #e5e7eb',
  paddingBottom: '0.5rem',
});

export const previewHeading2 = style({
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '0.25rem',
});

export const previewHeading3 = style({
  color: '#4b5563',
});

export const previewCodeInline = style({
  backgroundColor: '#f3f4f6',
  color: '#1f2937',
  padding: '0.125rem 0.25rem',
  borderRadius: '0.375rem',
  fontSize: '0.875em',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  display: 'inline',
  whiteSpace: 'nowrap',
});

export const previewCodeBlock = style({
  backgroundColor: '#1f2937',
  color: '#e5e7eb',
  padding: '1rem',
  borderRadius: '0.375rem',
  fontSize: '0.875em',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  display: 'block',
  whiteSpace: 'pre',
  overflow: 'auto',
});

export const previewBlockquote = style({
  borderLeft: '4px solid #e5e7eb',
  paddingLeft: '1rem',
  marginLeft: 0,
  fontStyle: 'italic',
  color: '#6b7280',
});

export const previewTable = style({
  borderCollapse: 'collapse',
  width: '100%',
  marginTop: '1rem',
  marginBottom: '1rem',
});

export const previewTableHeader = style({
  border: '1px solid #d1d5db',
  padding: '0.5rem',
  backgroundColor: '#f9fafb',
  textAlign: 'left',
});

export const previewTableCell = style({
  border: '1px solid #d1d5db',
  padding: '0.5rem',
});

// JSON editor specific styles
export const jsonEditorContainer = style({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

// Commit message input
export const commitMessageInput = style({
  width: '200px',
  padding: '0.375rem 0.5rem',
  fontSize: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  outline: 'none',
  
  ':focus': {
    borderColor: '#2563eb',
    boxShadow: '0 0 0 1px #2563eb',
  },
});

// Placeholder when no file is selected
export const placeholderContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  height: '100%',
  color: '#6b7280',
  textAlign: 'center',
});

export const placeholderIcon = style({
  marginBottom: '1rem',
  opacity: 0.5,
});

export const placeholderTitle = style({
  fontSize: '1.125rem',
  marginBottom: '0.5rem',
});

export const placeholderText = style({
  margin: 0,
});