/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-deep': 'var(--bg-deep)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        oxblood: 'var(--accent-2)',
        brass: 'var(--brass)',
        paper: 'var(--paper)',
        'paper-ink': 'var(--paper-ink)',
        'on-accent': 'var(--on-accent)',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        serif: ['"Libre Caslon Text"', 'serif'],
        body: ['Archivo', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
        lg: '6px',
      },
      animation: {
        spin33: 'spin33 1.8s linear infinite',
        reel: 'reel 1.2s linear infinite',
        flicker: 'flicker 6s linear infinite',
        pulse: 'pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
