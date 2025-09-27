import { style } from '@vanilla-extract/css';

// Loading 状态样式
export const loadingContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  fontSize: '1rem',
  color: '#6b7280',
});

// Access Denied 容器样式
export const accessDeniedContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  flexDirection: 'column',
  gap: '1rem',
  textAlign: 'center',
  padding: '2rem',
});

export const accessDeniedTitle = style({
  fontSize: '1.5rem',
  color: '#dc2626',
  margin: 0,
});

export const accessDeniedText = style({
  color: '#6b7280',
  margin: 0,
});

export const accessDeniedRoles = style({
  fontSize: '0.875rem',
  color: '#9ca3af',
  margin: 0,
});