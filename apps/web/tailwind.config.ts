import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Ibarra Real Nova"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        tierra: { 50: '#faf6f1', 100: '#f0e8dc', 700: '#6b5240', 900: '#3d2b1f' },
        ocre: { 400: '#d9a54a', 500: '#c8892f', 600: '#a86f1f' },
        vino: { 600: '#8f2531', 700: '#7a1f2b' },
      },
    },
  },
  plugins: [],
};

export default config;
