/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        // Thème sombre Jobzz (CLAUDE.md §11). Branché sur des variables CSS pour un futur thème clair.
        bg: 'var(--jz-bg)',
        surface: 'var(--jz-surface)',
        'surface-raised': 'var(--jz-surface-raised)',
        border: 'var(--jz-border)',
        text: 'var(--jz-text)',
        'text-secondary': 'var(--jz-text-secondary)',
        'text-muted': 'var(--jz-text-muted)',
        accent: 'var(--jz-accent)',
        'accent-hover': 'var(--jz-accent-hover)',
        'accent-bg': 'var(--jz-accent-bg)',
        'accent-ink': 'var(--jz-accent-ink)',
        danger: 'var(--jz-danger)',
        warning: 'var(--jz-warning)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        field: '8px',
      },
    },
  },
  plugins: [],
};
