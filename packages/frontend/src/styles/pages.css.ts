import { style } from '@vanilla-extract/css';

// Dashboard Stats 样式
export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem',
});

export const statNumber = style({
  fontSize: '2rem',
  fontWeight: 'bold',
  margin: 0,
});

export const statNumberBlue = style([statNumber, {
  color: '#2563eb',
}]);

export const statNumberGreen = style([statNumber, {
  color: '#16a34a',
}]);

export const statNumberPurple = style([statNumber, {
  color: '#7c3aed',
}]);

export const statLabel = style({
  color: '#6b7280',
  margin: '0.5rem 0 0 0',
});

// Site grid layout
export const siteGrid = style({
  display: 'grid',
  gap: '1rem',
});

export const siteItem = style({
  padding: '1rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const siteItemHover = style([siteItem, {
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
    },
  },
}]);

export const siteInfo = style({
  display: 'flex',
  flexDirection: 'column',
});

export const siteTitle = style({
  fontSize: '1.125rem',
  fontWeight: 'medium',
  color: '#111827',
  marginBottom: '0.25rem',
});

export const siteDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  marginBottom: '0.5rem',
});

export const siteMeta = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});

export const siteMetaItem = style({
  fontSize: '0.75rem',
  color: '#9ca3af',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
});

export const siteActions = style({
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
});

// Status indicator
export const statusIndicator = style({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
});

export const statusActive = style([statusIndicator, {
  backgroundColor: '#16a34a',
}]);

export const statusInactive = style([statusIndicator, {
  backgroundColor: '#dc2626',
}]);

// System health
export const systemHealth = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

export const healthText = style({
  color: '#374151',
});

// Loading states
export const loadingText = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: '#6b7280',
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
});

// Search input
export const searchInput = style({
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.15s ease-in-out',
  
  ':focus': {
    borderColor: '#2563eb',
  },
});

// Pagination
export const pagination = style({
  marginTop: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',
});

export const paginationButton = style({
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  color: '#374151',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#f9fafb',
    },
  },
});

export const paginationActive = style([paginationButton, {
  backgroundColor: '#2563eb',
  color: 'white',
  borderColor: '#2563eb',
}]);

export const paginationInfo = style({
  fontSize: '0.875rem',
  color: '#6b7280',
});

// Loading overlay
export const loadingOverlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  color: '#6b7280',
});

// Filter dropdown
export const filterSelect = style({
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  backgroundColor: 'white',
  cursor: 'pointer',
});

// Common page layout styles
export const header = style({
  marginBottom: '2rem',
});

export const pageTitle = style({
  fontSize: '1.875rem',
  fontWeight: 'bold',
  color: '#111827',
  margin: 0,
});

export const pageDescription = style({
  fontSize: '1rem',
  color: '#6b7280',
  margin: '0.5rem 0 0 0',
});

export const card = style({
  backgroundColor: 'white',
  padding: '1.5rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
});

export const cardHeader = style({
  marginBottom: '1rem',
});

export const cardTitle = style({
  fontSize: '1.125rem',
  fontWeight: '600',
  color: '#111827',
  margin: 0,
});

export const cardDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: '0.5rem 0 0 0',
});