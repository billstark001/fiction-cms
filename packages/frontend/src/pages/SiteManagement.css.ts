import { style } from '@vanilla-extract/css';

// Site management 专用样式
export const siteManagementContainer = style({});

export const siteSearchContainer = style({
  marginBottom: '1.5rem',
});

export const siteGrid = style({
  display: 'grid',
  gap: '1rem',
});

export const siteCard = style({
  padding: '1rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all 0.15s ease-in-out',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
    },
  },
});

export const siteInfo = style({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

export const siteTitle = style({
  fontSize: '1.125rem',
  fontWeight: 'medium',
  color: '#111827',
  marginBottom: '0.25rem',
  textDecoration: 'none',
});

export const siteDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  marginBottom: '0.5rem',
});

export const siteMeta = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '0.5rem',
  fontSize: '0.75rem',
  color: '#9ca3af',
});

export const siteMetaItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
});

export const siteActions = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  alignItems: 'flex-end',
});

export const siteStatusBadge = style({
  fontSize: '0.75rem',
  padding: '0.125rem 0.5rem',
  borderRadius: '9999px',
  fontWeight: 'medium',
});

export const siteStatusActive = style([siteStatusBadge, {
  backgroundColor: '#dcfce7',
  color: '#166534',
}]);

export const siteStatusInactive = style([siteStatusBadge, {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
}]);

export const siteActionButton = style({
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

export const createSiteButton = style({
  padding: '0.75rem 1.5rem',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease-in-out',
  textDecoration: 'none',
  
  selectors: {
    '&:hover': {
      backgroundColor: '#1d4ed8',
    },
  },
});

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

// Loading state
export const loadingContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  color: '#6b7280',
});

// Site detail metadata
export const siteDetailMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

export const statusDot = style({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  flexShrink: 0,
});

export const statusDotActive = style([statusDot, {
  backgroundColor: '#16a34a',
}]);

export const statusDotInactive = style([statusDot, {
  backgroundColor: '#dc2626',
}]);

export const inlineCode = style({
  backgroundColor: '#f3f4f6',
  padding: '0.125rem 0.375rem',
  borderRadius: '0.25rem',
  fontSize: '0.875rem',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
});

export const metaLabel = style({
  fontWeight: 'medium',
});

// Action buttons container
export const actionButtonsContainer = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  marginTop: '2rem',
});

// External link style
export const externalLink = style({
  color: '#2563eb',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  
  selectors: {
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});