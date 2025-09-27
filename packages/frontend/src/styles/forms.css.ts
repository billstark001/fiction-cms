import { style } from '@vanilla-extract/css';

// Form 相关样式
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

export const formGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
});

export const formGrid = style({
  display: 'grid',
  gap: '1rem',
});

export const formGridTwoColumns = style([formGrid, {
  gridTemplateColumns: '1fr 1fr',
}]);

export const label = style({
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  marginBottom: '0.5rem',
  color: '#374151',
});

export const input = style({
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  backgroundColor: 'white',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  
  ':focus': {
    outline: 'none',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
  
  ':disabled': {
    backgroundColor: '#f9fafb',
    cursor: 'not-allowed',
  },
});

export const textarea = style([input, {
  minHeight: '6rem',
  resize: 'vertical',
}]);

export const select = style([input, {
  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
  backgroundPosition: 'right 0.5rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.5em 1.5em',
  paddingRight: '2.5rem',
}]);

// Button 基础样式
export const buttonBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
  borderRadius: '0.375rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  textDecoration: 'none',
  
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

// Button 变体样式
export const primaryButton = style([buttonBase, {
  backgroundColor: '#2563eb',
  color: 'white',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#1d4ed8',
    },
  },
  
  ':active': {
    transform: 'translateY(1px)',
  },
}]);

export const secondaryButton = style([buttonBase, {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#f9fafb',
      borderColor: '#9ca3af',
    },
  },
}]);

export const dangerButton = style([buttonBase, {
  backgroundColor: '#dc2626',
  color: 'white',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#b91c1c',
    },
  },
}]);

export const outlineButton = style([buttonBase, {
  backgroundColor: 'transparent',
  border: '1px solid #d1d5db',
  color: '#374151',
  
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#f9fafb',
    },
  },
}]);

// Button 尺寸变体
export const smallButton = style({
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
});

export const largeButton = style({
  padding: '0.75rem 1.5rem',
  fontSize: '0.875rem',
  fontWeight: 'medium',
});

// Loading spinner for buttons
export const loadingSpinner = style({
  display: 'inline-block',
  width: '1rem',
  height: '1rem',
  border: '2px solid transparent',
  borderTop: '2px solid currentColor',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginRight: '0.5rem',
});

// Checkbox 和 Radio 样式
export const checkbox = style({
  width: '1rem',
  height: '1rem',
  borderRadius: '0.25rem',
  border: '1px solid #d1d5db',
  
  ':checked': {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
});

export const radio = style([checkbox, {
  borderRadius: '50%',
}]);

// Form 布局相关
export const formActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  marginTop: '1.5rem',
});

export const formActionsLeft = style([formActions, {
  justifyContent: 'flex-start',
}]);

export const formActionsCenter = style([formActions, {
  justifyContent: 'center',
}]);

export const formActionsBetween = style([formActions, {
  justifyContent: 'space-between',
}]);

// 错误和成功消息
export const errorMessage = style({
  padding: '0.75rem',
  backgroundColor: '#fef2f2',
  borderRadius: '0.375rem',
  border: '1px solid #fecaca',
  fontSize: '0.875rem',
  color: '#dc2626',
  marginBottom: '1rem',
});

export const successMessage = style({
  padding: '0.75rem',
  backgroundColor: '#f0fdf4',
  borderRadius: '0.375rem',
  border: '1px solid #bbf7d0',
  fontSize: '0.875rem',
  color: '#166534',
  marginBottom: '1rem',
});

// Info message
export const infoMessage = style({
  padding: '1rem',
  backgroundColor: '#f9fafb',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  color: '#6b7280',
  marginTop: '1.5rem',
});

// Input wrapper for relative positioning
export const inputWrapper = style({
  position: 'relative',
});

// Input addon (for show/hide password buttons etc)
export const inputAddon = style({
  position: 'absolute',
  right: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '0.875rem',
  padding: 0,
  
  ':disabled': {
    cursor: 'not-allowed',
  },
});

// Field group for inline fields
export const fieldGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const fieldGroupVertical = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
});