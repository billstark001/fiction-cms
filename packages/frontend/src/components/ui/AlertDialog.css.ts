import { style } from '@vanilla-extract/css';

export const overlay = style({
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  animation: 'fadeIn 0.15s ease-out',
  
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  }
});

export const content = style({
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  border: '1px solid #e5e7eb',
  maxWidth: '32rem',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  position: 'relative',
  animation: 'slideInUp 0.15s ease-out',
  
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: 'none'
    }
  },
  
  selectors: {
    '&:focus': {
      outline: 'none'
    }
  }
});

export const header = style({
  padding: '1.5rem',
  paddingBottom: '1rem',
  textAlign: 'center',
});

export const footer = style({
  padding: '1rem 1.5rem 1.5rem',
  display: 'flex',
  gap: '0.75rem',
  justifyContent: 'flex-end',
  flexDirection: 'row-reverse',
});

export const title = style({
  fontSize: '1.125rem',
  fontWeight: '600',
  lineHeight: '1.25',
  color: '#111827',
  marginBottom: '0.5rem',
});

export const description = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: '1.4',
});

export const action = style({
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#1d4ed8',
    },
    '&:focus': {
      outline: '2px solid #2563eb',
      outlineOffset: '2px',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    }
  }
});

export const cancel = style({
  backgroundColor: 'transparent',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
      borderColor: '#9ca3af',
    },
    '&:focus': {
      outline: '2px solid #6b7280',
      outlineOffset: '2px',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    }
  }
});

export const destructive = style({
  backgroundColor: '#dc2626',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#b91c1c',
    },
    '&:focus': {
      outline: '2px solid #dc2626',
      outlineOffset: '2px',
    }
  }
});