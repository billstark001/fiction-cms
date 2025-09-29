import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'grid',
  gridTemplateColumns: '300px 1fr',
  height: '500px',
  gap: '1rem'
});

// Left sidebar - conflict list
export const conflictList = style({
  borderRight: '1px solid #e5e7eb',
  paddingRight: '1rem',
  display: 'flex',
  flexDirection: 'column'
});

export const sectionTitle = style({
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '0.75rem',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid #f3f4f6'
});

export const conflictItem = style({
  padding: '0.75rem',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  marginBottom: '0.5rem',
  border: '1px solid transparent',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderColor: '#e5e7eb'
    }
  }
});

export const conflictItemSelected = style({
  backgroundColor: '#eff6ff',
  borderColor: '#2563eb'
});

export const conflictPath = style({
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#111827',
  marginBottom: '0.25rem',
  wordBreak: 'break-all'
});

export const conflictStatus = style({
  fontSize: '0.75rem'
});

export const statusResolved = style({
  color: '#10b981',
  fontWeight: '500'
});

export const statusPending = style({
  color: '#f59e0b',
  fontWeight: '500'
});

// Main content area
export const mainContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  paddingLeft: '1rem'
});

export const conflictHeader = style({
  paddingBottom: '0.75rem',
  borderBottom: '1px solid #e5e7eb'
});

export const conflictTitle = style({
  fontSize: '1.125rem',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '0.5rem'
});

export const conflictMeta = style({
  display: 'flex',
  gap: '1rem',
  fontSize: '0.75rem',
  color: '#6b7280'
});

// Resolution options
export const resolutionOptions = style({
  display: 'flex',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: '#f9fafb',
  borderRadius: '0.5rem',
  border: '1px solid #e5e7eb'
});

export const resolutionOption = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151'
});

// Content editor
export const contentEditor = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0
});

export const editorHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.5rem'
});

export const editableLabel = style({
  fontSize: '0.75rem',
  color: '#10b981',
  fontWeight: '500'
});

export const contentTextarea = style({
  flex: 1,
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontFamily: 'monospace',
  resize: 'none',
  outline: 'none',
  
  selectors: {
    '&:focus': {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 1px #2563eb'
    },
    '&:read-only': {
      backgroundColor: '#f9fafb',
      color: '#6b7280'
    }
  }
});

// Dialog actions
export const dialogActions = style({
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'flex-end'
});

export const cancelButton = style({
  padding: '0.5rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  backgroundColor: 'white',
  color: '#374151',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderColor: '#9ca3af'
    }
  }
});

export const resolveButton = style({
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '0.375rem',
  backgroundColor: '#2563eb',
  color: 'white',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#1d4ed8'
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
});

export const resolveAllButton = style({
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: '0.375rem',
  backgroundColor: '#10b981',
  color: 'white',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#059669'
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
});