/**
 * Admin Cache Invalidation System
 * 
 * Provides real-time cache invalidation for admin dashboard data
 * when business activities occur (stamps, sessions, card creation, etc.)
 */

import { mutate } from 'swr'

// Cache keys for all admin data endpoints
export const ADMIN_CACHE_KEYS = {
  UNIFIED_DASHBOARD: '/api/admin/dashboard-unified',
  BUSINESSES: '/api/admin/dashboard-unified?section=businesses',
  CUSTOMERS: '/api/admin/dashboard-unified?section=customers',
  CARDS: '/api/admin/dashboard-unified?section=cards',
  STATS: '/api/admin/dashboard-unified', // ✅ MIGRATED: Consolidated to unified endpoint
  PANEL_DATA: '/api/admin/dashboard-unified' // ✅ MIGRATED: Consolidated to unified endpoint
} as const

/**
 * Invalidates all admin dashboard caches
 * Use this after any business activity that affects admin data
 */
export async function invalidateAdminDashboard() {
  console.log('🔄 Invalidating all admin dashboard caches...')
  
  const invalidationPromises = Object.values(ADMIN_CACHE_KEYS).map(key => 
    mutate(key, undefined, { revalidate: true })
  )
  
  try {
    await Promise.all(invalidationPromises)
    console.log('✅ Admin dashboard caches invalidated successfully')
    
    // Notify unified API of cache invalidation
    await fetch('/api/admin/dashboard-unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cache_invalidation',
        timestamp: new Date().toISOString()
      })
    })
    
  } catch (error) {
    console.error('❌ Failed to invalidate admin caches:', error)
  }
}

/**
 * Invalidates specific section of admin dashboard
 * More efficient for targeted updates
 */
export async function invalidateAdminSection(section: 'businesses' | 'customers' | 'cards' | 'stats') {
  console.log(`🔄 Invalidating admin ${section} cache...`)
  
  const cacheKey = section === 'stats' 
    ? ADMIN_CACHE_KEYS.UNIFIED_DASHBOARD
    : ADMIN_CACHE_KEYS[section.toUpperCase() as keyof typeof ADMIN_CACHE_KEYS]
  
  try {
    await mutate(cacheKey, undefined, { revalidate: true })
    await mutate(ADMIN_CACHE_KEYS.UNIFIED_DASHBOARD, undefined, { revalidate: true })
    console.log(`✅ Admin ${section} cache invalidated`)
  } catch (error) {
    console.error(`❌ Failed to invalidate ${section} cache:`, error)
  }
}

/**
 * Invalidates caches after business activity
 * Call this from business operations that affect admin data
 */
export async function invalidateAfterBusinessActivity(
  activityType: 'stamp_added' | 'session_marked' | 'card_created' | 'customer_registered' | 'business_created',
  metadata?: Record<string, any>
) {
  console.log(`🔄 Invalidating caches after ${activityType}:`, metadata)
  
  // Always invalidate main dashboard
  await invalidateAdminDashboard()
  
  // Activity-specific invalidations
  switch (activityType) {
    case 'stamp_added':
    case 'session_marked':
      // These affect customer cards and recent activity
      await invalidateAdminSection('customers')
      await invalidateAdminSection('cards')
      break
      
    case 'card_created':
      // Affects businesses and cards
      await invalidateAdminSection('businesses')
      await invalidateAdminSection('cards')
      break
      
    case 'customer_registered':
      // Affects customers and stats
      await invalidateAdminSection('customers')
      break
      
    case 'business_created':
      // Affects businesses and stats
      await invalidateAdminSection('businesses')
      break
  }
  
  console.log(`✅ Cache invalidation completed for ${activityType}`)
}

/**
 * Hook for manual cache refresh in admin components
 */
export function useAdminCacheControl() {
  return {
    refreshAll: invalidateAdminDashboard,
    refreshSection: invalidateAdminSection,
    refreshAfterActivity: invalidateAfterBusinessActivity
  }
}