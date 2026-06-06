/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b0612',
        surface: '#140a22',
        'surface-2': '#1d0f33',
        accent: '#ff2fd0',
        'accent-warm': '#00e5ff',
        text: '#f3e9ff',
        muted: '#8b7da6',
        'neon-cyan': '#00e5ff',
        'neon-magenta': '#ff2fd0',
        'neon-violet': '#7a4dff',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      animation: {
        spin: 'spin 1.8s linear infinite',
        'float-up': 'floatUp 6s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        equalizer1: 'eq1 0.8s ease-in-out infinite',
        equalizer2: 'eq2 0.6s ease-in-out infinite',
        equalizer3: 'eq3 1s ease-in-out infinite',
      },
      keyframes: {
        floatUp: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.15' },
          '50%': { transform: 'translateY(-40px) rotate(180deg)', opacity: '0.25' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        eq1: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '14px' },
        },
        eq2: {
          '0%, 100%': { height: '10px' },
          '50%': { height: '4px' },
        },
        eq3: {
          '0%, 100%': { height: '7px' },
          '50%': { height: '14px' },
        },
      },
    },
  },
  plugins: [],
}
