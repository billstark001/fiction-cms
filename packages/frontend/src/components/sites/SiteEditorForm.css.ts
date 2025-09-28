import { style, styleVariants } from '@vanilla-extract/css';

export const formContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
});

export const section = style({
  border: '1px solid #e5e7eb',
  borderRadius: '0.75rem',
  backgroundColor: '#ffffff',
  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)',
  overflow: 'hidden'
});

export const sectionHeader = style({
  padding: '1.25rem 1.75rem 1rem',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
});

export const sectionTitle = style({
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#111827'
});

export const sectionDescription = style({
  margin: 0,
  fontSize: '0.9rem',
  color: '#4b5563'
});

export const sectionBody = style({
  padding: '1.5rem 1.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
});

export const grid = style({
  display: 'grid',
  gap: '1.25rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
});

export const fullWidth = style({
  gridColumn: '1 / -1'
});

export const toggleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
});

export const toggleLabel = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem'
});

export const toggleDescription = style({
  fontSize: '0.85rem',
  color: '#6b7280'
});

export const arrayList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
});

export const arrayItem = style({
  border: '1px solid #e5e7eb',
  borderRadius: '0.6rem',
  padding: '1.25rem',
  backgroundColor: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
});

export const arrayItemHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
});

export const arrayItemTitle = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem'
});

export const arrayItemHeading = style({
  margin: 0,
  fontSize: '1rem',
  fontWeight: 600,
  color: '#1f2937'
});

export const arrayItemSubtitle = style({
  margin: 0,
  fontSize: '0.85rem',
  color: '#6b7280'
});

export const arrayItemBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
});

export const nestedList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
});

export const inlineInputs = style({
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap'
});

export const keyValueRow = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.75rem'
});

export const emptyState = style({
  padding: '1rem',
  borderRadius: '0.5rem',
  border: '1px dashed #cbd5f5',
  backgroundColor: '#f8fafc',
  fontSize: '0.9rem',
  color: '#6b7280'
});

export const actionsRow = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  marginTop: '1.5rem'
});

export const supportText = style({
  fontSize: '0.8rem',
  color: '#6b7280'
});

export const badge = styleVariants({
  default: {
    padding: '0.15rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor: '#e5e7eb',
    color: '#374151'
  },
  accent: {
    padding: '0.2rem 0.55rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    backgroundColor: '#2563eb1a',
    color: '#1d4ed8'
  }
});

export const chipsRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.35rem'
});

export const chip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.25rem 0.6rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 500,
  backgroundColor: '#e0f2fe',
  color: '#0369a1'
});
