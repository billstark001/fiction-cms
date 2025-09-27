import { style } from '@vanilla-extract/css';

// Dashboard 专用样式
export const dashboardContainer = style({});

// Stats Cards
export const statsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem',
});

export const statCard = style({
  // 使用 Layout.css 中的 card 样式作为基础
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

// Site list in dashboard
export const recentSitesList = style({
  display: 'grid',
  gap: '1rem',
});

export const recentSiteItem = style({
  padding: '1rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const siteItemInfo = style({
  display: 'flex',
  flexDirection: 'column',
});

export const siteItemTitle = style({
  fontWeight: 'medium',
  fontSize: '1rem',
  color: '#111827',
  marginBottom: '0.25rem',
  textDecoration: 'none',
});

export const siteItemDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  marginBottom: '0.25rem',
});

export const siteItemPath = style({
  fontSize: '0.75rem',
  color: '#9ca3af',
  fontFamily: 'monospace',
  backgroundColor: '#f3f4f6',
  padding: '0.125rem 0.25rem',
  borderRadius: '0.25rem',
  display: 'inline-block',
});

export const siteItemActions = style({
  display: 'flex',
  gap: '0.5rem',
});

export const siteItemButton = style({
  padding: '0.25rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 'medium',
  borderRadius: '0.25rem',
  border: '1px solid #d1d5db',
  backgroundColor: 'white',
  color: '#374151',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  textDecoration: 'none',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
});

// System Health
export const systemHealthContainer = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

export const healthIndicator = style({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
});

export const healthIndicatorGreen = style([healthIndicator, {
  backgroundColor: '#16a34a',
}]);

export const healthText = style({
  color: '#374151',
});

// Empty states
export const emptyStateContainer = style({
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