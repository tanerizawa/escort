import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8ef',
          100: '#f9edda',
          200: '#f2d8b3',
          300: '#e9bd82',
          400: '#c9a96e',
          500: '#b8924f',
          600: '#a47a3e',
          700: '#886135',
          800: '#6f4e30',
          900: '#5c422a',
        },
        dark: {
          50: '#f3f4f8',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#0f172a',
          900: '#0b1120',
        },
      },
    },
  },
  plugins: [],
};

export default config;
