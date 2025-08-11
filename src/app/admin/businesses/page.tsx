'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { useBusinesses, useAdminStatsCompat as useAdminStats } from '@/lib/hooks/use-admin-data'
import { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Search, Filter, Edit, Trash2, Plus, ExternalLink } from 'lucide-react'

// Use types from the centralized service
interface Business {
  id: string
  name: string
  contact_email: string | null
  description?: string | null
  owner_id?: string
  status: string
  is_flagged?: boolean | null
  card_requested?: boolean | null
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
  cardRequests: number
  newThisWeek: number
}

export default function BusinessesPage() {
  const { data: statsData, loading: statsLoading, error: statsError } = useAdminStats()
  const { data: businessesData, loading: businessesLoading, error: businessesError, refetch } = useBusinesses()
  
  // Enhanced state management
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'flagged'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const loading = statsLoading || businessesLoading
  const error = statsError || businessesError

  // Defensive programming: Ensure businessesData is always an array
  const safeBusinessesData = Array.isArray(businessesData) ? businessesData : []

  // Calculate business metrics from the data with safety checks
  const businessMetrics: BusinessMetrics = {
    totalBusinesses: safeBusinessesData.length || 0,
    activeBusinesses: safeBusinessesData.filter(b => b?.status === 'active').length || 0,
    flaggedBusinesses: safeBusinessesData.filter(b => b?.is_flagged === true).length || 0,
    cardRequests: safeBusinessesData.filter(b => (b as any)?.card_requested === true).length || 0,
    newThisWeek: safeBusinessesData.filter(b => {
      try {
        if (!b?.created_at) return false
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(b.created_at) > weekAgo
      } catch (dateError) {
        return false
      }
    }).length || 0
  }

  // Enhanced refresh function
  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    setRefreshError(null)
    
    try {
      await refetch()
      setLastRefresh(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data'
      setRefreshError(errorMessage)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh effect - disabled by default in development
  useEffect(() => {
    if (!autoRefreshEnabled || process.env.NODE_ENV === 'development') return

    const interval = setInterval(() => {
      if (!loading && !isRefreshing) {
        handleRefresh()
      }
    }, 300000) // Auto-refresh every 5 minutes

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, loading, isRefreshing])

  // Filter and search businesses
  const filteredBusinesses = safeBusinessesData.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && business.status === 'active') ||
                         (filterStatus === 'inactive' && business.status === 'inactive') ||
                         (filterStatus === 'flagged' && business.is_flagged === true)
    
    return matchesSearch && matchesFilter
  })

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
            {lastRefresh && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CreateBusinessDialog onBusinessCreated={refetch} />
            {refreshError && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Refresh failed</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={autoRefreshEnabled ? 'bg-green-50 text-green-700' : ''}
            >
              <Clock className="h-4 w-4 mr-1" />
              Auto: {autoRefreshEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={loading || isRefreshing}
              variant={refreshError ? "destructive" : "default"}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : refreshError ? 'Retry' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Enhanced Error Banner */}
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

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search businesses by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All ({safeBusinessesData.length})
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active ({businessMetrics.activeBusinesses})
                </Button>
                <Button
                  variant={filterStatus === 'flagged' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('flagged')}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Flagged ({businessMetrics.flaggedBusinesses})
                </Button>
              </div>
            </div>
            {filteredBusinesses.length !== safeBusinessesData.length && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing {filteredBusinesses.length} of {safeBusinessesData.length} businesses
              </p>
            )}
          </CardContent>
        </Card>

        <BusinessStats stats={businessMetrics} />
        <BusinessesTable businesses={filteredBusinesses} onBusinessUpdated={refetch} />
      </div>
    </AdminLayoutClient>
  )
}

