import { style, styleVariants, keyframes } from '@vanilla-extract/css';

const overlayShow = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 }
});

const contentShow = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translate(-50%, -48%) scale(0.96)'
  },
  '100%': {
    opacity: 1,
    transform: 'translate(-50%, -50%) scale(1)'
  }
});

export const overlay = style({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(2px)',
  transition: 'opacity 0.2s ease',
  animation: `${overlayShow} 200ms ease`
});

export const content = style({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#ffffff',
  borderRadius: '0.75rem',
  boxShadow: '0px 32px 70px rgba(15, 23, 42, 0.2)',
  width: 'min(92vw, 820px)',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  animation: `${contentShow} 220ms cubic-bezier(0.16, 1, 0.3, 1)`
});

export const contentSizes = styleVariants({
  sm: {
    width: 'min(92vw, 520px)'
  },
  md: {
    width: 'min(92vw, 720px)'
  },
  lg: {
    width: 'min(92vw, 960px)'
  },
  full: {
    width: '92vw',
    height: '92vh'
  }
});

export const header = style({
  padding: '1.5rem 2rem 1rem',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
});

export const title = style({
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#111827'
});

export const description = style({
  margin: 0,
  fontSize: '0.95rem',
  color: '#4b5563'
});

export const body = style({
  padding: '1.5rem 2rem',
  overflowY: 'auto',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  backgroundColor: '#ffffff'
});

export const footer = style({
  padding: '1.25rem 2rem',
  borderTop: '1px solid #e5e7eb',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  backgroundColor: '#f9fafb'
});

export const closeButton = style({
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  width: '2rem',
  height: '2rem',
  borderRadius: '9999px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: '#6b7280',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'grid',
  placeItems: 'center',

  selectors: {
    '&:hover': {
      backgroundColor: '#f3f4f6',
      color: '#111827'
    },
    '&:focus-visible': {
      outline: '2px solid #2563eb',
      outlineOffset: '2px'
    }
  }
});

export const closeIcon = style({
  display: 'block',
  width: '1rem',
  height: '1rem',
  position: 'relative',

  '::before': {
    content: '',
    position: 'absolute',
    top: '50%',
    left: '0',
    width: '100%',
    height: '2px',
    backgroundColor: 'currentColor',
    transform: 'translateY(-50%) rotate(45deg)'
  },

  '::after': {
    content: '',
    position: 'absolute',
    top: '50%',
    left: '0',
    width: '100%',
    height: '2px',
    backgroundColor: 'currentColor',
    transform: 'translateY(-50%) rotate(-45deg)'
  }
});
