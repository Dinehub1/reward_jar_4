'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { PaginationControls } from '@/components/admin/PaginationControls'
import { useAdminPagination } from '@/lib/hooks/use-admin-pagination'
import { RefreshCw, Search, Filter, ExternalLink, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

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
}

// Status badge configuration
const statusConfig = {
  active: { label: 'Active', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Pending', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
  suspended: { label: 'Suspended', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
}

export default function EnhancedBusinessesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [flaggedFilter, setFlaggedFilter] = useState<string>('all')

  // Build dynamic filters
  const filters = useMemo(() => {
    const baseFilters: Record<string, any> = {}
    
    if (statusFilter !== 'all') {
      baseFilters.status = statusFilter
    }
    
    if (flaggedFilter === 'flagged') {
      baseFilters.is_flagged = true
    } else if (flaggedFilter === 'not_flagged') {
      baseFilters.is_flagged = false
    }
    
    return baseFilters
  }, [statusFilter, flaggedFilter])

  // Enhanced pagination with search and filtering
  const {
    data: businesses,
    pagination,
    refresh,
    search,
    filter,
    isLoading,
    error
  } = useAdminPagination<Business>({
    table: 'businesses',
    select: `
      id,
      name,
      contact_email,
      description,
      owner_id,
      status,
      is_flagged,
      card_requested,
      admin_notes,
      created_at
    `,
    filters,
    orderBy: { column: 'created_at', ascending: false },
    searchColumn: 'name',
    searchTerm,
    pageSize: 25,
    cacheKey: 'admin-businesses'
  })

  // Handle search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    search(value)
  }, [search])

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    if (newFilters.status !== undefined) {
      setStatusFilter(newFilters.status)
    }
    if (newFilters.flagged !== undefined) {
      setFlaggedFilter(newFilters.flagged)
    }
    filter(newFilters)
  }, [filter])

  // Calculate metrics from current page data (for demo)
  const metrics = useMemo(() => {
    return {
      total: pagination.totalItems,
      active: businesses.filter(b => b.status === 'active').length,
      flagged: businesses.filter(b => b.is_flagged).length,
      cardRequests: businesses.filter(b => b.card_requested).length
    }
  }, [businesses, pagination.totalItems])

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Management</h1>
            <p className="text-muted-foreground">
              Efficiently manage {pagination.totalItems.toLocaleString()} businesses with advanced pagination
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.totalItems.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Showing {businesses.length} on this page
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
                <div className="h-2 w-2 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.active}</div>
                <p className="text-xs text-muted-foreground">
                  On current page
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Businesses</CardTitle>
                <div className="h-2 w-2 bg-red-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.flagged}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Card Requests</CardTitle>
                <div className="h-2 w-2 bg-blue-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cardRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Pending approval
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search businesses by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => handleFilterChange({ status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={flaggedFilter}
                  onValueChange={(value) => handleFilterChange({ flagged: value })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Flagged" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="flagged">Flagged Only</SelectItem>
                    <SelectItem value="not_flagged">Not Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business List */}
        <Card>
          <CardHeader>
            <CardTitle>Business Directory</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-red-600">Error loading businesses: {error}</span>
              ) : (
                `Showing ${businesses.length} of ${pagination.totalItems.toLocaleString()} businesses`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || flaggedFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No businesses have been created yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business, index) => (
                  <motion.div
                    key={business.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {business.name}
                          </h3>
                          {business.is_flagged && (
                            <Badge variant="destructive" className="text-xs">
                              Flagged
                            </Badge>
                          )}
                          {business.card_requested && (
                            <Badge variant="outline" className="text-xs">
                              Card Requested
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{business.contact_email || 'No email'}</span>
                          <span>•</span>
                          <span>Created {format(new Date(business.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge 
                        className={statusConfig[business.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}
                      >
                        {statusConfig[business.status as keyof typeof statusConfig]?.label || business.status}
                      </Badge>
                      
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/admin/businesses/${business.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          isLoading={isLoading}
          onPageChange={pagination.goToPage}
          onPageSizeChange={pagination.setPageSize}
          onRefresh={refresh}
          showPageSizeSelector={true}
          showRefresh={false} // Already have refresh button in header
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </AdminLayoutClient>
  )
}