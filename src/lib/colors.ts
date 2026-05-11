// Palette constants mirroring tailwind.config.js — use in inline style props where className won't work
export const colors = {
  primary: {
    400: '#7b82f5',
    500: '#4f56e8',
    600: '#2f3aa3',
  },
  secondary: {
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
  },
  tertiary: {
    400: '#FCAF45',
    500: '#F77737',
  },
  neutral: {
    50:  '#f8fafc',
    100: '#eef2f8',
    200: '#dce3ef',
    300: '#c3cedf',
    400: '#94a3b8',
    500: '#64748b',
    600: '#4a5568',
    700: '#334155',
    800: '#1e293b',
    900: '#0d1a2e',
  },
  surface: {
    700: '#1e2c42',
    800: '#142033',
    900: '#0a1628',
  },
  success: {
    600: '#16a34a',
  },
  warning: {
    400: '#fbbf24',
  },
  error: '#ef233c',
  white: '#ffffff',
  black: '#000000',
} as const
