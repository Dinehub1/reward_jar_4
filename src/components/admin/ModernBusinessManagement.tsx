'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Users,
  CreditCard,
  TrendingUp,
  Flag,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Star,
  DollarSign,
  Download,
  Upload,
  Settings,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

/**
 * 🏢 MODERN ADMIN BUSINESS MANAGEMENT
 * 
 * Phase 4 redesign for admin business management (Role 1)
 * Professional interface for business oversight and management
 */

interface Business {
  id: string
  name: string
  contact_email: string | null
  description?: string | null
  owner_id?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  is_flagged?: boolean | null
  card_requested?: boolean | null
  admin_notes?: string | null
  created_at: string
  total_cards?: number
  active_cards?: number
  monthly_revenue?: number
  customer_count?: number
  completion_rate?: number
}

interface BusinessMetrics {
  totalBusinesses: number
  activeBusinesses: number
  flaggedBusinesses: number
  cardRequests: number
  newThisWeek: number
  totalRevenue: number
  avgCompletion: number
}

interface ModernBusinessManagementProps {
  businesses?: Business[]
  metrics?: BusinessMetrics
  loading?: boolean
  onCreateBusiness?: () => void
  onViewBusiness?: (businessId: string) => void
  onEditBusiness?: (businessId: string) => void
  onDeleteBusiness?: (businessId: string) => void
  className?: string
}

