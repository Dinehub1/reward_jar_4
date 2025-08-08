/**
 * Unified Card Design Theme System
 * Provides consistent styling across all card previews (Apple Wallet, Google Wallet, PWA)
 * for both stamp cards and membership cards
 */

import { WALLET_DIMENSIONS } from './wallet-dimensions'

export interface CardDesignTheme {
  // Typography
  typography: {
    businessName: {
      fontSize: string
      fontWeight: string
      opacity: number
    }
    cardTitle: {
      fontSize: string
      fontWeight: string
      lineHeight: string
    }
    progressText: {
      fontSize: string
      fontWeight: string
    }
    rewardText: {
      fontSize: string
      opacity: number
    }
    subtleText: {
      fontSize: string
      opacity: number
    }
  }
  
  // Layout & Spacing
  layout: {
    padding: {
      section: string
      content: string
    }
    spacing: {
      sectionGap: string
      elementGap: string
      smallGap: string
    }
    heights: {
      logoSection: string
      progressBar: string
    }
  }
  
  // Visual Elements
  visual: {
    borderRadius: {
      card: string
      element: string
      progressBar: string
    }
    shadows: {
      card: string
      element: string
    }
    borders: {
      section: string
      element: string
    }
    opacity: {
      overlay: number
      divider: number
      subtle: number
    }
  }
  
  // Platform-specific styling
  platforms: {
    apple: {
      backgroundColor: string
      textColor: string
      logoSize: string
      qrSize: string
    }
    google: {
      backgroundColor: string
      textColor: string
      logoSize: string
      qrSize: string
    }
    pwa: {
      backgroundColor: string
      textColor: string
      logoSize: string
      qrSize: string
    }
  }
  
  // Card type variations
  cardTypes: {
    stamp: {
      defaultGradient: string[]
      progressBarStyle: 'dots' | 'bar'
      showStampGrid: boolean
    }
    membership: {
      defaultGradient: string[]
      progressBarStyle: 'bar' | 'countdown'
      showSessionCounter: boolean
    }
  }
}

// Main design theme following Apple Design Guidelines and Material Design
export const CARD_DESIGN_THEME: CardDesignTheme = {
  typography: {
    businessName: {
      fontSize: '14px',
      fontWeight: '500',
      opacity: 0.9
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      lineHeight: '1.2'
    },
    progressText: {
      fontSize: '24px',
      fontWeight: '700'
    },
    rewardText: {
      fontSize: '14px',
      opacity: 0.9
    },
    subtleText: {
      fontSize: '12px',
      opacity: 0.7
    }
  },
  
  layout: {
    padding: {
      section: '16px',
      content: '12px'
    },
    spacing: {
      sectionGap: '12px',
      elementGap: '8px',
      smallGap: '4px'
    },
    heights: {
      logoSection: '32px',
      progressBar: '8px'
    }
  },
  
  visual: {
    borderRadius: {
      card: '16px',
      element: '8px',
      progressBar: '4px'
    },
    shadows: {
      card: '0 8px 32px rgba(0, 0, 0, 0.12)',
      element: '0 2px 8px rgba(0, 0, 0, 0.08)'
    },
    borders: {
      section: '1px solid rgba(255, 255, 255, 0.2)',
      element: '1px solid rgba(255, 255, 255, 0.1)'
    },
    opacity: {
      overlay: 0.1,
      divider: 0.2,
      subtle: 0.7
    }
  },
  
  platforms: {
    apple: {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      textColor: '#FFFFFF',
      logoSize: '32px',
      qrSize: '40px'
    },
    google: {
      backgroundColor: '#FFFFFF',
      textColor: '#202124',
      logoSize: '32px',
      qrSize: '40px'
    },
    pwa: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#FFFFFF',
      logoSize: '32px',
      qrSize: '48px'
    }
  },
  
  cardTypes: {
    stamp: {
      defaultGradient: ['#8B5CF6', '#A855F7'],
      progressBarStyle: 'bar',
      showStampGrid: true
    },
    membership: {
      defaultGradient: ['#3B82F6', '#1D4ED8'],
      progressBarStyle: 'countdown',
      showSessionCounter: true
    }
  }
}

// Color palette for cards
export const CARD_COLORS = {
  primary: {
    purple: '#8B5CF6',
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F59E0B',
    red: '#EF4444',
    pink: '#EC4899'
  },
  gradients: {
    purple: ['#8B5CF6', '#A855F7'],
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#059669'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
    pink: ['#EC4899', '#DB2777'],
    sunset: ['#FF7B7B', '#FFA726'],
    ocean: ['#4FC3F7', '#29B6F6'],
    forest: ['#66BB6A', '#43A047'],
    royal: ['#7986CB', '#5C6BC0']
  }
}

// Responsive breakpoints for preview scaling
export const PREVIEW_BREAKPOINTS = {
  mobile: {
    maxWidth: '480px',
    scale: 0.7
  },
  tablet: {
    maxWidth: '768px',
    scale: 0.85
  },
  desktop: {
    maxWidth: '1024px',
    scale: 1.0
  }
}

// Utility functions for theme application
export const getCardGradient = (color: string, cardType: 'stamp' | 'membership' = 'stamp') => {
  const gradients = CARD_COLORS.gradients
  const fallback = CARD_DESIGN_THEME.cardTypes[cardType].defaultGradient
  
  // Find matching gradient or use solid color
  const gradientKey = Object.keys(gradients).find(key => 
    gradients[key as keyof typeof gradients][0].toLowerCase() === color.toLowerCase()
  ) as keyof typeof gradients
  
  return gradientKey ? gradients[gradientKey] : [color, color]
}

export const getResponsiveScale = (screenWidth: number) => {
  if (screenWidth <= parseInt(PREVIEW_BREAKPOINTS.mobile.maxWidth)) {
    return PREVIEW_BREAKPOINTS.mobile.scale
  }
  if (screenWidth <= parseInt(PREVIEW_BREAKPOINTS.tablet.maxWidth)) {
    return PREVIEW_BREAKPOINTS.tablet.scale
  }
  return PREVIEW_BREAKPOINTS.desktop.scale
}

// Platform-specific dimension helpers
export const getPlatformDimensions = (platform: 'apple' | 'google' | 'pwa') => {
  return WALLET_DIMENSIONS[platform]
}

// Theme utilities for consistent styling
export const applyCardTheme = (platform: 'apple' | 'google' | 'pwa', cardType: 'stamp' | 'membership' = 'stamp') => {
  const theme = CARD_DESIGN_THEME
  const platformTheme = theme.platforms[platform]
  const cardTypeTheme = theme.cardTypes[cardType]
  
  return {
    ...theme,
    platform: platformTheme,
    cardType: cardTypeTheme,
    dimensions: getPlatformDimensions(platform)
  }
}

export default CARD_DESIGN_THEME