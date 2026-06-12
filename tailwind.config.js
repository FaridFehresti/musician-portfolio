/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // Colours/fonts resolve through CSS vars, so the same utility class
      // (`bg-accent`, `font-display`) renders each template's palette/fonts —
      // whichever template's CSS is loaded defines the vars. Names are the
      // union of both templates' tokens (analog + classic neon).
      colors: {
        bg: 'var(--bg)',
        'bg-deep': 'var(--bg-deep)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-warm': 'var(--accent-2)',
        oxblood: 'var(--accent-2)',
        brass: 'var(--brass)',
        paper: 'var(--paper)',
        'paper-ink': 'var(--paper-ink)',
        'on-accent': 'var(--on-accent)',
        'neon-cyan': 'var(--accent-2)',
        'neon-magenta': 'var(--accent)',
        'neon-violet': 'var(--accent-2)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        // analog (keyframes live in the analog stylesheet)
        spin33: 'spin33 1.8s linear infinite',
        reel: 'reel 1.2s linear infinite',
        flicker: 'flicker 6s linear infinite',
        pulse: 'pulse 1.6s ease-in-out infinite',
        // classic
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
        eq1: { '0%, 100%': { height: '4px' }, '50%': { height: '14px' } },
        eq2: { '0%, 100%': { height: '10px' }, '50%': { height: '4px' } },
        eq3: { '0%, 100%': { height: '7px' }, '50%': { height: '14px' } },
      },
    },
  },
  plugins: [],
}
