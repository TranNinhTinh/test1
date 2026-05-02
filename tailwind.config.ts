import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-seed)',
          dark: 'var(--color-seed-dark)',
          light: 'var(--color-seed-light)',
          tint: 'var(--color-brand-tint)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          lowest: 'var(--color-surface-container-lowest)',
          highest: 'var(--color-surface-container-highest)',
        },
        /** Semantic text (maps to M3 onSurface / onSurfaceVariant) */
        foreground: 'var(--color-on-surface)',
        'foreground-muted': 'var(--color-on-surface-variant)',
        app: {
          outline: 'var(--color-outline)',
          error: 'var(--color-error)',
        },
        'outline-variant': 'var(--color-outline-variant)',
      },
      spacing: {
        'app-xxs': 'var(--space-xxs)',
        'app-xs': 'var(--space-xs)',
        'app-sm': 'var(--space-sm)',
        'app-md': 'var(--space-md)',
        'app-lg': 'var(--space-lg)',
        'app-xl': 'var(--space-xl)',
        'app-xxl': 'var(--space-xxl)',
      },
      borderRadius: {
        'app-sm': 'var(--radius-sm)',
        'app-md': 'var(--radius-md)',
        'app-lg': 'var(--radius-lg)',
        'app-xl': 'var(--radius-xl)',
        'app-xxl': 'var(--radius-xxl)',
        'app-sheet': 'var(--radius-sheet-top)',
      },
      maxWidth: {
        app: 'var(--app-content-max)',
      },
      transitionDuration: {
        'app-fast': 'var(--motion-fast)',
        'app-medium': 'var(--motion-medium)',
        'app-slow': 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        'app-emphasized': 'var(--ease-emphasized)',
        'app-decelerate': 'var(--ease-decelerate)',
      },
      boxShadow: {
        'app-card': 'var(--shadow-sm)',
        'app-card-hover': 'var(--shadow-md)',
        'app-nav': '0 -4px 24px rgba(29, 27, 32, 0.08), 0 -1px 0 rgba(29, 27, 32, 0.04)',
        'app-bar': 'var(--shadow-xs)',
        'app-header': 'var(--shadow-sm)',
        elevated: 'var(--shadow-md)',
        float: 'var(--shadow-float)',
        'inner-soft': 'inset 0 1px 2px rgba(29, 27, 32, 0.05)',
      },
      width: {
        sidebar: 'var(--app-sidebar-width)',
      },
      minHeight: {
        'app-nav': 'var(--app-bottom-nav-height)',
      },
    },
  },
  plugins: [],
}
export default config
