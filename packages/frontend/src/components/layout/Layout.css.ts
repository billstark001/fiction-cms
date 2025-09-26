import { style } from '@vanilla-extract/css';

export const layout = style({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
});

export const sidebar = style({
  width: '16rem',
  backgroundColor: 'white',
  borderRight: '1px solid #e5e7eb',
  padding: '1rem',
  flexShrink: 0,
});

export const main = style({
  flex: 1,
  padding: '2rem',
  overflow: 'auto',
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #e5e7eb',
});

export const logo = style({
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2563eb',
  marginBottom: '2rem',
});

export const nav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

export const navItem = style({
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem',
  borderRadius: '0.375rem',
  textDecoration: 'none',
  color: '#6b7280',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  transition: 'all 0.15s ease-in-out',
  
  ':hover': {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
});

export const navItemActive = style([navItem, {
  backgroundColor: '#eff6ff',
  color: '#2563eb',
  borderLeft: '3px solid #2563eb',
}]);

export const userMenu = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
});

export const userName = style({
  fontSize: '0.875rem',
  color: '#374151',
  fontWeight: 'medium',
});

export const userRole = style({
  fontSize: '0.75rem',
  color: '#6b7280',
});

export const logoutButton = style({
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  color: '#6b7280',
  backgroundColor: 'transparent',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  
  ':hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#9ca3af',
  },
});

export const pageTitle = style({
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#111827',
});

export const pageDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  marginTop: '0.25rem',
});

export const card = style({
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  marginBottom: '1.5rem',
});

export const cardHeader = style({
  marginBottom: '1rem',
});

export const cardTitle = style({
  fontSize: '1.125rem',
  fontWeight: 'semibold',
  color: '#111827',
  marginBottom: '0.25rem',
});

export const cardDescription = style({
  fontSize: '0.875rem',
  color: '#6b7280',
});