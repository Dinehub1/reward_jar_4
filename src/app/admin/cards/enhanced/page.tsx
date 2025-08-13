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
import { RefreshCw, Search, Filter, ExternalLink, CreditCard, Users, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface StampCard {
  id: string
  card_name: string
  business_id: string
  reward: string
  reward_description: string
  stamps_required: number
  status: string
  card_color: string
  icon_emoji: string
  created_at: string
  updated_at: string
  // Joined data
  businesses?: {
    name: string
    status: string
  }
  // Aggregated data
  _count?: {
    customer_cards: number
  }
}

interface MembershipCard {
  id: string
  name: string
  business_id: string
  membership_type: string
  membership_mode: string
  total_sessions: number
  cost: number
  duration_days: number
  status: string
  created_at: string
  updated_at: string
  // Joined data
  businesses?: {
    name: string
    status: string
  }
  // Aggregated data
  _count?: {
    customer_cards: number
  }
}

type Card = StampCard | MembershipCard

const cardTypeConfig = {
  stamp: { label: 'Stamp Card', color: 'bg-blue-100 text-blue-800', icon: '🎫' },
  membership: { label: 'Membership', color: 'bg-purple-100 text-purple-800', icon: '💳' }
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
  archived: { label: 'Archived', color: 'bg-red-100 text-red-800' }
}

export default function EnhancedCardsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('all')
  const [businessFilter, setBusinessFilter] = useState<string>('all')

  // Build dynamic filters for stamp cards
  const stampFilters = useMemo(() => {
    const baseFilters: Record<string, any> = {}
    
    if (statusFilter !== 'all') {
      baseFilters.status = statusFilter
    }
    
    if (businessFilter !== 'all') {
      baseFilters.business_id = businessFilter
    }
    
    return baseFilters
  }, [statusFilter, businessFilter])

  // Enhanced pagination for stamp cards
  const {
    data: stampCards,
    pagination: stampPagination,
    refresh: refreshStampCards,
    search: searchStampCards,
    filter: filterStampCards,
    isLoading: stampLoading,
    error: stampError
  } = useAdminPagination<StampCard>({
    table: 'stamp_cards',
    select: `
      id,
      card_name,
      business_id,
      reward,
      reward_description,
      stamps_required,
      status,
      card_color,
      icon_emoji,
      created_at,
      updated_at,
      businesses!inner(name, status)
    `,
    filters: cardTypeFilter === 'stamp' || cardTypeFilter === 'all' ? stampFilters : { id: 'null' },
    orderBy: { column: 'created_at', ascending: false },
    searchColumn: 'card_name',
    searchTerm: cardTypeFilter === 'stamp' || cardTypeFilter === 'all' ? searchTerm : '',
    pageSize: 20,
    cacheKey: 'admin-stamp-cards'
  })

  // Enhanced pagination for membership cards  
  const {
    data: membershipCards,
    pagination: membershipPagination,
    refresh: refreshMembershipCards,
    search: searchMembershipCards,
    filter: filterMembershipCards,
    isLoading: membershipLoading,
    error: membershipError
  } = useAdminPagination<MembershipCard>({
    table: 'membership_cards',
    select: `
      id,
      name,
      business_id,
      membership_type,
      membership_mode,
      total_sessions,
      cost,
      duration_days,
      status,
      created_at,
      updated_at,
      businesses!inner(name, status)
    `,
    filters: cardTypeFilter === 'membership' || cardTypeFilter === 'all' ? stampFilters : { id: 'null' },
    orderBy: { column: 'created_at', ascending: false },
    searchColumn: 'name',
    searchTerm: cardTypeFilter === 'membership' || cardTypeFilter === 'all' ? searchTerm : '',
    pageSize: 20,
    cacheKey: 'admin-membership-cards'
  })

  // Combine and sort cards by creation date
  const allCards = useMemo(() => {
    const cards: Array<Card & { cardType: 'stamp' | 'membership' }> = []
    
    if (cardTypeFilter === 'all' || cardTypeFilter === 'stamp') {
      cards.push(...stampCards.map(card => ({ ...card, cardType: 'stamp' as const })))
    }
    
    if (cardTypeFilter === 'all' || cardTypeFilter === 'membership') {
      cards.push(...membershipCards.map(card => ({ ...card, cardType: 'membership' as const })))
    }
    
    return cards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [stampCards, membershipCards, cardTypeFilter])

  const isLoading = stampLoading || membershipLoading
  const error = stampError || membershipError

  // Handle search with unified approach
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    searchStampCards(value)
    searchMembershipCards(value)
  }, [searchStampCards, searchMembershipCards])

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    if (newFilters.status !== undefined) {
      setStatusFilter(newFilters.status)
    }
    if (newFilters.cardType !== undefined) {
      setCardTypeFilter(newFilters.cardType)
    }
    if (newFilters.business !== undefined) {
      setBusinessFilter(newFilters.business)
    }
    
    filterStampCards(newFilters)
    filterMembershipCards(newFilters)
  }, [filterStampCards, filterMembershipCards])

  const refreshAll = useCallback(() => {
    refreshStampCards()
    refreshMembershipCards()
  }, [refreshStampCards, refreshMembershipCards])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalStampCards = stampPagination.totalItems
    const totalMembershipCards = membershipPagination.totalItems
    const total = totalStampCards + totalMembershipCards
    
    const activeCards = allCards.filter(card => card.status === 'active').length
    const thisWeek = allCards.filter(card => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(card.created_at) > weekAgo
    }).length

    return {
      total,
      totalStampCards,
      totalMembershipCards,
      active: activeCards,
      thisWeek
    }
  }, [allCards, stampPagination.totalItems, membershipPagination.totalItems])

  // Unified pagination for display (using stamp cards pagination as primary)
  const displayPagination = cardTypeFilter === 'membership' ? membershipPagination : stampPagination

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Card Management</h1>
            <p className="text-muted-foreground">
              Efficiently manage {metrics.total.toLocaleString()} cards across all businesses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <a href="/admin/cards/new">Create Card</a>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  All card types
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
                <CardTitle className="text-sm font-medium">Stamp Cards</CardTitle>
                <span className="text-lg">🎫</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalStampCards.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Loyalty programs
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
                <CardTitle className="text-sm font-medium">Memberships</CardTitle>
                <span className="text-lg">💳</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalMembershipCards.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Subscription plans
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
                <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.active}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.thisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  New cards created
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
                  placeholder="Search cards by name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                
                <Select
                  value={cardTypeFilter}
                  onValueChange={(value) => handleFilterChange({ cardType: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="stamp">Stamp Cards</SelectItem>
                    <SelectItem value="membership">Memberships</SelectItem>
                  </SelectContent>
                </Select>

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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Card Directory</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-red-600">Error loading cards: {error}</span>
              ) : (
                `Showing ${allCards.length} cards on this page`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || cardTypeFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No cards have been created yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allCards.slice(0, 20).map((card, index) => {
                  const cardName = 'card_name' in card ? card.card_name : card.name
                  const cardType = 'card_name' in card ? 'stamp' : 'membership'
                  
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className="h-16 w-16 rounded-lg flex items-center justify-center text-2xl"
                          style={{ 
                            backgroundColor: 'card_color' in card ? card.card_color + '20' : '#f3f4f6',
                            color: 'card_color' in card ? card.card_color : '#6b7280'
                          }}
                        >
                          {'icon_emoji' in card ? card.icon_emoji : cardTypeConfig[cardType].icon}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {cardName}
                            </h3>
                            <Badge className={cardTypeConfig[cardType].color}>
                              {cardTypeConfig[cardType].label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-1">
                            <span>{card.businesses?.name || 'Unknown Business'}</span>
                            <span>•</span>
                            <span>Created {format(new Date(card.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          
                          <div className="text-xs text-gray-400">
                            {cardType === 'stamp' && 'reward' in card && (
                              <span>{card.stamps_required} stamps → {card.reward}</span>
                            )}
                            {cardType === 'membership' && 'total_sessions' in card && (
                              <span>{card.total_sessions} sessions • {card.membership_mode}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={statusConfig[card.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                          {statusConfig[card.status as keyof typeof statusConfig]?.label || card.status}
                        </Badge>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/admin/cards/${card.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={displayPagination.currentPage}
          totalPages={displayPagination.totalPages}
          pageSize={displayPagination.pageSize}
          totalItems={displayPagination.totalItems}
          isLoading={isLoading}
          onPageChange={displayPagination.goToPage}
          onPageSizeChange={displayPagination.setPageSize}
          onRefresh={refreshAll}
          showPageSizeSelector={true}
          showRefresh={false}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>
    </AdminLayoutClient>
  )
}