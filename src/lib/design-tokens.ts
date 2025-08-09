/**
 * 🎨 Modern Admin UI Design Tokens
 * Centralized design system for consistent styling across all components
 */

export const designTokens = {
  // Color System
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    }
  },

  // Spacing System
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border Radius System
  borderRadius: {
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadow System
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Animation System
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    // CSS-compatible easing (for CSS transitions)
    easingCSS: {
      in: 'cubic-bezier(0.4, 0.0, 1, 1)',
      out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    // Framer Motion-compatible easing (array format)
    easing: {
      in: [0.4, 0.0, 1, 1] as const,
      out: [0.0, 0.0, 0.2, 1] as const,
      inOut: [0.4, 0.0, 0.2, 1] as const,
      bounce: [0.68, -0.55, 0.265, 1.55] as const,
      elastic: [0.25, 0.46, 0.45, 0.94] as const,
    }
  },

  // Wallet Pass Dimensions (Based on Apple Wallet specifications)
  wallet: {
    pass: {
      width: '340px',
      height: '220px',
      borderRadius: '24px',
    },
    shadows: {
      card: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      device: '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)',
    }
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
} as const

// Utility function to get design token values
export const getToken = (path: string): unknown => {
  // Safe reduce with any to support dynamic access paths
  return path.split('.').reduce((obj: any, key) => (obj ? obj[key] : undefined), designTokens as any)
}

// Theme variants for different modes
export const themeVariants = {
  light: {
    background: designTokens.colors.neutral[0],
    surface: designTokens.colors.neutral[50],
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[600],
      muted: designTokens.colors.neutral[400],
    }
  },
  dark: {
    background: designTokens.colors.neutral[950],
    surface: designTokens.colors.neutral[900],
    text: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[300],
      muted: designTokens.colors.neutral[500],
    }
  }
} as const

// Modern component styles using design tokens
export const modernStyles = {
  button: {
    primary: `
      px-4 py-2 rounded-xl font-medium transition-all duration-200 
      bg-gradient-to-r from-blue-500 to-blue-600 text-white 
      hover:from-blue-600 hover:to-blue-700 
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    secondary: `
      px-4 py-2 rounded-xl font-medium transition-all duration-200 
      bg-gray-100 text-gray-700 hover:bg-gray-200 
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
    `,
    outline: `
      px-4 py-2 rounded-xl font-medium transition-all duration-200 
      border border-gray-300 text-gray-700 hover:bg-gray-50 
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
    `
  },
  card: {
    elevated: `
      bg-white rounded-2xl shadow-lg border border-gray-200 
      hover:shadow-xl transition-shadow duration-300
    `,
    flat: `
      bg-white rounded-xl border border-gray-200
    `
  }
} as const