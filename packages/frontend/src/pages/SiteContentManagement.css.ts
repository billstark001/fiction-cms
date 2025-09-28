import { style } from '@vanilla-extract/css';

// Site Content Management 专用样式
export const contentManagementContainer = style({});

export const contentLayout = style({
  display: 'grid',
  gridTemplateColumns: '1fr 2fr',
  gap: '1.5rem',
  height: 'calc(100vh - 200px)',
});

// File browser styles
export const fileBrowserCard = style({
  height: 'fit-content',
  maxHeight: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export const fileBrowserHeader = style({
  marginBottom: '1rem',
  display: 'flex',
  gap: '0.5rem',
});

export const fileList = style({
  flex: 1,
  overflowY: 'auto',
  maxHeight: '500px',
});

export const fileListEmpty = style({
  textAlign: 'center',
  padding: '2rem',
  color: '#6b7280',
});

export const fileItem = style({
  padding: '0.75rem',
  border: '1px solid transparent',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb',
    },
  },
});

export const fileItemSelected = style([fileItem, {
  backgroundColor: '#eff6ff',
  borderColor: '#2563eb',
}]);

export const fileIcon = style({
  fontSize: '1.25rem',
});

export const fileDetails = style({
  flex: 1,
  minWidth: 0,
});

export const fileName = style({
  fontSize: '0.875rem',
  fontWeight: 'medium',
  color: '#111827',
  marginBottom: '0.125rem',
  wordBreak: 'break-all',
});

export const fileMetadata = style({
  fontSize: '0.75rem',
  color: '#6b7280',
  display: 'flex',
  gap: '0.5rem',
});

// Editor styles
export const editorCard = style({
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

export const editorPlaceholder = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  height: '100%',
  color: '#6b7280',
  textAlign: 'center',
});

export const editorPlaceholderIcon = style({
  marginBottom: '1rem',
  opacity: 0.5,
});

export const editorPlaceholderTitle = style({
  fontSize: '1.125rem',
  marginBottom: '0.5rem',
});

export const editorPlaceholderText = style({
  margin: 0,
});

// Search and filter styles
export const searchFilterContainer = style({
  display: 'flex',
  gap: '0.5rem',
});

export const searchInput = style({
  flex: 1,
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.15s ease-in-out',
  
  ':focus': {
    borderColor: '#2563eb',
  },
});

export const filterSelect = style({
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  backgroundColor: 'white',
  cursor: 'pointer',
});

// Back button
export const backButton = style({
  background: 'none',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '0.875rem',
  padding: 0,
  marginBottom: '0.5rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  
  selectors: {
    '&:hover': {
      color: '#374151',
    },
  },
});

// Error message dismiss button
export const errorDismissButton = style({
  marginLeft: '1rem',
  padding: '0.25rem 0.5rem',
  backgroundColor: 'transparent',
  border: '1px solid #dc2626',
  borderRadius: '0.25rem',
  color: '#dc2626',
  fontSize: '0.75rem',
  cursor: 'pointer',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#fef2f2',
    },
  },
});

// Header actions (for validation button)
export const headerActions = style({
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
});

// Validation output display
export const validationOutput = style({
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  padding: '0.75rem',
  fontSize: '0.75rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  maxHeight: '200px',
  overflowY: 'auto',
  marginTop: '0.5rem',
});

// Dismiss button for validation results
export const dismissButton = style({
  marginTop: '1rem',
  padding: '0.25rem 0.5rem',
  backgroundColor: 'transparent',
  border: '1px solid #6b7280',
  borderRadius: '0.25rem',
  color: '#6b7280',
  fontSize: '0.75rem',
  cursor: 'pointer',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
});