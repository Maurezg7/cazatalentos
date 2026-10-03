import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tierra: { 50: '#faf6f1', 900: '#3d2b1f' },
        ocre: { 500: '#c8892f' },
        vino: { 700: '#7a1f2b' },
      },
    },
  },
  plugins: [],
};

export default config;
