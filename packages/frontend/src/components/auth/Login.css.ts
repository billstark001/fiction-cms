import { style } from '@vanilla-extract/css';

export const loginContainer = style({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f9fafb',
  padding: '1rem',
});

export const loginCard = style({
  width: '100%',
  maxWidth: '400px',
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  padding: '2rem',
});

export const loginHeader = style({
  textAlign: 'center',
  marginBottom: '2rem',
});

export const loginTitle = style({
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '0.5rem',
});

export const loginSubtitle = style({
  fontSize: '0.875rem',
  color: '#6b7280',
});

export const loginForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

export const formGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

export const label = style({
  fontSize: '0.875rem',
  fontWeight: 'medium',
  color: '#374151',
});

export const input = style({
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  backgroundColor: 'white',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  
  ':focus': {
    outline: 'none',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
  
  ':disabled': {
    backgroundColor: '#f9fafb',
    cursor: 'not-allowed',
  },
});

export const button = style({
  width: '100%',
  padding: '0.625rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  border: 'none',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

export const primaryButton = style([button, {
  backgroundColor: '#2563eb',
  color: 'white',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#1d4ed8',
    },
  },
  
  ':active': {
    transform: 'translateY(1px)',
  },
}]);

export const errorMessage = style({
  padding: '0.75rem',
  backgroundColor: '#fef2f2',
  borderRadius: '0.375rem',
  border: '1px solid #fecaca',
  fontSize: '0.875rem',
  color: '#dc2626',
  marginBottom: '1rem',
});

export const successMessage = style({
  padding: '0.75rem',
  backgroundColor: '#f0fdf4',
  borderRadius: '0.375rem',
  border: '1px solid #bbf7d0',
  fontSize: '0.875rem',
  color: '#166534',
  marginBottom: '1rem',
});

export const loadingSpinner = style({
  display: 'inline-block',
  width: '1rem',
  height: '1rem',
  border: '2px solid transparent',
  borderTop: '2px solid currentColor',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginRight: '0.5rem',
});

// Add keyframes for spinner animation
export const globalStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;