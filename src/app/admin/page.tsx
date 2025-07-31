'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { useAdminStats, useAdminBusinesses } from '@/lib/hooks/use-admin-data'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
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

// Main Admin Dashboard Page
export default function AdminDashboard() {
  console.log('🚀 ADMIN DASHBOARD - Main component rendering...')
  
  const { data: statsResponse, error: statsError, isLoading: statsLoading, mutate: refetchStats } = useAdminStats()
  const { data: businessesResponse, error: businessesError, isLoading: businessesLoading, mutate: refetchBusinesses } = useAdminBusinesses()

  // Extract data from API responses
  const statsData = statsResponse?.data?.stats
  const businessesData = businessesResponse?.data

  const loading = statsLoading || businessesLoading
  const error = statsError || businessesError
  const safeBusinessesData = Array.isArray(businessesData) ? businessesData : []

  const refetchAll = () => {
    refetchStats()
    refetchBusinesses()
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
          </div>
          <Button onClick={() => refetchAll()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        <div className="flex space-x-2 border-b">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500">
            Overview
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Quick Actions
          </button>
        </div>

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
                  <span>Stamp Cards:</span>
                  <Badge variant="outline">{statsData?.totalStampCards || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Membership Cards:</span>
                  <Badge variant="outline">{statsData?.totalMembershipCards || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutClient>
  )
} 