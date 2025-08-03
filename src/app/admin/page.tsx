'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { useAdminStats, useAdminBusinesses } from '@/lib/hooks/use-admin-data'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { RefreshCw, Database, Activity, FileText, Zap, AlertTriangle } from 'lucide-react'
import type { AdminStats, Business } from '@/lib/supabase/types'

// Icons for the dashboard
const icons = {
  businesses: '🏢',
  customers: '👥',
  cards: '🎴',
  analytics: '📊',
  alerts: '🚨',
  activity: '⚡'
}

// Dashboard Cards Component
function DashboardCards({ stats }: { stats: AdminStats }) {
  console.log('🎯 DASHBOARD CARDS - Rendering with stats:', stats)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">{icons.businesses}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalBusinesses || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active businesses registered
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <span className="text-2xl">{icons.customers}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.totalCustomers || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Registered customer accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
          <span className="text-2xl">{icons.cards}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.totalCards || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Card templates available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <span className="text-2xl">{icons.activity}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats?.recentActivity || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Platform activity level
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// BusinessesTable Component
function BusinessesTable({ businesses }: { businesses: Business[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Defensive programming: Ensure businesses is always an array
  const safeBusinesses = Array.isArray(businesses) ? businesses : []

  console.log('🏢 BUSINESSES TABLE - Rendering with businesses:', safeBusinesses.length)

  const filteredBusinesses = safeBusinesses.filter(business => {
    if (!business) return false
    
    try {
      const name = business.name?.toLowerCase() || ''
      const email = business.contact_email?.toLowerCase() || ''
      const search = searchTerm.toLowerCase()
      
      return name.includes(search) || email.includes(search)
    } catch (filterError) {
      console.warn('Error filtering business:', business?.id, filterError)
      return false
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Businesses</CardTitle>
        <CardDescription>
          Latest business registrations ({safeBusinesses.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredBusinesses.slice(0, 5).map((business) => {
            if (!business?.id) {
              console.warn('Business without ID found:', business)
              return null
            }
            
            return (
              <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{business.name || 'Unnamed Business'}</div>
                  <div className="text-sm text-muted-foreground">{business.contact_email || 'No email'}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                    {business.status || 'unknown'}
                  </Badge>
                  {business.is_flagged && (
                    <Badge variant="destructive">Flagged</Badge>
                  )}
                </div>
              </div>
            )
          })}
          
          {filteredBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {safeBusinesses.length === 0 
                ? 'No businesses found in the system' 
                : 'No businesses match your search'
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Component
function QuickActionsPanel({ onRefreshAll }: { onRefreshAll: () => Promise<void> }) {
  const [isPerformingAction, setIsPerformingAction] = useState(false)
  const [actionResults, setActionResults] = useState<string[]>([])

  const addResult = (result: string) => {
    setActionResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 4)])
  }

  const performQuickAction = async (action: string, actionFn: () => Promise<void>) => {
    if (isPerformingAction) return
    
    setIsPerformingAction(true)
    addResult(`Starting ${action}...`)
    
    try {
      await actionFn()
      addResult(`✅ ${action} completed successfully`)
    } catch (error) {
      addResult(`❌ ${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error(`${action} failed:`, error)
    } finally {
      setIsPerformingAction(false)
    }
  }

  const clearCache = async () => {
    // Simulate cache clearing - in real implementation, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
  }

  const syncWallets = async () => {
    // Simulate wallet sync - in real implementation, this would call wallet APIs
    const response = await fetch('/api/admin/sync-wallets', { method: 'POST' })
    if (!response.ok) throw new Error('Wallet sync failed')
  }

  const generateReports = async () => {
    // Simulate report generation - in real implementation, this would generate reports
    const response = await fetch('/api/admin/generate-reports', { method: 'POST' })
    if (!response.ok) throw new Error('Report generation failed')
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <Button 
              className="w-full" 
              onClick={() => performQuickAction('Refresh All Data', onRefreshAll)}
              disabled={isPerformingAction}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isPerformingAction ? 'animate-spin' : ''}`} />
              Refresh All Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Refresh all dashboard data
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => performQuickAction('Clear Cache', clearCache)}
              disabled={isPerformingAction}
            >
              <Database className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Clear browser cache
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => performQuickAction('Sync Wallets', syncWallets)}
              disabled={isPerformingAction}
            >
              <Activity className="mr-2 h-4 w-4" />
              Sync Wallets
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Sync wallet updates
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => performQuickAction('Generate Reports', generateReports)}
              disabled={isPerformingAction}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Generate system reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Results */}
      {actionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {actionResults.map((result, index) => (
                <div key={index} className="text-xs font-mono p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main Admin Dashboard Page
export default function AdminDashboard() {
  console.log('🚀 ADMIN DASHBOARD - Main component rendering...')
  
  // Tab state management
  const [activeTab, setActiveTab] = useState<'overview' | 'quick-actions'>('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  const { data: statsResponse, error: statsError, isLoading: statsLoading, mutate: refetchStats } = useAdminStats()
  const { data: businessesResponse, error: businessesError, isLoading: businessesLoading, mutate: refetchBusinesses } = useAdminBusinesses()

  // Extract data from API responses
  const statsData = statsResponse?.data?.stats
  const businessesData = businessesResponse?.data

  const loading = statsLoading || businessesLoading
  const error = statsError || businessesError
  const safeBusinessesData = Array.isArray(businessesData) ? businessesData : []

  // Enhanced refresh function with proper error handling
  const refetchAll = async () => {
    if (refreshing) return
    
    setRefreshing(true)
    setRefreshError(null)
    console.log('🔄 Starting data refresh...')
    
    try {
      await Promise.all([
        refetchStats(),
        refetchBusinesses()
      ])
      setLastRefresh(new Date())
      console.log('✅ Data refresh completed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setRefreshError(errorMessage)
      console.error('❌ Data refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <AdminLayoutClient>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Centralized control center for RewardJar 4.0 platform
              </p>
            </div>
            <Button disabled>Loading...</Button>
          </div>

          {/* Skeleton for stats cards */}
          <CardSkeleton count={4} />
          
          {/* Skeleton for content */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Businesses</CardTitle>
                <CardDescription>Loading business data...</CardDescription>
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={3} columns={2} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Loading system metrics...</CardDescription>
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={4} columns={2} />
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  if (error) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="text-red-600 mb-4">
              <div className="text-lg font-semibold">Error Loading Dashboard</div>
              <div className="text-sm mt-2">{error}</div>
            </div>
            <div className="space-x-2">
              <Button onClick={() => refetchAll()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Centralized control center for RewardJar 4.0 platform
            </p>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {refreshError && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Refresh failed</span>
              </div>
            )}
            <Button 
              onClick={refetchAll} 
              disabled={loading || refreshing}
              variant={refreshError ? "destructive" : "default"}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : refreshError ? 'Retry' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        {refreshError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Data refresh failed: {refreshError}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setRefreshError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              {icons.analytics} Overview
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('quick-actions')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'quick-actions' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Quick Actions
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Dashboard Stats Cards */}
            <DashboardCards stats={statsData || {
              totalBusinesses: 0,
              totalCustomers: 0,
              totalCards: 0,
              totalStampCards: 0,
              totalMembershipCards: 0,
              flaggedBusinesses: 0,
              recentActivity: 0
            }} />

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              <BusinessesTable businesses={safeBusinessesData} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{icons.analytics}</span>
                    <span>System Overview</span>
                  </CardTitle>
                  <CardDescription>Platform health and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Businesses:</span>
                      <Badge variant="outline">{statsData?.totalBusinesses || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Customers:</span>
                      <Badge variant="outline">{statsData?.totalCustomers || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Cards:</span>
                      <Badge variant="outline">{statsData?.totalCards || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Card Templates:</span>
                      <Badge variant="outline">{(statsData?.totalStampCards || 0) + (statsData?.totalMembershipCards || 0)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'quick-actions' && (
          <QuickActionsPanel onRefreshAll={refetchAll} />
        )}
      </div>
    </AdminLayoutClient>
  )
} 