export default function ModernBusinessManagement({
  businesses = [],
  metrics,
  loading = false,
  onCreateBusiness,
  onViewBusiness,
  onEditBusiness,
  onDeleteBusiness,
  className
}: ModernBusinessManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending' | 'suspended'>('all')
  const [filterFlags, setFilterFlags] = useState<'all' | 'flagged' | 'requests'>('all')
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Use real data when available, fallback to empty state
  const displayBusinesses = businesses || []
  const displayMetrics = metrics || {
    totalBusinesses: 0,
    activeBusinesses: 0,
    flaggedBusinesses: 0,
    cardRequests: 0,
    newThisWeek: 0,
    totalRevenue: 0,
    avgCompletion: 0
  }

  const filteredBusinesses = displayBusinesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || business.status === filterStatus
    const matchesFlags = filterFlags === 'all' || 
                        (filterFlags === 'flagged' && business.is_flagged) ||
                        (filterFlags === 'requests' && business.card_requested)
    return matchesSearch && matchesStatus && matchesFlags
  })

  if (loading) {
    return <BusinessManagementSkeleton />
  }

  return (
    <div className={`${modernStyles.layout.container} ${className}`}>
      <div className={modernStyles.layout.section}>
        
        {/* Header */}
        <BusinessManagementHeader 
          onCreateBusiness={onCreateBusiness}
          metrics={displayMetrics}
        />

        {/* Controls */}
        <BusinessManagementControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterFlags={filterFlags}
          onFilterFlagsChange={setFilterFlags}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedBusinesses={selectedBusinesses}
          onBulkAction={(action) => console.log('Bulk action:', action)}
        />

        {/* Business Display */}
        <Tabs value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({displayBusinesses.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({displayBusinesses.filter(b => b.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({displayBusinesses.filter(b => b.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({displayBusinesses.filter(b => b.status === 'inactive').length})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({displayBusinesses.filter(b => b.status === 'suspended').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={filterStatus} className="mt-6">
            {viewMode === 'grid' ? (
              <BusinessGrid
                businesses={filteredBusinesses}
                selectedBusinesses={selectedBusinesses}
                onSelectBusiness={setSelectedBusinesses}
                onViewBusiness={onViewBusiness}
                onEditBusiness={onEditBusiness}
                onDeleteBusiness={onDeleteBusiness}
              />
            ) : (
              <BusinessTable
                businesses={filteredBusinesses}
                selectedBusinesses={selectedBusinesses}
                onSelectBusiness={setSelectedBusinesses}
                onViewBusiness={onViewBusiness}
                onEditBusiness={onEditBusiness}
                onDeleteBusiness={onDeleteBusiness}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Analytics Summary */}
        <BusinessAnalytics businesses={displayBusinesses} metrics={displayMetrics} />

      </div>
    </div>
  )
}

// Header Component
function BusinessManagementHeader({
  onCreateBusiness,
  metrics
}: {
  onCreateBusiness?: () => void
  metrics: BusinessMetrics
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Business Management
          </h1>
          <p className="text-gray-600">
            Manage and monitor all businesses on the platform
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            onClick={onCreateBusiness}
            className={`${roleStyles.admin.button.primary}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Business
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{metrics.totalBusinesses}</div>
              <div className="text-sm text-blue-700">Total Businesses</div>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{metrics.activeBusinesses}</div>
              <div className="text-sm text-green-700">Active</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{metrics.cardRequests}</div>
              <div className="text-sm text-orange-700">Card Requests</div>
            </div>
            <CreditCard className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">${metrics.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-purple-700">Total Revenue</div>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Controls Component
function BusinessManagementControls({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterFlags,
  onFilterFlagsChange,
  viewMode,
  onViewModeChange,
  selectedBusinesses,
  onBulkAction
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterStatusChange: (value: any) => void
  filterFlags: string
  onFilterFlagsChange: (value: any) => void
  viewMode: 'grid' | 'table'
  onViewModeChange: (mode: 'grid' | 'table') => void
  selectedBusinesses: string[]
  onBulkAction: (action: string) => void
}) {
  return (
    <div className="mb-6 space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search businesses or emails..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterFlags === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterFlagsChange('all')}
          >
            All Issues
          </Button>
          <Button
            variant={filterFlags === 'flagged' ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterFlagsChange('flagged')}
          >
            <Flag className="w-4 h-4 mr-1" />
            Flagged
          </Button>
          <Button
            variant={filterFlags === 'requests' ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterFlagsChange('requests')}
          >
            <CreditCard className="w-4 h-4 mr-1" />
            Card Requests
          </Button>
        </div>

        <div className="flex gap-2 border-l border-gray-200 pl-4">
          <Button
            variant={viewMode === 'grid' ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange('table')}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBusinesses.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedBusinesses.length} businesses selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onBulkAction('export')}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => onBulkAction('status')}>
              <Settings className="w-4 h-4 mr-1" />
              Change Status
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Business Grid Component
function BusinessGrid({
  businesses,
  selectedBusinesses,
  onSelectBusiness,
  onViewBusiness,
  onEditBusiness,
  onDeleteBusiness
}: {
  businesses: Business[]
  selectedBusinesses: string[]
  onSelectBusiness: (businesses: string[]) => void
  onViewBusiness?: (businessId: string) => void
  onEditBusiness?: (businessId: string) => void
  onDeleteBusiness?: (businessId: string) => void
}) {
  return (
    <div className={modernStyles.layout.grid.responsive}>
      <AnimatePresence>
        {businesses.map((business, index) => (
          <motion.div
            key={business.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <BusinessCard
              business={business}
              isSelected={selectedBusinesses.includes(business.id)}
              onSelect={(selected) => {
                if (selected) {
                  onSelectBusiness([...selectedBusinesses, business.id])
                } else {
                  onSelectBusiness(selectedBusinesses.filter(id => id !== business.id))
                }
              }}
              onView={() => onViewBusiness?.(business.id)}
              onEdit={() => onEditBusiness?.(business.id)}
              onDelete={() => onDeleteBusiness?.(business.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Individual Business Card
function BusinessCard({
  business,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete
}: {
  business: Business
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={`${roleStyles.admin.card} group relative overflow-hidden transition-all duration-200 hover:scale-105`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {business.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mb-2">{business.contact_email}</p>
              <div className="flex gap-2">
                <Badge className={`${getStatusColor(business.status)} text-xs`}>
                  {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                </Badge>
                {business.is_flagged && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                    <Flag className="w-3 h-3 mr-1" />
                    Flagged
                  </Badge>
                )}
                {business.card_requested && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                    <CreditCard className="w-3 h-3 mr-1" />
                    Card Request
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          {business.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {business.description}
            </p>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Cards</div>
              <div className="font-semibold">{business.total_cards || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">Customers</div>
              <div className="font-semibold">{business.customer_count || 0}</div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
            <div className="text-lg font-bold text-green-600">
              ${(business.monthly_revenue || 0).toLocaleString()}
            </div>
          </div>

          {/* Performance */}
          {business.completion_rate && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium">{business.completion_rate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${business.completion_rate}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {business.admin_notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm font-medium text-yellow-800 mb-1">Admin Notes</div>
              <div className="text-sm text-yellow-700">{business.admin_notes}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onView} size="sm" variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button onClick={onEdit} size="sm" className={`flex-1 ${roleStyles.admin.button.primary}`}>
              <Edit className="w-4 h-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Table View (simplified)
function BusinessTable({ businesses, selectedBusinesses, onSelectBusiness, onViewBusiness, onEditBusiness, onDeleteBusiness }: any) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">Business Table View</div>
      </div>
      <div className="p-6 text-center text-gray-500">
        Table view implementation available in full version
      </div>
    </div>
  )
}

// Analytics Component
function BusinessAnalytics({ businesses, metrics }: { businesses: Business[], metrics: BusinessMetrics }) {
  const totalRevenue = businesses.reduce((sum, business) => sum + (business.monthly_revenue || 0), 0)
  const totalCustomers = businesses.reduce((sum, business) => sum + (business.customer_count || 0), 0)

  return (
    <Card className={`${roleStyles.admin.card} mt-8`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Business Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCustomers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.avgCompletion}%</div>
            <div className="text-sm text-gray-600">Avg. Completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.newThisWeek}</div>
            <div className="text-sm text-gray-600">New This Week</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function BusinessManagementSkeleton() {
  return (
    <div className={modernStyles.layout.container}>
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
        
        {/* Business cards skeleton */}
        <div className={modernStyles.layout.grid.responsive}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}