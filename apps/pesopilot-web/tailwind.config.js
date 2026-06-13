/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',

        surface: {
          DEFAULT: 'var(--color-surface)',
          dim: 'var(--color-surface-dim)',
          bright: 'var(--color-surface-bright)',
          variant: 'var(--color-surface-variant)',
          container: 'var(--color-surface-container)',
          'container-lowest': 'var(--color-surface-container-lowest)',
          'container-low': 'var(--color-surface-container-low)',
          'container-high': 'var(--color-surface-container-high)',
          'container-highest': 'var(--color-surface-container-highest)',
        },

        primary: {
          DEFAULT: 'var(--color-primary)',
          container: 'var(--color-primary-container)',
          inverse: 'var(--color-inverse-primary)',
          fixed: 'var(--color-primary-fixed)',
          'fixed-dim': 'var(--color-primary-fixed-dim)',
        },

        secondary: {
          DEFAULT: 'var(--color-secondary)',
          container: 'var(--color-secondary-container)',
          fixed: 'var(--color-secondary-fixed)',
          'fixed-dim': 'var(--color-secondary-fixed-dim)',
        },

        tertiary: {
          DEFAULT: 'var(--color-tertiary)',
          container: 'var(--color-tertiary-container)',
          fixed: 'var(--color-tertiary-fixed)',
          'fixed-dim': 'var(--color-tertiary-fixed-dim)',
        },

        error: {
          DEFAULT: 'var(--color-error)',
          container: 'var(--color-error-container)',
        },

        outline: {
          DEFAULT: 'var(--color-outline)',
          variant: 'var(--color-outline-variant)',
        },

        content: {
          DEFAULT: 'var(--color-on-surface)',
          muted: 'var(--color-on-surface-variant)',
          inverse: 'var(--color-inverse-on-surface)',
        },

        // Stitch-compatible color aliases
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'on-background': 'var(--color-on-background)',
        'on-primary': 'var(--color-on-primary)',
        'on-primary-container': 'var(--color-on-primary-container)',
        'on-primary-fixed': 'var(--color-on-primary-fixed)',
        'on-primary-fixed-variant': 'var(--color-on-primary-fixed-variant)',
        'on-secondary': 'var(--color-on-secondary)',
        'on-secondary-container': 'var(--color-on-secondary-container)',
        'on-secondary-fixed': 'var(--color-on-secondary-fixed)',
        'on-secondary-fixed-variant': 'var(--color-on-secondary-fixed-variant)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',
        'on-tertiary-fixed': 'var(--color-on-tertiary-fixed)',
        'on-tertiary-fixed-variant': 'var(--color-on-tertiary-fixed-variant)',
        'on-error': 'var(--color-on-error)',
        'on-error-container': 'var(--color-on-error-container)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        'surface-tint': 'var(--color-surface-tint)',
      },

      fontFamily: {
        heading: ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],

        // Stitch-compatible font aliases
        'display-lg': ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        'headline-md': ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        'headline-sm': ['IBM Plex Sans', 'Inter', 'system-ui', 'sans-serif'],
        'body-lg': ['Inter', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'body-sm': ['Inter', 'system-ui', 'sans-serif'],
        'data-mono': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        'label-caps': ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg': [
          'var(--text-display-lg-size)',
          {
            lineHeight: 'var(--text-display-lg-line-height)',
            letterSpacing: 'var(--text-display-lg-letter-spacing)',
            fontWeight: 'var(--text-display-lg-weight)',
          },
        ],
        'headline-md': [
          'var(--text-headline-md-size)',
          {
            lineHeight: 'var(--text-headline-md-line-height)',
            fontWeight: 'var(--text-headline-md-weight)',
          },
        ],
        'headline-sm': [
          'var(--text-headline-sm-size)',
          {
            lineHeight: 'var(--text-headline-sm-line-height)',
            fontWeight: 'var(--text-headline-sm-weight)',
          },
        ],
        'body-lg': [
          'var(--text-body-lg-size)',
          {
            lineHeight: 'var(--text-body-lg-line-height)',
          },
        ],
        'body-md': [
          'var(--text-body-md-size)',
          {
            lineHeight: 'var(--text-body-md-line-height)',
          },
        ],
        'body-sm': [
          'var(--text-body-sm-size)',
          {
            lineHeight: 'var(--text-body-sm-line-height)',
          },
        ],
        'data-mono': [
          'var(--text-data-mono-size)',
          {
            lineHeight: 'var(--text-data-mono-line-height)',
            letterSpacing: 'var(--text-data-mono-letter-spacing)',
            fontWeight: 'var(--text-data-mono-weight)',
          },
        ],
        'label-caps': [
          'var(--text-label-caps-size)',
          {
            lineHeight: 'var(--text-label-caps-line-height)',
            letterSpacing: 'var(--text-label-caps-letter-spacing)',
            fontWeight: 'var(--text-label-caps-weight)',
          },
        ],
      },

      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-default)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      spacing: {
        unit: 'var(--spacing-unit)',
        'density-compact': 'var(--spacing-density-compact)',
        'density-comfortable': 'var(--spacing-density-comfortable)',
        gutter: 'var(--spacing-gutter)',
        'container-margin': 'var(--spacing-container-margin)',
      },

      maxWidth: {
        workspace: '1200px',
      },
    },
  },
  plugins: [],
}