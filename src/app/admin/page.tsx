'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModernButton } from '@/components/modern/ui/ModernButton'
import { Badge } from '@/components/ui/badge'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { useAdminStats } from '@/lib/hooks/use-admin-data'
import { useAdminRealtime, useAdminNotifications } from '@/lib/hooks/use-admin-realtime'
import { adminNotifications, useAdminEvents } from '@/lib/admin-events'
import { ModernCardSkeleton, ModernTableSkeleton } from '@/components/modern/ui/ModernSkeleton'
import { PageTransition } from '@/components/modern/layout/PageTransition'
import { BusinessCreationDialog } from '@/components/admin/BusinessCreationDialog'
import { RefreshCw, Database, Activity, FileText, Zap, AlertTriangle, Plus, CreditCard, Building2, Eye, Bell } from 'lucide-react'
import React from 'react'
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
            {(stats?.totalStampCards || 0) + (stats?.totalMembershipCards || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Card templates available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customer Cards</CardTitle>
          <span className="text-2xl">{icons.activity}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats?.totalCards || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Cards in customer wallets
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// BusinessesTable Component
function BusinessesTable({ businesses, onRefresh }: { businesses: Business[], onRefresh?: () => void }) {
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

  const handleViewBusiness = (businessId: string) => {
    window.open(`/admin/businesses/${businessId}`, '_blank')
  }

  const handleCreateStampCard = (businessId: string) => {
    window.open(`/admin/cards/new?businessId=${businessId}&type=stamp`, '_blank')
  }

  const handleCreateMembershipCard = (businessId: string) => {
    window.open(`/admin/cards/new?businessId=${businessId}&type=membership`, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
        <CardTitle>Recent Businesses</CardTitle>
        <CardDescription>
          Latest business registrations ({safeBusinesses.length} total)
        </CardDescription>
          </div>
          <BusinessCreationDialog onBusinessCreated={onRefresh} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredBusinesses.slice(0, 5).map((business) => {
            if (!business?.id) {
              console.warn('Business without ID found:', business)
              return null
            }
            
            return (
              <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium">{business.name || 'Unnamed Business'}</div>
                  <div className="text-sm text-muted-foreground">{business.contact_email || 'No email'}</div>
                  <div className="flex gap-2 mt-2">
                  <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                    {business.status || 'unknown'}
                  </Badge>
                  {business.is_flagged && (
                    <Badge variant="destructive">Flagged</Badge>
                    )}
                    {business.card_requested && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        Card Requested
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewBusiness(business.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </ModernButton>
                  {business.card_requested && (
                    <>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateStampCard(business.id)}
                        className="flex items-center gap-1 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        Stamp Card
                      </ModernButton>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateMembershipCard(business.id)}
                        className="flex items-center gap-1 border-blue-500 text-blue-700 hover:bg-blue-50"
                      >
                        <Building2 className="w-4 h-4" />
                        Membership Card
                      </ModernButton>
                    </>
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
            <ModernButton 
              className="w-full" 
              onClick={() => performQuickAction('Refresh All Data', onRefreshAll)}
              disabled={isPerformingAction}
              variant="gradient"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isPerformingAction ? 'animate-spin' : ''}`} />
              Refresh All Data
            </ModernButton>
            <p className="text-xs text-muted-foreground mt-2">
              Refresh all dashboard data
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <ModernButton 
              className="w-full" 
              variant="outline"
              onClick={() => performQuickAction('Clear Cache', clearCache)}
              disabled={isPerformingAction}
            >
              <Database className="mr-2 h-4 w-4" />
              Clear Cache
            </ModernButton>
            <p className="text-xs text-muted-foreground mt-2">
              Clear browser cache
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <ModernButton 
              className="w-full" 
              variant="outline"
              onClick={() => performQuickAction('Sync Wallets', syncWallets)}
              disabled={isPerformingAction}
            >
              <Activity className="mr-2 h-4 w-4" />
              Sync Wallets
            </ModernButton>
            <p className="text-xs text-muted-foreground mt-2">
              Sync wallet updates
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <ModernButton 
              className="w-full" 
              variant="outline"
              onClick={() => performQuickAction('Generate Reports', generateReports)}
              disabled={isPerformingAction}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
            </ModernButton>
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
  
  // Use unified API for consistent data - SINGLE SOURCE OF TRUTH
  const { data: unifiedResponse, error: unifiedError, isLoading: unifiedLoading, mutate: refetchUnified } = useAdminStats()

  // Real-time subscriptions for automatic updates
  const { isConnected: realtimeConnected } = useAdminRealtime()
  const { sendNotification } = useAdminNotifications()
  
  // ✅ ADMIN EVENTS: Subscribe to admin events for notifications
  const { events: adminEvents } = useAdminEvents()
  
  // ✅ ADMIN CLEANUP COMPLETED: Notify about system improvements
  React.useEffect(() => {
    // ✅ COMPLETED: Migrated all redundant APIs to dashboard-unified
    adminNotifications.endpointDeprecated('/api/admin/panel-data', '/api/admin/dashboard-unified')
    adminNotifications.endpointDeprecated('/api/admin/dashboard-stats', '/api/admin/dashboard-unified')
    adminNotifications.endpointDeprecated('/api/admin/all-data', '/api/admin/dashboard-unified')
    
    // ✅ COMPLETED: System improvements notification
    adminNotifications.cleanupComplete(
      'Admin System Cleanup Phase 1',
      'API consolidation, auth standardization, error handling, and notification system implemented'
    )
  }, [])

  // Extract data from unified API response - SINGLE DATA SOURCE
  const statsData = unifiedResponse?.data?.stats
  const businessesData = unifiedResponse?.data?.businesses || []

  const loading = unifiedLoading
  const error = unifiedError
  const safeBusinessesData = Array.isArray(businessesData) ? businessesData : []

  // Enhanced refresh function with unified API
  const refetchAll = async () => {
    if (refreshing) return
    
    setRefreshing(true)
    setRefreshError(null)
    console.log('🔄 Starting unified data refresh...')
    
    try {
      await refetchUnified()
      setLastRefresh(new Date())
      console.log('✅ Unified data refresh completed successfully')
      
      // ✅ ADMIN NOTIFICATION: Notify about successful cleanup/refresh
      adminNotifications.cleanupComplete(
        'Dashboard Data Refresh',
        'All admin dashboard data has been successfully refreshed'
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setRefreshError(errorMessage)
      console.error('❌ Unified data refresh failed:', error)
      
      // ✅ ADMIN NOTIFICATION: Notify about refresh failures
      adminNotifications.systemError(
        'Dashboard Refresh Failed',
        errorMessage,
        { action: 'data_refresh', error: errorMessage }
      )
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
            <ModernButton disabled>Loading...</ModernButton>
          </div>

          {/* Skeleton for stats cards */}
          <ModernCardSkeleton count={4} />
          
          {/* Skeleton for content */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Businesses</CardTitle>
                <CardDescription>Loading business data...</CardDescription>
              </CardHeader>
              <CardContent>
                <ModernTableSkeleton rows={3} columns={2} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Loading system metrics...</CardDescription>
              </CardHeader>
              <CardContent>
                <ModernTableSkeleton rows={4} columns={2} />
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
              <div className="text-sm mt-2">{(error as any) instanceof Error ? (error as any).message : String(error)}</div>
            </div>
            <div className="space-x-2">
              <ModernButton onClick={() => refetchAll()} variant="outline">
                Try Again
              </ModernButton>
              <ModernButton onClick={() => window.location.reload()}>
                Refresh Page
              </ModernButton>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <PageTransition>
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
            <ModernButton 
              onClick={refetchAll} 
              disabled={loading || refreshing}
              variant={refreshError ? "destructive" : "gradient"}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : refreshError ? 'Retry' : 'Refresh Data'}
            </ModernButton>
          </div>
        </div>

        {/* ✅ ADMIN NOTIFICATIONS PANEL */}
        {adminEvents.length > 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Bell className="w-5 h-5" />
                Recent Admin Events
                <Badge variant="secondary">{adminEvents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {adminEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/60 dark:bg-gray-800/60">
                    <div className={`mt-1 ${
                      event.severity === 'critical' ? 'text-red-500' :
                      event.severity === 'error' ? 'text-red-400' :
                      event.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`}>
                      {event.severity === 'critical' ? '🚨' :
                       event.severity === 'error' ? '❌' :
                       event.severity === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{event.message}</p>
                      <p className="text-xs text-gray-500">
                        {event.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Banner */}
        {refreshError && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Data refresh failed: {refreshError}
                </span>
                <ModernButton 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setRefreshError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </ModernButton>
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
              <BusinessesTable 
                businesses={safeBusinessesData} 
                onRefresh={() => {
                        refetchUnified()
                }} 
              />

              <div className="space-y-4">
                {/* Quick Actions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Quick Actions</span>
                    </CardTitle>
                    <CardDescription>Common admin tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      <ModernButton
                        variant="outline"
                        onClick={() => window.open('/admin/cards/new', '_blank')}
                        className="flex items-center justify-start gap-2 h-auto py-3"
                      >
                        <CreditCard className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium">Create New Card</div>
                          <div className="text-sm text-muted-foreground">Start the card creation wizard</div>
                        </div>
                      </ModernButton>
                      
                      <ModernButton
                        variant="outline"
                        onClick={() => window.open('/admin/businesses', '_blank')}
                        className="flex items-center justify-start gap-2 h-auto py-3"
                      >
                        <Building2 className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium">Manage Businesses</div>
                          <div className="text-sm text-muted-foreground">View all business accounts</div>
                        </div>
                      </ModernButton>
                      
                      <ModernButton
                        variant="outline"
                        onClick={() => window.open('/admin/customers', '_blank')}
                        className="flex items-center justify-start gap-2 h-auto py-3"
                      >
                        <span className="text-lg">👥</span>
                        <div className="text-left">
                          <div className="font-medium">Customer Management</div>
                          <div className="text-sm text-muted-foreground">View customer accounts</div>
                        </div>
                      </ModernButton>
                    </div>
                  </CardContent>
                </Card>

                {/* System Overview Card */}
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
            </div>
          </>
        )}

        {activeTab === 'quick-actions' && (
          <QuickActionsPanel onRefreshAll={refetchAll} />
        )}
        </div>
      </PageTransition>
    </AdminLayoutClient>
  )
} 