function BusinessStats({ stats }: { stats: BusinessMetrics }) {
  const activePercentage = stats.totalBusinesses > 0 ? 
    Math.round((stats.activeBusinesses / stats.totalBusinesses) * 100) : 0
  
  const flaggedPercentage = stats.totalBusinesses > 0 ? 
    Math.round((stats.flaggedBusinesses / stats.totalBusinesses) * 100) : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">🏢</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalBusinesses}</div>
          <p className="text-xs text-muted-foreground">Registered businesses</p>
          <div className="flex items-center mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            {activePercentage}% of total
          </p>
          <div className="flex items-center mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-green-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${activePercentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-muted-foreground ml-2">{activePercentage}%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Card Requests</CardTitle>
          <div className="flex items-center">
            <span className="text-2xl">🎯</span>
            {stats.cardRequests > 0 && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full ml-1 animate-pulse"></div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.cardRequests > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
            {stats.cardRequests}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.cardRequests > 0 ? 'Businesses need cards' : 'All businesses have cards'}
          </p>
          {stats.cardRequests > 0 && (
            <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-300">
              Needs attention
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flagged Businesses</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${stats.flaggedBusinesses > 0 ? 'text-red-600' : 'text-gray-400'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.flaggedBusinesses > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.flaggedBusinesses}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.flaggedBusinesses > 0 ? `${flaggedPercentage}% need attention` : 'All clear'}
          </p>
          {stats.flaggedBusinesses > 0 && (
            <div className="flex items-center mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-red-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${flaggedPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-red-600 ml-2">{flaggedPercentage}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <div className="flex items-center">
            <span className="text-2xl">📈</span>
            {stats.newThisWeek > 0 && (
              <div className="w-2 h-2 bg-green-500 rounded-full ml-1 animate-pulse"></div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.newThisWeek}</div>
          <p className="text-xs text-muted-foreground">Recent signups (7 days)</p>
          {stats.newThisWeek > 0 && (
            <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
              +{stats.newThisWeek} this week
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BusinessesTable({ businesses, onBusinessUpdated }: { businesses: Business[], onBusinessUpdated: () => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

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
                        {business.card_requested && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            Card Requested
                          </Badge>
                        )}
                        {business.is_flagged && (
                          <Badge variant="destructive">Flagged</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/admin/businesses/${business.id}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <EditBusinessDialog 
                          business={business} 
                          onBusinessUpdated={onBusinessUpdated} 
                        />
                        <DeleteBusinessDialog 
                          business={business} 
                          onBusinessDeleted={onBusinessUpdated} 
                        />
                      </div>
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

// Create Business Dialog Component
function CreateBusinessDialog({ onBusinessCreated }: { onBusinessCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    status: 'active' as 'active' | 'inactive'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setOpen(false)
        setFormData({ name: '', description: '', contact_email: '', status: 'active' })
        onBusinessCreated()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error creating business: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Business</DialogTitle>
          <DialogDescription>
            Add a new business to the platform. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter business name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="business@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the business"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Business'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Business Dialog Component
function EditBusinessDialog({ business, onBusinessUpdated }: { business: Business, onBusinessUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || '',
    contact_email: business.contact_email || '',
    status: business.status as 'active' | 'inactive',
    is_flagged: business.is_flagged || false,
    admin_notes: business.admin_notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setOpen(false)
        onBusinessUpdated()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error updating business: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Business</DialogTitle>
          <DialogDescription>
            Update business information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Business Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter business name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact_email">Contact Email</Label>
              <Input
                id="edit-contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="business@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the business"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-admin_notes">Admin Notes</Label>
              <Textarea
                id="edit-admin_notes"
                value={formData.admin_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                placeholder="Internal notes about this business"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is_flagged"
                checked={formData.is_flagged}
                onChange={(e) => setFormData(prev => ({ ...prev, is_flagged: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-is_flagged">Flag this business</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Business'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Business Dialog Component
function DeleteBusinessDialog({ business, onBusinessDeleted }: { business: Business, onBusinessDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setOpen(false)
        onBusinessDeleted()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error deleting business: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Business</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{business.name}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">⚠️ Warning</h4>
            <p className="text-sm text-red-700">
              Deleting this business will permanently remove:
            </p>
            <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
              <li>Business profile and settings</li>
              <li>All associated cards (if any)</li>
              <li>Customer relationships</li>
              <li>Transaction history</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Business'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 