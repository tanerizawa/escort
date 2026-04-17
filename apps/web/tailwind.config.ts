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
          950: '#070d1a',
        },
        accent: {
          blue: '#38bdf8',
          purple: '#a78bfa',
          amber: '#f59e0b',
          emerald: '#34d399',
          rose: '#fb7185',
        },
        // Rose / velvet / claret palette — inspired by Victorian oxblood,
        // Renaissance damask roses and Art Deco rose-gold leaf.
        rose: {
          50: '#fbeef0',
          100: '#f6d7da',
          200: '#e8a9af',
          300: '#d47b84',
          400: '#b04a55',
          500: '#8c2f3a',
          600: '#6f2330',
          700: '#551b26',
          800: '#3d151c',
          900: '#2a0f15',
        },
        velvet: {
          50: '#f5eeee',
          100: '#ead6d7',
          200: '#c7a0a3',
          300: '#9e6b71',
          400: '#6f3f46',
          500: '#4d2a30',
          600: '#3a1e23',
          700: '#2c1619',
          800: '#1d0d10',
          900: '#110608',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'display-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },
      letterSpacing: {
        'widest-2': '0.25em',
        'widest-3': '0.35em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'fade-in-up-delay': 'fadeInUp 0.8s ease-out 0.2s both',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
        'parallax-float': 'parallaxFloat 6s ease-in-out infinite',
        'wizard-in-right': 'wizardInRight 0.35s ease-out both',
        'wizard-in-left': 'wizardInLeft 0.35s ease-out both',
        'shimmer': 'shimmerSweep 3s ease-in-out infinite',
        'float': 'gentleFloat 8s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'rose-bloom': 'roseBloom 1200ms ease-out both',
        'petal-drift': 'petalDrift 14s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.08) translate(-1%, -1%)' },
        },
        parallaxFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wizardInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        wizardInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmerSweep: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-8px) rotate(1deg)' },
          '66%': { transform: 'translateY(4px) rotate(-1deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        roseBloom: {
          '0%': { opacity: '0', transform: 'scale(0.85) rotate(-4deg)' },
          '60%': { opacity: '1', transform: 'scale(1.03) rotate(1deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        petalDrift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)', opacity: '0.55' },
          '50%': { transform: 'translate3d(8px, -6px, 0) rotate(2deg)', opacity: '0.9' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #e9bd82 0%, #c9a96e 50%, #b8924f 100%)',
        'gold-gradient-subtle': 'linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.02) 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0b1120 0%, #0f172a 50%, #0b1120 100%)',
        'editorial-gradient': 'linear-gradient(180deg, transparent 0%, #0b1120 100%)',
        // Rose-gold foil — for monogram accents and hairlines.
        'rose-gold': 'linear-gradient(135deg, #e9bd82 0%, #c9a96e 40%, #b04a55 100%)',
        'rose-gold-subtle':
          'linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(176,74,85,0.08) 100%)',
        // Deep velvet radial — vignette backdrop evoking oxblood drapery.
        'velvet-radial':
          'radial-gradient(ellipse at center, rgba(77,42,48,0.35) 0%, rgba(11,17,32,0) 65%)',
        'claret-fade':
          'linear-gradient(180deg, rgba(140,47,58,0) 0%, rgba(140,47,58,0.18) 50%, rgba(11,17,32,0) 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
