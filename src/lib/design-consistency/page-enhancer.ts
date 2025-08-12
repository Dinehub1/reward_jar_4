/**
 * 🎨 DESIGN CONSISTENCY PAGE ENHANCER
 * 
 * Systematic approach to apply design tokens and consistency across all 54 pages
 * Phase 4 Tier 3 implementation for RewardJar 4.0
 */

'use client'

import React from 'react'
import { modernStyles, roleStyles, getRoleTheme } from '@/lib/design-tokens'

export type PageRole = 'admin' | 'business' | 'customer' | 'public'
export type PageType = 'dashboard' | 'management' | 'form' | 'list' | 'detail' | 'auth' | 'onboarding'

export interface PageEnhancement {
  role: PageRole
  type: PageType
  containerClass: string
  headerClass: string
  cardClass: string
  buttonClass: string
  loadingClass: string
  errorClass: string
}

/**
 * Get design enhancement configuration for any page
 */
export function getPageEnhancement(role: PageRole, type: PageType): PageEnhancement {
  const theme = getRoleTheme(role)
  
  return {
    role,
    type,
    containerClass: modernStyles.layout.container,
    headerClass: roleStyles[role]?.header || 'bg-gradient-to-r from-gray-600 to-gray-700',
    cardClass: roleStyles[role]?.card || modernStyles.card.default,
    buttonClass: roleStyles[role]?.button?.primary || 'bg-blue-600 hover:bg-blue-700 text-white',
    loadingClass: `min-h-screen ${theme.surface} flex items-center justify-center`,
    errorClass: `min-h-screen ${theme.surface} flex items-center justify-center`
  }
}

/**
 * Standard error boundary fallback for any page
 */
export function createErrorFallback(role: PageRole, pageName: string) {
  const enhancement = getPageEnhancement(role, 'dashboard')
  
  return React.createElement('div', { className: enhancement.errorClass },
    React.createElement('div', { className: 'text-center' },
      React.createElement('h2', { className: 'text-xl font-semibold text-gray-900 mb-2' }, `${pageName} Unavailable`),
      React.createElement('p', { className: 'text-gray-600 mb-4' }, `Unable to load the ${pageName.toLowerCase()}`),
      React.createElement('button', { 
        onClick: () => window.location.reload(),
        className: `${enhancement.buttonClass} px-4 py-2 rounded-lg font-medium`
      }, 'Reload Page')
    )
  )
}

/**
 * Standard loading state for any page
 */
export function createLoadingState(role: PageRole, pageName: string) {
  const enhancement = getPageEnhancement(role, 'dashboard')
  
  return React.createElement('div', { className: enhancement.loadingClass },
    React.createElement('div', { className: 'text-center' },
      React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-current mx-auto mb-4' }),
      React.createElement('p', { className: 'text-gray-600' }, `Loading ${pageName.toLowerCase()}...`)
    )
  )
}

/**
 * Enhanced page wrapper that applies consistent styling
 */
export function enhancePageWithDesignTokens(
  OriginalComponent: React.ComponentType,
  role: PageRole,
  pageName: string,
  type: PageType = 'dashboard'
) {
  return function EnhancedPage(props: any) {
    const enhancement = getPageEnhancement(role, type)
    
    return React.createElement('div', { className: enhancement.containerClass },
      React.createElement(OriginalComponent, props)
    )
  }
}

/**
 * Systematic page categories for Tier 3 implementation
 */
export const PAGE_CATEGORIES = {
  // Admin Pages (Role 1)
  admin: {
    dashboard: ['/admin'],
    management: [
      '/admin/businesses',
      '/admin/cards', 
      '/admin/customers',
      '/admin/templates'
    ],
    monitoring: [
      '/admin/alerts',
      '/admin/support',
      '/admin/dev-tools'
    ],
    testing: [
      '/admin/test-*',
      '/admin/demo/*',
      '/admin/sandbox'
    ]
  },
  
  // Business Pages (Role 2)
  business: {
    dashboard: ['/business/dashboard'],
    management: [
      '/business/stamp-cards',
      '/business/memberships',
      '/business/profile'
    ],
    analytics: ['/business/analytics'],
    onboarding: [
      '/business/onboarding/cards',
      '/business/onboarding/profile'
    ]
  },
  
  // Customer Pages (Role 3)
  customer: {
    dashboard: ['/customer/dashboard'],
    cards: ['/customer/card/*']
  },
  
  // Public Pages
  public: {
    marketing: ['/'],
    auth: ['/auth/*'],
    onboarding: ['/onboarding/*'],
    info: ['/faq', '/pricing', '/use-cases', '/templates']
  }
} as const

/**
 * Priority order for Tier 3 implementation
 */
export const TIER_3_PRIORITY = [
  // High-traffic admin pages
  { path: '/admin/customers', role: 'admin' as PageRole, type: 'management' as PageType },
  { path: '/admin/templates', role: 'admin' as PageRole, type: 'management' as PageType },
  { path: '/admin/alerts', role: 'admin' as PageRole, type: 'monitoring' as PageType },
  
  // Business management pages
  { path: '/business/memberships', role: 'business' as PageRole, type: 'management' as PageType },
  { path: '/business/onboarding/cards', role: 'business' as PageRole, type: 'onboarding' as PageType },
  { path: '/business/onboarding/profile', role: 'business' as PageRole, type: 'onboarding' as PageType },
  
  // Customer interface
  { path: '/customer/card/*', role: 'customer' as PageRole, type: 'detail' as PageType },
  
  // Public pages
  { path: '/faq', role: 'public' as PageRole, type: 'form' as PageType },
  { path: '/pricing', role: 'public' as PageRole, type: 'form' as PageType },
  { path: '/use-cases', role: 'public' as PageRole, type: 'form' as PageType },
  { path: '/templates', role: 'public' as PageRole, type: 'list' as PageType }
] as const