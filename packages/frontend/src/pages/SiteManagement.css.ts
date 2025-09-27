import { style } from '@vanilla-extract/css';

// Search container
export const siteSearchContainer = style({
  marginBottom: '1.5rem',
});

// Grid layout
export const siteGrid = style({
  display: 'grid',
  gap: '1rem',
});

// Site item card
export const siteItem = style({
  padding: '1.5rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  transition: 'all 0.15s ease-in-out',
  cursor: 'pointer',

  selectors: {
    '&:hover': {
      borderColor: '#d1d5db',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  },
});

// Site header layout
export const siteItemHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
});

export const siteItemInfo = style({
  flex: 1,
});

export const siteItemTitle = style({
  fontSize: '1.125rem',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 0.5rem 0',
});

export const siteItemDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: '0 0 0.5rem 0',
});

// Actions area
export const siteItemActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
});

// Status badges
export const statusBadge = style({
  padding: '0.25rem 0.75rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 'medium',
});

export const statusBadgeActive = style([statusBadge, {
  backgroundColor: '#dcfce7',
  color: '#166534',
}]);

export const statusBadgeInactive = style([statusBadge, {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
}]);

// Buttons
export const button = style({
  padding: '0.5rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontWeight: 'medium',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
});

export const manageButton = style([button, {
  backgroundColor: '#f3f4f6',
  color: '#374151',

  selectors: {
    '&:hover': {
      backgroundColor: '#e5e7eb',
    },
  },
}]);

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

  selectors: {
    '&:hover': {
      backgroundColor: '#1d4ed8',
    },
  },
});

// Site metadata
export const siteItemMeta = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  fontSize: '0.75rem',
  color: '#6b7280',
});

export const siteMetaText = style({
  fontWeight: 'medium',
});

export const siteCodeBlock = style({
  backgroundColor: '#f3f4f6',
  padding: '0.125rem 0.25rem',
  borderRadius: '0.25rem',
  fontFamily: 'monospace',
});

// External link
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

// Pagination
export const paginationContainer = style({
  marginTop: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.5rem',
});

export const paginationButton = style({
  padding: '0.5rem 0.75rem',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease-in-out',
});

export const paginationButtonEnabled = style([paginationButton, {
  backgroundColor: '#2563eb',
  color: 'white',

  selectors: {
    '&:hover': {
      backgroundColor: '#1d4ed8',
    },
  },
}]);

export const paginationButtonDisabled = style([paginationButton, {
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  cursor: 'not-allowed',
}]);

export const paginationInfo = style({
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  color: '#374151',
});

// Empty state
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

// Loading states
export const loadingContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  color: '#6b7280',
});

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