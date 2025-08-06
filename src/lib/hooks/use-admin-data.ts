/**
 * SWR Hooks for Admin Data Fetching
 * 
 * Centralized data fetching hooks that use API routes instead of direct Supabase calls.
 * These hooks provide caching, revalidation, and error handling out of the box.
 */

import useSWR from 'swr'
import { adminNotifications } from '@/lib/admin-events'
import type { 
  AdminStats, 
  Business, 
  BusinessWithDetails,
  Customer,
  StampCard,
  MembershipCard,
  CustomerCard,
  ApiResponse,
  PaginatedResponse
} from '@/lib/supabase/types'

// ✅ ENHANCED: Standardized SWR Configuration with admin notifications
const ADMIN_SWR_CONFIG = {
  refreshInterval: 30000, // 30 seconds - consistent across all hooks
  revalidateOnFocus: true, // Always revalidate on focus for fresh data
  revalidateOnReconnect: true, // Revalidate when connection restored
  dedupingInterval: 10000, // 10 seconds deduping to prevent excessive requests
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error: Error, key: string) => {
    console.warn('❌ Admin SWR Error:', error.message)
    
    // ✅ ADMIN NOTIFICATION: Notify admins of persistent API errors
    if (error.message.includes('500') || error.message.includes('timeout')) {
      adminNotifications.systemError(
        'Admin API Error',
        `Persistent error on ${key}: ${error.message}`,
        { endpoint: key, error: error.message }
      )
    }
  }
}

// ✅ ENHANCED: Generic fetcher with retry logic and admin notifications
const fetcher = async (url: string) => {
  console.log(`🔍 SWR Fetching: ${url}`)
  
  // Add timeout for slow endpoints
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'include'
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      // Try to parse JSON error response first
      try {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Failed to fetch data`
        
        // ✅ ADMIN NOTIFICATION: Notify about API failures
        if (response.status >= 500) {
          adminNotifications.systemError(
            'Admin API Failure',
            `${url} returned ${response.status}: ${errorMessage}`,
            { url, status: response.status, error: errorMessage }
          )
        }
        
        throw new Error(errorMessage)
      } catch (parseError) {
        // If JSON parsing fails, use status text
        const errorMessage = `HTTP ${response.status}: ${response.statusText || 'Failed to fetch data'}`
        throw new Error(errorMessage)
      }
    }
    
    const data = await response.json()
    console.log(`✅ SWR Data fetched from ${url}:`, data.success ? 'Success' : 'Failed')
    return data
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = `Request timeout: ${url} took longer than 15 seconds`
      adminNotifications.systemError(
        'Admin API Timeout',
        timeoutError,
        { url, timeout: 15000 }
      )
      throw new Error(timeoutError)
    }
    
    throw error
  }
}

// Admin Dashboard Hooks

/**
 * Fetches admin dashboard statistics
 * @returns SWR hook with admin stats data
 */
// Define the unified dashboard data interface
interface UnifiedDashboardData {
  stats: {
    totalBusinesses: number
    totalCustomers: number
    totalCards: number
    totalStampCards: number
    totalMembershipCards: number
    activeCards: number
    flaggedBusinesses: number
    recentActivity: number
    newThisWeek: number
  }
  businesses: Business[]
  customers: any[]
  cards: {
    stampCards: any[]
    membershipCards: any[]
    customerCards: any[]
  }
  recentActivity: any[]
  systemHealth: {
    database: string
    walletQueue: number
    lastSync: string
  }
}

export function useAdminStats() {
  return useSWR<ApiResponse<UnifiedDashboardData>>('/api/admin/dashboard-unified', fetcher, ADMIN_SWR_CONFIG)
}

/**
 * Fetches all businesses for admin panel
 * @returns SWR hook with businesses data
 */
export function useAdminBusinesses() {
  return useSWR<ApiResponse<Business[]>>('/api/admin/dashboard-unified?section=businesses', fetcher, ADMIN_SWR_CONFIG)
}

/**
 * Fetches detailed business data with relationships
 * @returns SWR hook with detailed businesses data
 */
export function useAdminBusinessesDetailed() {
  return useSWR<ApiResponse<BusinessWithDetails[]>>('/api/admin/businesses?detailed=true', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 5000
  })
}

/**
 * Fetches all customers for admin panel
 * @returns SWR hook with customers data
 */
export function useAdminCustomers() {
  return useSWR<ApiResponse<Customer[]>>('/api/admin/dashboard-unified?section=customers', fetcher, ADMIN_SWR_CONFIG)
}

/**
 * Fetches all stamp cards for admin panel
 * @returns SWR hook with stamp cards data
 */
export function useAdminStampCards() {
  return useSWR<ApiResponse<StampCard[]>>('/api/admin/cards?type=stamp', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true
  })
}

/**
 * Fetches all membership cards for admin panel
 * @returns SWR hook with membership cards data
 */
export function useAdminMembershipCards() {
  return useSWR<ApiResponse<MembershipCard[]>>('/api/admin/cards?type=membership', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true
  })
}

/**
 * Fetches all customer cards for admin panel
 * @returns SWR hook with customer cards data
 */
export function useAdminCustomerCards() {
  return useSWR<ApiResponse<CustomerCard[]>>('/api/admin/customer-cards', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true
  })
}

/**
 * Fetches comprehensive admin panel data
 * @returns SWR hook with all admin panel data
 * @deprecated Use useAdminStats() instead - migrated to dashboard-unified API
 */
export function useAdminPanelData() {
  // ✅ MIGRATED: Now uses dashboard-unified endpoint for consistency
  return useSWR<ApiResponse<{
    stats: AdminStats
    businesses: Business[]
    customers: Customer[]
    stampCards: StampCard[]
    membershipCards: MembershipCard[]
    customerCards: CustomerCard[]
  }>>('/api/admin/dashboard-unified', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  })
}

// Specific Business Hooks

/**
 * Fetches a specific business by ID
 * @param businessId - Business ID to fetch
 * @returns SWR hook with business data
 */
export function useAdminBusiness(businessId: string | null) {
  return useSWR<ApiResponse<BusinessWithDetails>>(
    businessId ? `/api/admin/businesses/${businessId}` : null,
    fetcher,
    {
      revalidateOnFocus: true
    }
  )
}

/**
 * Fetches cards for a specific business
 * @param businessId - Business ID to fetch cards for
 * @returns SWR hook with business cards data
 */
export function useAdminBusinessCards(businessId: string | null) {
  return useSWR<ApiResponse<{
    stampCards: StampCard[]
    membershipCards: MembershipCard[]
  }>>(
    businessId ? `/api/admin/businesses/${businessId}/cards` : null,
    fetcher,
    {
      revalidateOnFocus: true
    }
  )
}

// Analytics Hooks

/**
 * Fetches admin analytics data
 * @param type - Type of analytics to fetch
 * @returns SWR hook with analytics data
 */
export function useAdminAnalytics(type: 'overview' | 'businesses' | 'customers' | 'cards' = 'overview') {
  return useSWR<ApiResponse<any>>(`/api/admin/analytics?type=${type}`, fetcher, {
    refreshInterval: 120000, // Refresh every 2 minutes
    revalidateOnFocus: true
  })
}

// Utility Hooks

/**
 * Hook for triggering data revalidation across all admin hooks
 * @returns Function to trigger revalidation
 */
export function useAdminDataRevalidation() {
  const { mutate: revalidateStats } = useAdminStats()
  const { mutate: revalidateBusinesses } = useAdminBusinesses()
  const { mutate: revalidateCustomers } = useAdminCustomers()
  const { mutate: revalidateStampCards } = useAdminStampCards()
  const { mutate: revalidateMembershipCards } = useAdminMembershipCards()
  const { mutate: revalidateCustomerCards } = useAdminCustomerCards()

  return () => {
    revalidateStats()
    revalidateBusinesses()
    revalidateCustomers()
    revalidateStampCards()
    revalidateMembershipCards()
    revalidateCustomerCards()
  }
}

/**
 * Custom hook for handling admin data mutations
 * @param endpoint - API endpoint to mutate
 * @returns Mutation function with error handling
 */
export function useAdminMutation(endpoint: string) {
  return async (data: any, method: 'POST' | 'PUT' | 'DELETE' = 'POST') => {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Mutation failed')
      }

      return response.json()
    } catch (error) {
      console.error('Admin mutation error:', error)
      throw error
    }
  }
}

// Paginated Data Hooks

/**
 * Fetches paginated businesses data
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @returns SWR hook with paginated businesses data
 */
export function useAdminBusinessesPaginated(page: number = 1, limit: number = 20) {
  return useSWR<PaginatedResponse<Business>>(
    `/api/admin/businesses?page=${page}&limit=${limit}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true
    }
  )
}

