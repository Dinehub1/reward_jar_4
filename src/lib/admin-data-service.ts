// Centralized Admin Data Service
// This service eliminates redundant API calls and provides caching

// Extend globalThis interface to include our cache
declare global {
  var __adminDataCache: Map<string, { data: any, timestamp: number }> | undefined
}

interface AdminStats {
  totalBusinesses: number
  totalCustomers: number
  totalCards: number
  totalStampCards: number
  totalMembershipCards: number
  flaggedBusinesses: number
  recentActivity: number
}

interface Business {
  id: string
  name: string
  contact_email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  status: string
  is_flagged?: boolean
  created_at: string
  updated_at?: string
  total_cards: number
  active_cards: number
}

interface Customer {
  id: string
  name: string
  email: string
  created_at: string
  user_id: string
  customer_cards: Array<any>
  _count?: {
    customer_cards: number
    rewards: number
    session_usage: number
  }
  _flags?: {
    hasRecentErrors: boolean
    hasAbnormalActivity: boolean
    isNewCustomer: boolean
  }
}

interface AdminData {
  stats: AdminStats
  businesses: Business[]
  customers: Customer[]
}

// Global cache for admin data - using globalThis to persist across requests
const getGlobalCache = () => {
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__adminDataCache) {
      globalThis.__adminDataCache = new Map<string, { data: any, timestamp: number }>()
    }
    return globalThis.__adminDataCache
  }
  return new Map<string, { data: any, timestamp: number }>()
}

const CACHE_DURATION = 30000 // 30 seconds

/**
 * Unified data fetching function with intelligent caching
 * This prevents multiple simultaneous API calls to the same endpoints
 */
async function fetchAdminData(): Promise<AdminData> {
  const adminDataCache = getGlobalCache()
  const cacheKey = 'admin-data-unified'
  const cached = adminDataCache.get(cacheKey)
  
  // Return cached data if it's still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  
  try {
    // Use relative URLs for server-side requests
    const baseUrl = typeof window === 'undefined' ? 'http://localhost:3000' : ''
    
    // ✅ MIGRATED: Use single dashboard-unified endpoint for consistency
    // Use shared fetch util
    const { fetchJsonWithTimeout } = await import('@/lib/admin-fetch')
    const [statsData, allData] = await Promise.all([
      fetchJsonWithTimeout<any>(`${baseUrl}/api/admin/dashboard-unified`, {
        timeoutMs: 15000
      }),
      fetchJsonWithTimeout<any>(`${baseUrl}/api/admin/dashboard-unified`, {
        timeoutMs: 15000
      })
    ])
    
    // Process customer data to match expected interface
    const processedCustomers = (allData.data?.customers || []).map((customer: any) => ({
      ...customer,
      customer_cards: customer.customer_cards || [],
      _count: {
        customer_cards: customer.total_cards || 0,
        rewards: 0,
        session_usage: customer.total_stamps || 0
      },
      _flags: {
        hasRecentErrors: false,
        hasAbnormalActivity: (customer.total_stamps || 0) > 20,
        isNewCustomer: (Date.now() - new Date(customer.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000)
      }
    }))
    
    const result: AdminData = {
      stats: statsData.metrics || {
        totalBusinesses: 0,
        totalCustomers: 0,
        totalCards: 0,
        totalStampCards: 0,
        totalMembershipCards: 0,
        flaggedBusinesses: 0,
        recentActivity: 0
      },
      businesses: allData.data?.businesses || [],
      customers: processedCustomers
    }
    
    // Cache the result with timestamp
    adminDataCache.set(cacheKey, { data: result, timestamp: Date.now() })
    
      stats: result.stats,
      businessCount: result.businesses.length,
      customerCount: result.customers.length,
      cacheExpiry: new Date(Date.now() + CACHE_DURATION).toLocaleTimeString()
    })
    
    return result
  } catch (error) {
    
    // Return safe defaults to prevent crashes
    return {
      stats: {
        totalBusinesses: 0,
        totalCustomers: 0,
        totalCards: 0,
        totalStampCards: 0,
        totalMembershipCards: 0,
        flaggedBusinesses: 0,
        recentActivity: 0
      },
      businesses: [],
      customers: []
    }
  }
}

// Public API functions that admin pages should use
export async function getAdminStats(): Promise<AdminStats> {
  const { stats } = await fetchAdminData()
  return stats
}

export async function getBusinesses(): Promise<Business[]> {
  const { businesses } = await fetchAdminData()
  return businesses
}

export async function getCustomers(): Promise<Customer[]> {
  const { customers } = await fetchAdminData()
  return customers
}

export async function getAllAdminData(): Promise<AdminData> {
  return await fetchAdminData()
}

// Clear cache function for when fresh data is needed
export function clearAdminCache(): void {
  const adminDataCache = getGlobalCache()
  adminDataCache.clear()
}

// Types export for use in components
export type { AdminStats, Business, Customer, AdminData } 