import { style } from '@vanilla-extract/css';

// Table 相关样式
export const table = style({
  width: '100%',
  borderCollapse: 'collapse',
});

export const tableContainer = style({
  overflowX: 'auto',
});

export const thead = style({});

export const tbody = style({});

export const tr = style({
  borderBottom: '1px solid #e5e7eb',
});

export const trHover = style([tr, {
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
}]);

export const th = style({
  textAlign: 'left',
  padding: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  color: '#6b7280',
});

export const td = style({
  padding: '0.75rem',
});

export const tdWithText = style([td, {
  fontSize: '0.875rem',
  color: '#6b7280',
}]);

// Table cell content styles
export const cellContent = style({
  display: 'flex',
  flexDirection: 'column',
});

export const cellPrimary = style({
  fontWeight: 'medium',
  color: '#111827',
});

export const cellSecondary = style({
  fontSize: '0.875rem',
  color: '#6b7280',
});

// Status badges
export const badge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.125rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 'medium',
  borderRadius: '9999px',
});

export const badgeGreen = style([badge, {
  backgroundColor: '#dcfce7',
  color: '#166534',
}]);

export const badgeRed = style([badge, {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
}]);

export const badgeYellow = style([badge, {
  backgroundColor: '#fefce8',
  color: '#92400e',
}]);

export const badgeBlue = style([badge, {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
}]);

export const badgeGray = style([badge, {
  backgroundColor: '#f3f4f6',
  color: '#374151',
}]);

// Role tags
export const roleTag = style({
  fontSize: '0.75rem',
  padding: '0.125rem 0.375rem',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  borderRadius: '0.25rem',
  fontWeight: 'medium',
});

// Action buttons in table
export const tableActionButton = style({
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: 'medium',
  borderRadius: '0.25rem',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
});

export const tableActionButtonDanger = style([tableActionButton, {
  borderColor: '#fca5a5',
  color: '#dc2626',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#fef2f2',
    },
  },
}]);

// Empty state
export const emptyState = style({
  textAlign: 'center',
  padding: '3rem',
  color: '#6b7280',
});

export const emptyStateTitle = style({
  fontSize: '1.125rem',
  marginBottom: '0.5rem',
});

export const emptyStateText = style({
  margin: 0,
});