/**
 * 🔧 UNIFIED DASHBOARD HOOK
 * 
 * Mobile-first hook for the new unified dashboard API
 * Provides optimized data fetching, caching, and error handling
 */

import useSWR from 'swr'
import { useCallback, useMemo } from 'react'
import type { ApiResponse } from '@/lib/supabase/types'

interface DashboardStats {
  customerRetentionRate: number
  loyaltyEngagementRate: number  
  newCustomerAcquisition: number
  averageSpendPerVisit: number
  totalCustomers: number
  activeCards: number
  totalRedemptions: number
  weeklyGrowth: number
  industryComparison?: {
    retentionPercentile: number
    engagementPercentile: number
    acquisitionPercentile: number
  }
}

interface QuickAction {
  label: string
  href: string
  icon: string
  count?: number
}

interface RecentActivity {
  type: 'stamp' | 'redemption' | 'signup'
  customer: string
  timestamp: string
  details: string
}

interface DashboardAlert {
  type: 'info' | 'warning' | 'success'
  message: string
  action?: string
}

interface UnifiedDashboardData {
  stats: DashboardStats
  quickActions: QuickAction[]
  recentActivity: RecentActivity[]
  alerts?: DashboardAlert[]
}

interface UseUnifiedDashboardOptions {
  type?: 'summary' | 'detailed' | 'mobile'
  timeRange?: '7d' | '30d' | '90d'
  metrics?: string[]
  refreshInterval?: number
  enabled?: boolean
}

interface UseUnifiedDashboardReturn {
  data: UnifiedDashboardData | undefined
  stats: DashboardStats | undefined
  quickActions: QuickAction[]
  recentActivity: RecentActivity[]
  alerts: DashboardAlert[]
  isLoading: boolean
  error: Error | undefined
  refresh: () => Promise<any>
  responseTime: number | undefined
}

// Mobile-optimized SWR configuration
const MOBILE_SWR_CONFIG = {
  refreshInterval: 60000, // 1 minute for mobile (less aggressive)
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 2, // Fewer retries on mobile
  errorRetryInterval: 3000,
  // Mobile-specific optimizations
  keepPreviousData: true, // Show stale data while revalidating
  revalidateIfStale: true,
  shouldRetryOnError: (error) => {
    // Don't retry on auth errors
    if (error?.status === 401 || error?.status === 403) return false
    return true
  }
}

// Optimized fetcher with mobile considerations
const fetcher = async (url: string): Promise<UnifiedDashboardData> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for mobile

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw Object.assign(new Error(errorData.error || 'Network error'), {
        status: response.status,
        code: errorData.code
      })
    }

    const result: ApiResponse<UnifiedDashboardData> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'API error')
    }

    return result.data
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - check your connection')
    }
    
    throw error
  }
}

export function useUnifiedDashboard(options: UseUnifiedDashboardOptions = {}): UseUnifiedDashboardReturn {
  const {
    type = 'mobile', // Default to mobile-optimized
    timeRange = '30d',
    metrics = [],
    refreshInterval = MOBILE_SWR_CONFIG.refreshInterval,
    enabled = true
  } = options

  // Build API URL with parameters
  const apiUrl = useMemo(() => {
    if (!enabled) return null
    
    const params = new URLSearchParams({
      type,
      timeRange,
      ...(metrics.length > 0 && { metrics: metrics.join(',') })
    })
    
    return `/api/v1/dashboard?${params.toString()}`
  }, [type, timeRange, metrics, enabled])

  // SWR hook with mobile optimizations
  const { data, error, isLoading, mutate } = useSWR<UnifiedDashboardData>(
    apiUrl,
    fetcher,
    {
      ...MOBILE_SWR_CONFIG,
      refreshInterval: refreshInterval,
      onError: (error, key) => {
        console.error('[UNIFIED-DASHBOARD] Error:', error, 'Key:', key)
        
        // Track errors for analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'dashboard_error', {
            error_type: error.code || 'unknown',
            endpoint: key
          })
        }
      },
      onSuccess: (data, key) => {
        // Track successful loads
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'dashboard_load', {
            type,
            timeRange,
            endpoint: key
          })
        }
      }
    }
  )

  // Memoized derived data
  const stats = useMemo(() => data?.stats, [data?.stats])
  const quickActions = useMemo(() => data?.quickActions || [], [data?.quickActions])
  const recentActivity = useMemo(() => data?.recentActivity || [], [data?.recentActivity])
  const alerts = useMemo(() => data?.alerts || [], [data?.alerts])

  // Response time tracking
  const responseTime = useMemo(() => {
    // This would be populated from the API response meta
    return undefined // TODO: Extract from API response
  }, [])

  // Refresh function
  const refresh = useCallback(async () => {
    return mutate()
  }, [mutate])

  return {
    data,
    stats,
    quickActions,
    recentActivity,
    alerts,
    isLoading,
    error,
    refresh,
    responseTime
  }
}

// Specialized hooks for different views
export function useMobileDashboard(timeRange: '7d' | '30d' | '90d' = '30d') {
  return useUnifiedDashboard({
    type: 'mobile',
    timeRange,
    refreshInterval: 60000 // 1 minute for mobile
  })
}

export function useDesktopDashboard(timeRange: '7d' | '30d' | '90d' = '30d') {
  return useUnifiedDashboard({
    type: 'detailed',
    timeRange,
    refreshInterval: 30000 // 30 seconds for desktop
  })
}

export function useDashboardSummary() {
  return useUnifiedDashboard({
    type: 'summary',
    timeRange: '7d',
    refreshInterval: 120000 // 2 minutes for summary
  })
}

// Hook for specific metrics
export function useDashboardMetrics(metrics: string[], timeRange: '7d' | '30d' | '90d' = '30d') {
  return useUnifiedDashboard({
    type: 'mobile',
    timeRange,
    metrics,
    refreshInterval: 45000 // 45 seconds for specific metrics
  })
}