/**
 * Fetches paginated customers data
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @returns SWR hook with paginated customers data
 */
export function useAdminCustomersPaginated(page: number = 1, limit: number = 20) {
  return useSWR<PaginatedResponse<Customer>>(
    `/api/admin/customers?page=${page}&limit=${limit}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true
    }
  )
}

// Aliases for backward compatibility with different return structure
export function useBusinesses() {
  const { data: response, error, isLoading, mutate } = useAdminBusinesses()
  return {
    data: response?.data || [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load businesses') : null,
    refetch: mutate
  }
}

export function useCustomers() {
  const { data: response, error, isLoading, mutate } = useAdminCustomers()
  return {
    data: response?.data || [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load customers') : null,
    refetch: mutate
  }
}

// Wrapper for useAdminStats to match expected interface
export function useAdminStatsCompat() {
  const { data: response, error, isLoading, mutate } = useAdminStats()
  return {
    data: response?.data || null,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load stats') : null,
    refetch: mutate
  }
}

export default {
  useAdminStats,
  useAdminBusinesses,
  useAdminBusinessesDetailed,
  useAdminCustomers,
  useAdminStampCards,
  useAdminMembershipCards,
  useAdminCustomerCards,
  useAdminPanelData,
  useAdminBusiness,
  useAdminBusinessCards,
  useAdminAnalytics,
  useAdminDataRevalidation,
  useAdminMutation,
  useAdminBusinessesPaginated,
  useAdminCustomersPaginated,
  // Aliases
  useBusinesses,
  useCustomers,
  useAdminStatsCompat
}