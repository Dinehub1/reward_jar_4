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

  // Role-Based Color Palettes
  roles: {
    admin: {
      primary: '#2563eb',     // blue-600
      secondary: '#1e40af',   // blue-700  
      accent: '#6366f1',      // indigo-500
      surface: '#f8fafc',     // slate-50
      muted: '#64748b',       // slate-500
      success: '#059669',     // emerald-600
      warning: '#d97706',     // amber-600
      error: '#dc2626',       // red-600
    },
    business: {
      primary: '#059669',     // emerald-600
      secondary: '#047857',   // emerald-700
      accent: '#10b981',      // emerald-500
      surface: '#ecfdf5',     // emerald-50
      muted: '#6b7280',       // gray-500
      success: '#059669',     // emerald-600
      warning: '#d97706',     // amber-600
      error: '#dc2626',       // red-600
    },
    customer: {
      primary: '#9333ea',     // purple-600
      secondary: '#7c3aed',   // purple-700
      accent: '#a855f7',      // purple-500
      surface: '#faf5ff',     // purple-50
      muted: '#6b7280',       // gray-500
      success: '#059669',     // emerald-600
      warning: '#d97706',     // amber-600
      error: '#dc2626',       // red-600
    },
    public: {
      primary: '#0f172a',     // slate-900
      secondary: '#1e293b',   // slate-800
      accent: '#3b82f6',      // blue-500
      surface: '#ffffff',     // white
      muted: '#64748b',       // slate-500
      success: '#059669',     // emerald-600
      warning: '#d97706',     // amber-600
      error: '#dc2626',       // red-600
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

  // Breakpoints (Mobile-First)
  breakpoints: {
    sm: '640px',    // Small tablets
    md: '768px',    // Tablets
    lg: '1024px',   // Laptops
    xl: '1280px',   // Desktop
    '2xl': '1536px', // Large desktop
  },

  // Mobile-First Interaction Tokens
  mobile: {
    touchTarget: {
      min: '44px',    // Minimum touch target size
      comfortable: '48px', // Comfortable touch size
      large: '56px',  // Large touch target
    },
    gesture: {
      swipeThreshold: '50px',
      tapTimeout: '300ms',
      longPressTimeout: '500ms',
    },
    viewport: {
      safePadding: '16px',
      headerHeight: '64px',
      bottomNavHeight: '80px',
      tabBarHeight: '48px',
    }
  },

  // Component Design Patterns
  components: {
    card: {
      mobile: {
        padding: '16px',
        borderRadius: '12px',
        gap: '12px',
      },
      desktop: {
        padding: '24px',
        borderRadius: '16px',
        gap: '16px',
      }
    },
    button: {
      mobile: {
        height: '48px',
        fontSize: '16px',
        padding: '12px 20px',
        borderRadius: '12px',
      },
      desktop: {
        height: '40px',
        fontSize: '14px',
        padding: '8px 16px',
        borderRadius: '8px',
      }
    },
    input: {
      mobile: {
        height: '48px',
        fontSize: '16px', // Prevents zoom on iOS
        padding: '12px 16px',
        borderRadius: '12px',
      },
      desktop: {
        height: '40px',
        fontSize: '14px',
        padding: '8px 12px',
        borderRadius: '8px',
      }
    }
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

// Role-based theme utilities
export const getRoleTheme = (role: 'admin' | 'business' | 'customer' | 'public') => {
  return designTokens.roles[role]
}

// Modern component styles using design tokens
export const modernStyles = {
  button: {
    primary: `
      px-4 py-2 rounded-xl font-medium transition-all duration-200 
      bg-gradient-to-r from-blue-500 to-blue-600 text-white 
      hover:from-blue-600 hover:to-blue-700 
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      min-h-[44px] touch-manipulation
    `,
    secondary: `
      px-4 py-2 rounded-xl font-medium transition-all duration-200 
      bg-gray-100 text-gray-700 hover:bg-gray-200 
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
      min-h-[44px] touch-manipulation
    `,
    outline: `
      px-4 py-2 rounded-xl font-medium transition-all duration-200 
      border border-gray-300 text-gray-700 hover:bg-gray-50 
      focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
      min-h-[44px] touch-manipulation
    `
  },
  card: {
    elevated: `
      bg-white rounded-2xl shadow-lg border border-gray-200 
      hover:shadow-xl transition-shadow duration-300
      p-4 md:p-6
    `,
    flat: `
      bg-white rounded-xl border border-gray-200
      p-4 md:p-6
    `,
    interactive: `
      bg-white rounded-2xl shadow-md border border-gray-200 
      hover:shadow-lg active:scale-[0.98] transition-all duration-200
      cursor-pointer p-4 md:p-6 touch-manipulation
    `
  },
  layout: {
    container: `
      max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
    `,
    section: `
      space-y-6 md:space-y-8
    `,
    grid: {
      responsive: `
        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6
      `,
      metrics: `
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6
      `
    }
  },
  mobile: {
    bottomNav: `
      fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
      h-20 flex items-center justify-around px-4 z-50 lg:hidden
    `,
    header: `
      sticky top-0 bg-white border-b border-gray-200 z-40
      h-16 flex items-center justify-between px-4
    `,
    content: `
      pb-20 lg:pb-0 min-h-screen bg-gray-50
    `
  }
} as const

// Role-specific component styles
export const roleStyles = {
  admin: {
    header: `
      bg-gradient-to-r from-blue-600 to-indigo-600 text-white
      border-b border-blue-700
    `,
    sidebar: `
      bg-slate-900 text-slate-100 border-r border-slate-800
    `,
    card: `
      bg-white border border-slate-200 rounded-xl shadow-sm
      hover:shadow-md transition-shadow duration-200
    `,
    button: {
      primary: `
        bg-blue-600 hover:bg-blue-700 text-white
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `,
      secondary: `
        bg-slate-100 hover:bg-slate-200 text-slate-700
        focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
      `
    }
  },
  business: {
    header: `
      bg-gradient-to-r from-emerald-600 to-green-600 text-white
      border-b border-emerald-700
    `,
    sidebar: `
      bg-emerald-50 text-emerald-900 border-r border-emerald-200
    `,
    card: `
      bg-white border border-emerald-200 rounded-xl shadow-sm
      hover:shadow-md transition-shadow duration-200
    `,
    button: {
      primary: `
        bg-emerald-600 hover:bg-emerald-700 text-white
        focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
      `,
      secondary: `
        bg-emerald-100 hover:bg-emerald-200 text-emerald-700
        focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
      `
    }
  },
  customer: {
    header: `
      bg-gradient-to-r from-purple-600 to-violet-600 text-white
      border-b border-purple-700
    `,
    card: `
      bg-white border border-purple-200 rounded-xl shadow-sm
      hover:shadow-md transition-shadow duration-200
    `,
    button: {
      primary: `
        bg-purple-600 hover:bg-purple-700 text-white
        focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
      `,
      secondary: `
        bg-purple-100 hover:bg-purple-200 text-purple-700
        focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
      `
    }
  }
} as const