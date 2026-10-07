import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Alfa Slab One"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        tierra: { 50: '#13140f', 100: '#34352f', 700: '#a38d7b', 900: '#e4e3d9' },
        ocre: { 400: '#ffbe82', 500: '#fd971f', 600: '#e08612' },
        vino: { 600: '#ffb4ab', 700: '#ffb4ab' },
        surface: {
          DEFAULT: '#13140f',
          dim: '#13140f',
          bright: '#393a33',
          variant: '#34352f',
        },
        'surface-container': '#1f201a',
        'surface-container-high': '#2a2a24',
        'surface-container-low': '#1b1c16',
        'surface-container-lowest': '#0e0f0a',
        'surface-container-highest': '#34352f',
        'on-surface': {
          DEFAULT: '#e4e3d9',
          variant: '#dbc2ae',
        },
        primary: {
          DEFAULT: '#ffbe82',
          container: '#fd971f',
          fixed: '#ffdcc0',
        },
        'on-primary-container': '#653700',
        gold: '#E6DB74',
        comment: '#75715E',
        pink: '#F92672',
        secondary: {
          DEFAULT: '#a8e430',
          container: '#8ec703',
        },
        tertiary: {
          DEFAULT: '#67daf0',
          container: '#46bed4',
        },
        outline: {
          DEFAULT: '#a38d7b',
          variant: '#554335',
        },
        terracotta: { DEFAULT: '#C8452D', dark: '#E8613F' },
        ink: '#2B1B14',
        paper: '#F4E9D3',
        cream: '#F4E9D3',
        card: { DEFAULT: '#FBF5E8', dark: '#2B2520' },
        night: '#211C18',
        ochre: '#D9A441',
      },
    },
  },
  plugins: [],
};

export default config;
