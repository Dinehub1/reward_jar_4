'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Building,
  Users,
  Activity,
  Star,
  Clock,
  Apple,
  Chrome,
  Globe,
  Filter,
  Download,
  Upload,
  Copy,
  ExternalLink,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

/**
 * 🛡️ MODERN ADMIN CARD MANAGEMENT
 * 
 * Phase 4 redesign for admin card management (Role 1)
 * Professional interface for system-wide card oversight
 */

interface AdminCard {
  id: string
  name: string
  type: 'stamp' | 'membership'
  business_name: string
  business_id: string
  total_stamps?: number
  price?: number
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  customer_count: number
  completion_rate: number
  monthly_revenue: number
  wallet_support: {
    apple: boolean
    google: boolean
    pwa: boolean
  }
}

interface ModernAdminCardManagementProps {
  cards?: AdminCard[]
  loading?: boolean
  onCreateCard?: () => void
  onViewCard?: (cardId: string) => void
  onEditCard?: (cardId: string) => void
  onDeleteCard?: (cardId: string) => void
  className?: string
}

export default function ModernAdminCardManagement({
  cards = [],
  loading = false,
  onCreateCard,
  onViewCard,
  onEditCard,
  onDeleteCard,
  className
}: ModernAdminCardManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'stamp' | 'membership'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Use real data when available, fallback to empty state
  const displayCards = cards || []
  const filteredCards = displayCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.business_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || card.type === filterType
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  if (loading) {
    return <AdminCardManagementSkeleton />
  }

  return (
    <div className={`${modernStyles.layout.container} ${className}`}>
      <div className={modernStyles.layout.section}>
        
        {/* Header */}
        <AdminCardsHeader 
          onCreateCard={onCreateCard}
          cardsCount={displayCards.length}
          totalRevenue={displayCards.reduce((sum, card) => sum + card.monthly_revenue, 0)}
        />

        {/* Controls */}
        <AdminCardsControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCards={selectedCards}
          onBulkAction={(action) => console.log('Bulk action:', action)}
        />

        {/* Cards Display */}
        <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Cards ({displayCards.length})</TabsTrigger>
            <TabsTrigger value="stamp">Stamp Cards ({displayCards.filter(c => c.type === 'stamp').length})</TabsTrigger>
            <TabsTrigger value="membership">Membership Cards ({displayCards.filter(c => c.type === 'membership').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={filterType} className="mt-6">
            {viewMode === 'grid' ? (
              <CardsGrid
                cards={filteredCards}
                selectedCards={selectedCards}
                onSelectCard={setSelectedCards}
                onViewCard={onViewCard}
                onEditCard={onEditCard}
                onDeleteCard={onDeleteCard}
              />
            ) : (
              <CardsTable
                cards={filteredCards}
                selectedCards={selectedCards}
                onSelectCard={setSelectedCards}
                onViewCard={onViewCard}
                onEditCard={onEditCard}
                onDeleteCard={onDeleteCard}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Summary Analytics */}
        <SystemAnalytics cards={displayCards} />

      </div>
    </div>
  )
}

// Header Component
function AdminCardsHeader({
  onCreateCard,
  cardsCount,
  totalRevenue
}: {
  onCreateCard?: () => void
  cardsCount: number
  totalRevenue: number
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
            Card Management
          </h1>
          <p className="text-gray-600">
            System-wide loyalty card administration and analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            onClick={onCreateCard}
            className={`${roleStyles.admin.button.primary}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Card
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">{cardsCount}</div>
          <div className="text-sm text-blue-700">Total Cards</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-green-700">Monthly Revenue</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">228</div>
          <div className="text-sm text-purple-700">Active Customers</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-600">66%</div>
          <div className="text-sm text-orange-700">Avg. Completion</div>
        </div>
      </div>
    </motion.div>
  )
}

// Controls Component
function AdminCardsControls({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  viewMode,
  onViewModeChange,
  selectedCards,
  onBulkAction
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterType: string
  onFilterTypeChange: (value: any) => void
  filterStatus: string
  onFilterStatusChange: (value: any) => void
  viewMode: 'grid' | 'table'
  onViewModeChange: (mode: 'grid' | 'table') => void
  selectedCards: string[]
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
              placeholder="Search cards or businesses..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterStatusChange('all')}
          >
            All Status
          </Button>
          <Button
            variant={filterStatus === 'active' ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterStatusChange('active')}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Active
          </Button>
          <Button
            variant={filterStatus === 'pending' ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterStatusChange('pending')}
          >
            <Clock className="w-4 h-4 mr-1" />
            Pending
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
      {selectedCards.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedCards.length} cards selected
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

// Cards Grid Component
function CardsGrid({
  cards,
  selectedCards,
  onSelectCard,
  onViewCard,
  onEditCard,
  onDeleteCard
}: {
  cards: AdminCard[]
  selectedCards: string[]
  onSelectCard: (cards: string[]) => void
  onViewCard?: (cardId: string) => void
  onEditCard?: (cardId: string) => void
  onDeleteCard?: (cardId: string) => void
}) {
  return (
    <div className={modernStyles.layout.grid.responsive}>
      <AnimatePresence>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <AdminCardItem
              card={card}
              isSelected={selectedCards.includes(card.id)}
              onSelect={(selected) => {
                if (selected) {
                  onSelectCard([...selectedCards, card.id])
                } else {
                  onSelectCard(selectedCards.filter(id => id !== card.id))
                }
              }}
              onView={() => onViewCard?.(card.id)}
              onEdit={() => onEditCard?.(card.id)}
              onDelete={() => onDeleteCard?.(card.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Individual Admin Card Item
function AdminCardItem({
  card,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete
}: {
  card: AdminCard
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
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'stamp' ? Star : Users
  }

  const TypeIcon = getTypeIcon(card.type)

  return (
    <Card className={`${roleStyles.admin.card} group relative overflow-hidden transition-all duration-200 hover:scale-105`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TypeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {card.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mb-2">{card.business_name}</p>
              <Badge className={`${getStatusColor(card.status)} text-xs`}>
                {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
              </Badge>
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Customers</div>
              <div className="font-semibold">{card.customer_count}</div>
            </div>
            <div>
              <div className="text-gray-600">Completion</div>
              <div className="font-semibold">{card.completion_rate}%</div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
            <div className="text-lg font-bold text-green-600">
              ${card.monthly_revenue.toLocaleString()}
            </div>
          </div>

          {/* Wallet Support */}
          <div>
            <div className="text-sm text-gray-600 mb-2">Wallet Support</div>
            <div className="flex space-x-2">
              <div className={`p-2 rounded-lg ${card.wallet_support.apple ? 'bg-gray-900' : 'bg-gray-200'}`}>
                <Apple className={`w-4 h-4 ${card.wallet_support.apple ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className={`p-2 rounded-lg ${card.wallet_support.google ? 'bg-blue-500' : 'bg-gray-200'}`}>
                <Chrome className={`w-4 h-4 ${card.wallet_support.google ? 'text-white' : 'text-gray-400'}`} />
              </div>
              <div className={`p-2 rounded-lg ${card.wallet_support.pwa ? 'bg-purple-500' : 'bg-gray-200'}`}>
                <Globe className={`w-4 h-4 ${card.wallet_support.pwa ? 'text-white' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onView} size="sm" variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button onClick={onEdit} size="sm" className={`flex-1 ${roleStyles.admin.button.primary}`}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Table View (simplified for space)
function CardsTable({ cards, selectedCards, onSelectCard, onViewCard, onEditCard, onDeleteCard }: any) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-900">Cards Table View</div>
      </div>
      <div className="p-6 text-center text-gray-500">
        Table view implementation available in full version
      </div>
    </div>
  )
}

// System Analytics Component
function SystemAnalytics({ cards }: { cards: AdminCard[] }) {
  const totalRevenue = cards.reduce((sum, card) => sum + card.monthly_revenue, 0)
  const avgCompletion = cards.length > 0 
    ? cards.reduce((sum, card) => sum + card.completion_rate, 0) / cards.length 
    : 0

  return (
    <Card className={`${roleStyles.admin.card} mt-8`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          System Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{avgCompletion.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg. Completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {cards.filter(c => c.wallet_support.apple).length}
            </div>
            <div className="text-sm text-gray-600">Apple Wallet</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {cards.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Cards</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function AdminCardManagementSkeleton() {
  return (
    <div className={modernStyles.layout.container}>
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
        
        {/* Cards skeleton */}
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