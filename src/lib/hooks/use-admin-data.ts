/**
 * SWR Hooks for Admin Data Fetching
 * 
 * Centralized data fetching hooks that use API routes instead of direct Supabase calls.
 * These hooks provide caching, revalidation, and error handling out of the box.
 */

import useSWR from 'swr'
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

// Generic fetcher for API routes
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to fetch data')
  }
  return response.json()
}

// Admin Dashboard Hooks

/**
 * Fetches admin dashboard statistics
 * @returns SWR hook with admin stats data
 */
export function useAdminStats() {
  return useSWR<ApiResponse<AdminStats>>('/api/admin/dashboard-stats', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes (was 30 seconds!)
    revalidateOnFocus: false, // Disable focus revalidation to prevent excessive calls
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Dedupe requests for 1 minute
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error) => {
      console.warn('Failed to fetch admin stats:', error)
    }
  })
}

/**
 * Fetches all businesses for admin panel
 * @returns SWR hook with businesses data
 */
export function useAdminBusinesses() {
  return useSWR<ApiResponse<Business[]>>('/api/admin/businesses-simple', fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false, // Disable focus revalidation to prevent excessive calls
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Dedupe requests for 1 minute
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error) => {
      console.warn('Failed to fetch businesses:', error)
    }
  })
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
  return useSWR<ApiResponse<Customer[]>>('/api/admin/customers-simple', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true
  })
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
 */
export function useAdminPanelData() {
  return useSWR<ApiResponse<{
    stats: AdminStats
    businesses: Business[]
    customers: Customer[]
    stampCards: StampCard[]
    membershipCards: MembershipCard[]
    customerCards: CustomerCard[]
  }>>('/api/admin/panel-data', fetcher, {
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