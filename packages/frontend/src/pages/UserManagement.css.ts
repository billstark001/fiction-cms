import { style } from '@vanilla-extract/css';

// User Management 专用样式
export const userManagementContainer = style({});

export const createUserCard = style({});

export const userFormGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
});

export const roleCheckboxContainer = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
});

export const roleCheckboxLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
});

export const roleCheckbox = style({
  width: '1rem',
  height: '1rem',
});

export const roleCheckboxText = style({
  fontSize: '0.875rem',
});

// User actions
export const userActions = style({
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
});

export const userListHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const createUserButton = style({
  padding: '0.5rem 1rem',
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

// User status display
export const userStatus = style({
  fontSize: '0.75rem',
  padding: '0.125rem 0.5rem',
  borderRadius: '9999px',
  fontWeight: 'medium',
});

export const userStatusActive = style([userStatus, {
  backgroundColor: '#dcfce7',
  color: '#166534',
}]);

export const userStatusInactive = style([userStatus, {
  backgroundColor: '#fef2f2',
  color: '#991b1b',
}]);

// User table specific
export const userTableActions = style({
  display: 'flex',
  gap: '0.5rem',
});

export const roleTagsContainer = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.25rem',
});