import { style } from '@vanilla-extract/css';

// Layout 通用样式
export const fullViewport = style({
  minHeight: '100vh',
});

export const flexCenter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const flexColumn = style({
  display: 'flex',
  flexDirection: 'column',
});

export const flexRow = style({
  display: 'flex',
  flexDirection: 'row',
});

export const flexBetween = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const flexWrap = style({
  display: 'flex',
  flexWrap: 'wrap',
});

export const textCenter = style({
  textAlign: 'center',
});

export const overflowHidden = style({
  overflow: 'hidden',
});

export const overflowAuto = style({
  overflow: 'auto',
});

export const overflowXAuto = style({
  overflowX: 'auto',
});

// Grid 布局
export const grid = style({
  display: 'grid',
});

export const gridTwoColumns = style([grid, {
  gridTemplateColumns: '1fr 1fr',
}]);

export const gridAutoFit = style([grid, {
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
}]);

export const gridOneTwo = style([grid, {
  gridTemplateColumns: '1fr 2fr',
}]);

// Gap 间距
export const gap05 = style({ gap: '0.125rem' });
export const gap1 = style({ gap: '0.25rem' });
export const gap2 = style({ gap: '0.5rem' });
export const gap3 = style({ gap: '0.75rem' });
export const gap4 = style({ gap: '1rem' });
export const gap6 = style({ gap: '1.5rem' });
export const gap8 = style({ gap: '2rem' });

// Padding 内边距
export const p0 = style({ padding: 0 });
export const p2 = style({ padding: '0.5rem' });
export const p3 = style({ padding: '0.75rem' });
export const p4 = style({ padding: '1rem' });
export const p6 = style({ padding: '1.5rem' });
export const p8 = style({ padding: '2rem' });

export const px2 = style({ paddingLeft: '0.5rem', paddingRight: '0.5rem' });
export const px3 = style({ paddingLeft: '0.75rem', paddingRight: '0.75rem' });
export const px4 = style({ paddingLeft: '1rem', paddingRight: '1rem' });
export const px6 = style({ paddingLeft: '1.5rem', paddingRight: '1.5rem' });

export const py2 = style({ paddingTop: '0.5rem', paddingBottom: '0.5rem' });
export const py3 = style({ paddingTop: '0.75rem', paddingBottom: '0.75rem' });
export const py4 = style({ paddingTop: '1rem', paddingBottom: '1rem' });

// Margin 外边距
export const m0 = style({ margin: 0 });
export const m2 = style({ margin: '0.5rem' });
export const m4 = style({ margin: '1rem' });
export const m6 = style({ margin: '1.5rem' });
export const m8 = style({ margin: '2rem' });

export const mb1 = style({ marginBottom: '0.25rem' });
export const mb2 = style({ marginBottom: '0.5rem' });
export const mb4 = style({ marginBottom: '1rem' });
export const mb6 = style({ marginBottom: '1.5rem' });
export const mb8 = style({ marginBottom: '2rem' });

export const mt4 = style({ marginTop: '1rem' });
export const mt6 = style({ marginTop: '1.5rem' });
export const mt8 = style({ marginTop: '2rem' });

export const ml2 = style({ marginLeft: '0.5rem' });
export const ml4 = style({ marginLeft: '1rem' });

export const mr2 = style({ marginRight: '0.5rem' });

// Width and Height
export const wFull = style({ width: '100%' });
export const hFull = style({ height: '100%' });
export const hScreen = style({ height: '100vh' });
export const hFit = style({ height: 'fit-content' });

export const maxWFull = style({ maxWidth: '100%' });
export const maxHFull = style({ maxHeight: '100%' });

export const minW0 = style({ minWidth: 0 });

// Position
export const relative = style({ position: 'relative' });
export const absolute = style({ position: 'absolute' });
export const fixed = style({ position: 'fixed' });

// Flex properties
export const flex1 = style({ flex: 1 });
export const flexShrink0 = style({ flexShrink: 0 });

// Border radius
export const rounded = style({ borderRadius: '0.25rem' });
export const roundedMd = style({ borderRadius: '0.375rem' });
export const roundedLg = style({ borderRadius: '0.5rem' });
export const roundedFull = style({ borderRadius: '50%' });

// Colors - Text
export const textGray500 = style({ color: '#6b7280' });
export const textGray600 = style({ color: '#4b5563' });
export const textGray700 = style({ color: '#374151' });
export const textGray800 = style({ color: '#1f2937' });
export const textGray900 = style({ color: '#111827' });
export const textRed600 = style({ color: '#dc2626' });
export const textBlue600 = style({ color: '#2563eb' });
export const textGreen600 = style({ color: '#16a34a' });
export const textPurple600 = style({ color: '#7c3aed' });

// Colors - Background
export const bgWhite = style({ backgroundColor: 'white' });
export const bgGray50 = style({ backgroundColor: '#f9fafb' });
export const bgGray100 = style({ backgroundColor: '#f3f4f6' });
export const bgRed50 = style({ backgroundColor: '#fef2f2' });
export const bgRed600 = style({ backgroundColor: '#dc2626' });
export const bgBlue600 = style({ backgroundColor: '#2563eb' });
export const bgGreen600 = style({ backgroundColor: '#16a34a' });
export const bgTransparent = style({ backgroundColor: 'transparent' });

// Colors - Border
export const borderGray200 = style({ borderColor: '#e5e7eb' });
export const borderGray300 = style({ borderColor: '#d1d5db' });
export const borderRed200 = style({ borderColor: '#fecaca' });

// Border width
export const border = style({ border: '1px solid' });
export const borderB = style({ borderBottom: '1px solid' });
export const borderNone = style({ border: 'none' });

// Font sizes
export const textXs = style({ fontSize: '0.75rem' });
export const textSm = style({ fontSize: '0.875rem' });
export const textBase = style({ fontSize: '1rem' });
export const textLg = style({ fontSize: '1.125rem' });
export const textXl = style({ fontSize: '1.25rem' });
export const text2Xl = style({ fontSize: '1.5rem' });
export const text4Xl = style({ fontSize: '2rem' });

// Font weights
export const fontMedium = style({ fontWeight: 'medium' });
export const fontSemibold = style({ fontWeight: '600' });
export const fontBold = style({ fontWeight: 'bold' });

// Cursor
export const cursorPointer = style({ cursor: 'pointer' });
export const cursorNotAllowed = style({ cursor: 'not-allowed' });

// Opacity
export const opacity50 = style({ opacity: 0.5 });
export const opacity60 = style({ opacity: 0.6 });

// Shadow
export const shadowSm = style({
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
});

export const shadow = style({
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
});

export const shadowLg = style({
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
});

// Transitions
export const transition = style({
  transition: 'all 0.15s ease-in-out',
});

export const transitionColors = style({
  transition: 'background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out',
});

// Focus states
export const focusOutline = style({
  ':focus': {
    outline: 'none',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
});

// Disabled states
export const disabled = style({
  ':disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
});

// Hover states - 需要使用 selectors 语法
export const hoverBgGray50 = style({
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#f9fafb',
    },
  },
});

export const hoverBgGray100 = style({
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#f3f4f6',
    },
  },
});

export const hoverBgBlue700 = style({
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: '#1d4ed8',
    },
  },
});