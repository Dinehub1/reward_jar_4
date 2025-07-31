'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { useBusinesses, useAdminStatsCompat as useAdminStats } from '@/lib/hooks/use-admin-data'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'

// Use types from the centralized service
interface Business {
  id: string
  name: string
  contact_email: string | null
  description?: string | null
  owner_id?: string
  status: string
  is_flagged?: boolean | null
  admin_notes?: string | null
  created_at: string
  // Optional fields for compatibility
  total_cards?: number
  active_cards?: number
}

interface BusinessMetrics {
  totalBusinesses: number
  activeBusinesses: number
  flaggedBusinesses: number
  newThisWeek: number
}

export default function BusinessesPage() {
  const { data: statsData, loading: statsLoading, error: statsError } = useAdminStats()
  const { data: businessesData, loading: businessesLoading, error: businessesError, refetch } = useBusinesses()

  const loading = statsLoading || businessesLoading
  const error = statsError || businessesError

  // Defensive programming: Ensure businessesData is always an array
  const safeBusinessesData = Array.isArray(businessesData) ? businessesData : []

  // Calculate business metrics from the data with safety checks
  const businessMetrics: BusinessMetrics = {
    totalBusinesses: safeBusinessesData.length || 0,
    activeBusinesses: safeBusinessesData.filter(b => b?.status === 'active').length || 0,
    flaggedBusinesses: safeBusinessesData.filter(b => b?.is_flagged === true).length || 0,
    newThisWeek: safeBusinessesData.filter(b => {
      try {
        if (!b?.created_at) return false
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(b.created_at) > weekAgo
      } catch (dateError) {
        console.warn('Invalid date format for business:', b?.id, dateError)
        return false
      }
    }).length || 0
  }

  if (loading) {
    return (
      <AdminLayoutClient>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Business Management</h1>
              <p className="text-muted-foreground">
                Monitor and manage all business accounts on the platform
              </p>
            </div>
            <Button disabled>Loading...</Button>
          </div>

          {/* Skeleton for stats cards */}
          <CardSkeleton count={4} />
          
          {/* Skeleton for table */}
          <Card>
            <CardHeader>
              <CardTitle>Business Directory</CardTitle>
              <CardDescription>Loading business data...</CardDescription>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} columns={6} />
            </CardContent>
          </Card>
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
              <div className="text-lg font-semibold">Error Loading Businesses</div>
              <div className="text-sm mt-2">{error}</div>
            </div>
            <div className="space-x-2">
              <Button onClick={() => refetch()} variant="outline">
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
            <h1 className="text-3xl font-bold tracking-tight">Business Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage all business accounts on the platform
            </p>
          </div>
          <Button onClick={() => refetch()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        <BusinessStats stats={businessMetrics} />
        <BusinessesTable businesses={safeBusinessesData} />
      </div>
    </AdminLayoutClient>
  )
}

function BusinessStats({ stats }: { stats: BusinessMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">🏢</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
          <p className="text-xs text-muted-foreground">Registered businesses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
          <span className="text-2xl">✅</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeBusinesses}</div>
          <p className="text-xs text-muted-foreground">Currently active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flagged Businesses</CardTitle>
          <span className="text-2xl">🚨</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.flaggedBusinesses}</div>
          <p className="text-xs text-muted-foreground">Require attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <span className="text-2xl">📈</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.newThisWeek}</div>
          <p className="text-xs text-muted-foreground">Recent signups</p>
        </CardContent>
      </Card>
    </div>
  )
}

function BusinessesTable({ businesses }: { businesses: Business[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  // Defensive programming: Ensure businesses is always an array
  const safeBusinesses = Array.isArray(businesses) ? businesses : []

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
        <CardTitle>Business Directory</CardTitle>
        <CardDescription>
          Manage all business accounts and their status ({safeBusinesses.length} total)
        </CardDescription>
        <Input
          placeholder="Search businesses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Business</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Cards</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => {
                if (!business?.id) {
                  console.warn('Business without ID found:', business)
                  return null
                }
                
                return (
                  <tr key={business.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{business.name || 'Unnamed Business'}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {business.id.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="text-sm">{business.contact_email || 'No email'}</div>
                        <div className="text-sm text-muted-foreground">ID: {business.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        {business.description || 'No description'}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div>{business.total_cards || 0} total</div>
                        <div className="text-muted-foreground">{business.active_cards || 0} active</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                          {business.status || 'unknown'}
                        </Badge>
                        {business.is_flagged && (
                          <Badge variant="destructive">Flagged</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {filteredBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm 
                ? `No businesses match "${searchTerm}"` 
                : safeBusinesses.length === 0 
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