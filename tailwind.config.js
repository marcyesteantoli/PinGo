/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // --- Cyan (acción principal) ---
        primary: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#4cd7f6', // versión glow para texto en fondos oscuros
          500: '#06b6d4', // acción principal — igual en ambos modos
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#003640',
        },
        // --- Indigo (secundario / énfasis) ---
        secondary: {
          50:  '#eef0ff',
          100: '#e0e0ff',
          200: '#bdc2ff', // texto secundario sobre fondos oscuros
          300: '#a8afff',
          400: '#7b82f5',
          500: '#4f56e8',
          600: '#2f3aa3', // secondary-container
          700: '#131e8c',
          800: '#080f5e',
          900: '#000767',
        },
        // --- Ámbar (acento terciario: restaurante, advertencias cálidas) ---
        tertiary: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#e79400', // tertiary-container
          700: '#d97706',
          800: '#b45309',
          900: '#653e00',
        },
        // --- Superficies: light (50-300) y dark (600-950) ---
        surface: {
          50:  '#f0f5ff', // fondo de página en light mode
          100: '#e8edf9', // tarjeta en light mode
          200: '#dce3f2', // contenedor en light mode
          300: '#c5cedf', // borde / divisor en light mode
          600: '#31394d', // surface-bright (dark)
          700: '#222a3d', // tarjeta elevada en dark mode
          800: '#171f33', // tarjeta base en dark mode
          900: '#0b1326', // fondo de página en dark mode
          950: '#060e20', // fondo más profundo en dark mode
        },
        // --- Neutros: texto y bordes ---
        neutral: {
          50:  '#f8fafc',
          100: '#eef2f8',
          200: '#dce3ef',
          300: '#c3cedf',
          400: '#94a3b8', // placeholder / icono inactivo
          500: '#64748b',
          600: '#4a5568', // texto secundario en light mode
          700: '#334155',
          800: '#1e293b',
          900: '#0d1a2e', // texto principal en light mode
        },
        // --- Semánticos ---
        success: '#22c55e',
        warning: '#f59e0b',
        error:   '#ef233c',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'System'],
      },
    },
  },
  plugins: [],
}
