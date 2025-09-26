import { style } from '@vanilla-extract/css';

export const container = style({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem',
});

export const header = style({
  textAlign: 'center',
  marginBottom: '2rem',
});

export const title = style({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: '#2563eb',
  marginBottom: '0.5rem',
});

export const subtitle = style({
  fontSize: '1.125rem',
  color: '#6b7280',
});

export const section = style({
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
});

export const sectionTitle = style({
  fontSize: '1.5rem',
  fontWeight: 'semibold',
  marginBottom: '1rem',
  color: '#374151',
});

export const storyCard = style({
  padding: '1rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  marginBottom: '1rem',
  ':hover': {
    backgroundColor: '#f9fafb',
  },
});

export const storyTitle = style({
  fontSize: '1.125rem',
  fontWeight: 'medium',
  color: '#111827',
  marginBottom: '0.5rem',
});

export const storyMeta = style({
  fontSize: '0.875rem',
  color: '#6b7280',
  marginBottom: '0.5rem',
});

export const storyExcerpt = style({
  fontSize: '0.875rem',
  color: '#4b5563',
});

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  padding: '0.5rem 1rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  ':hover': {
    transform: 'translateY(-1px)',
  },
});

export const primaryButton = style([button, {
  backgroundColor: '#2563eb',
  color: 'white',
  ':hover': {
    backgroundColor: '#1d4ed8',
  },
}]);

export const loadingText = style({
  color: '#6b7280',
  fontStyle: 'italic',
});

export const errorText = style({
  color: '#dc2626',
  fontWeight: 'medium',
});