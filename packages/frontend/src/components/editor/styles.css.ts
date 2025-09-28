import { style, styleVariants } from '@vanilla-extract/css';

export const container = style({
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
});

export const editorContainer = style({
  flex: 1,
  minHeight: 0,
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  overflow: 'hidden'
});

export const toolbar = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb'
});

export const toolbarRounded = style([
  toolbar,
  {
    borderRadius: '0.375rem 0.375rem 0 0'
  }
]);

export const buttonGroup = style({
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center'
});

export const button = style({
  padding: '0.25rem 0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out'
});

export const buttonVariants = styleVariants({
  active: [
    button,
    {
      backgroundColor: '#2563eb',
      color: 'white'
    }
  ],
  inactive: [
    button,
    {
      backgroundColor: 'transparent',
      color: '#374151'
    }
  ]
});

export const contentArea = style({
  flex: 1,
  display: 'flex'
});

export const previewContainer = style({
  flex: 1,
  padding: '1rem',
  overflow: 'auto',
  backgroundColor: 'white',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  lineHeight: '1.6'
});

export const errorBanner = style({
  padding: '0.5rem 1rem',
  backgroundColor: '#fef2f2',
  borderBottom: '1px solid #fecaca',
  color: '#dc2626',
  fontSize: '0.875rem'
});

export const visualJsonContainer = style({
  padding: '1rem',
  overflow: 'auto',
  height: '100%',
  backgroundColor: '#f9fafb'
});

export const visualJsonPlaceholder = style({
  padding: '1rem',
  backgroundColor: 'white',
  borderRadius: '0.375rem',
  border: '1px solid #e5e7eb'
});

export const placeholderText = style({
  color: '#6b7280',
  fontSize: '0.875rem',
  textAlign: 'center',
  margin: '2rem 0'
});

export const assetContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#6b7280',
  textAlign: 'center'
});

export const assetIcon = style({
  marginBottom: '1rem',
  opacity: 0.5
});

export const assetTitle = style({
  fontSize: '1.125rem',
  marginBottom: '0.5rem'
});

export const assetPath = style({
  fontSize: '0.875rem',
  marginTop: '0.5rem'
});

export const codeStyle = style({
  backgroundColor: '#f3f4f6',
  padding: '0.125rem 0.25rem',
  borderRadius: '0.25rem'
});

export const controlsContainer = style({
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-end'
});

export const inputGroup = style({
  flex: 1
});

export const label = style({
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  color: '#374151',
  marginBottom: '0.5rem'
});

export const input = style({
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  outline: 'none'
});

export const select = style({
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.25rem',
  backgroundColor: 'white'
});

export const saveButton = style({
  padding: '0.75rem 1.5rem',
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  transition: 'background-color 0.15s ease-in-out',
  minWidth: '80px'
});

export const saveButtonVariants = styleVariants({
  enabled: [
    saveButton,
    {
      backgroundColor: '#2563eb',
      cursor: 'pointer'
    }
  ],
  disabled: [
    saveButton,
    {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    }
  ]
});

export const statusContainer = style({
  marginTop: '0.5rem',
  fontSize: '0.75rem',
  color: '#6b7280',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

export const selectLabel = style({
  fontSize: '0.75rem',
  color: '#6b7280'
});