'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Plus,
  Users,
  Target,
  QrCode,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Star,
  TrendingUp,
  Award,
  Copy,
  Share2,
  Download,
  ExternalLink,
  Search,
  Filter,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

/**
 * 🃏 MODERN CARD MANAGEMENT
 * 
 * Phase 4 redesign for business card management (Role 2)
 * Mobile-first design with enhanced visual hierarchy
 */

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  customer_count?: number
  completion_rate?: number
  monthly_usage?: number
}

interface ModernCardManagementProps {
  cards?: StampCard[]
  loading?: boolean
  onCreateCard?: () => void
  onViewCard?: (cardId: string) => void
  onEditCard?: (cardId: string) => void
  onDeleteCard?: (cardId: string) => void
  className?: string
}

export default function ModernCardManagement({
  cards = [],
  loading = false,
  onCreateCard,
  onViewCard,
  onEditCard,
  onDeleteCard,
  className
}: ModernCardManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [selectedCards, setSelectedCards] = useState<string[]>([])

  // Mock data for demonstration
  const defaultCards: StampCard[] = [
    {
      id: '1',
      name: 'Coffee Loyalty Card',
      total_stamps: 10,
      reward_description: 'Free coffee of your choice',
      status: 'active',
      created_at: '2024-01-15',
      customer_count: 127,
      completion_rate: 68,
      monthly_usage: 45
    },
    {
      id: '2',
      name: 'Breakfast Special',
      total_stamps: 8,
      reward_description: 'Free breakfast meal',
      status: 'active',
      created_at: '2024-01-10',
      customer_count: 89,
      completion_rate: 72,
      monthly_usage: 32
    },
    {
      id: '3',
      name: 'Weekend Treats',
      total_stamps: 12,
      reward_description: '20% off weekend orders',
      status: 'draft',
      created_at: '2024-01-20',
      customer_count: 0,
      completion_rate: 0,
      monthly_usage: 0
    }
  ]

  const displayCards = cards.length > 0 ? cards : defaultCards
  const filteredCards = displayCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || card.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return <CardManagementSkeleton />
  }

  return (
    <div className={`${modernStyles.layout.container} ${className}`}>
      <div className={modernStyles.layout.section}>
        
        {/* Header */}
        <CardManagementHeader 
          onCreateCard={onCreateCard}
          cardsCount={displayCards.length}
          activeCount={displayCards.filter(c => c.status === 'active').length}
        />

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        {/* Cards Grid */}
        {filteredCards.length > 0 ? (
          <CardsGrid
            cards={filteredCards}
            selectedCards={selectedCards}
            onSelectCard={setSelectedCards}
            onViewCard={onViewCard}
            onEditCard={onEditCard}
            onDeleteCard={onDeleteCard}
          />
        ) : (
          <EmptyState onCreateCard={onCreateCard} />
        )}

        {/* Summary Stats */}
        <CardsSummary cards={displayCards} />

      </div>
    </div>
  )
}

// Header Component
function CardManagementHeader({
  onCreateCard,
  cardsCount,
  activeCount
}: {
  onCreateCard?: () => void
  cardsCount: number
  activeCount: number
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
            Loyalty Cards
          </h1>
          <p className="text-gray-600">
            Manage your stamp cards and reward programs
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            onClick={onCreateCard}
            className={`${roleStyles.business.button.primary} w-full sm:w-auto`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Card
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-600">{cardsCount}</div>
          <div className="text-sm text-emerald-700">Total Cards</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
          <div className="text-sm text-blue-700">Active Cards</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">216</div>
          <div className="text-sm text-purple-700">Total Customers</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-600">70%</div>
          <div className="text-sm text-orange-700">Avg. Completion</div>
        </div>
      </div>
    </motion.div>
  )
}

// Search and Filters Component
function SearchAndFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange
}: {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterStatus: string
  onFilterChange: (value: any) => void
}) {
  const statusOptions = [
    { value: 'all', label: 'All Cards', count: '8' },
    { value: 'active', label: 'Active', count: '6' },
    { value: 'inactive', label: 'Inactive', count: '1' },
    { value: 'draft', label: 'Draft', count: '1' }
  ]

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={filterStatus === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(option.value)}
              className="whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-1" />
              {option.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {option.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
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
  cards: StampCard[]
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
            <StampCardItem
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

// Individual Card Item
function StampCardItem({
  card,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete
}: {
  card: StampCard
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={`${roleStyles.business.card} group relative overflow-hidden transition-all duration-200 hover:scale-105`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {card.name}
            </CardTitle>
            <Badge className={`${getStatusColor(card.status)} text-xs`}>
              {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
            </Badge>
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]">
                <button
                  onClick={onView}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={onEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Card
                </button>
                <button
                  onClick={() => {/* Share logic */}}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share QR Code
                </button>
                <hr className="my-2" />
                <button
                  onClick={onDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Card
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Card Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Stamps Required</div>
                <div className="font-semibold">{card.total_stamps}</div>
              </div>
              <div>
                <div className="text-gray-600">Customers</div>
                <div className="font-semibold">{card.customer_count || 0}</div>
              </div>
            </div>
          </div>

          {/* Reward */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Reward</div>
            <div className="text-sm font-medium text-gray-900">
              {card.reward_description}
            </div>
          </div>

          {/* Performance Metrics */}
          {card.status === 'active' && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{card.completion_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${card.completion_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly Usage</span>
                <div className="flex items-center text-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="font-medium">{card.monthly_usage}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onView}
              size="sm"
              className="flex-1"
              variant="outline"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </Button>
            <Button
              onClick={() => {/* QR Code logic */}}
              size="sm"
              className={`flex-1 ${roleStyles.business.button.primary}`}
            >
              <QrCode className="w-4 h-4 mr-1" />
              QR Code
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component
function EmptyState({ onCreateCard }: { onCreateCard?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <Card className="max-w-md mx-auto border-dashed border-2 border-gray-300">
        <CardContent className="p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create Your First Loyalty Card
          </h3>
          <p className="text-gray-600 mb-6">
            Start building customer loyalty with personalized stamp cards
          </p>
          <Button 
            onClick={onCreateCard}
            className={roleStyles.business.button.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Card
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Summary Component
function CardsSummary({ cards }: { cards: StampCard[] }) {
  const totalCustomers = cards.reduce((sum, card) => sum + (card.customer_count || 0), 0)
  const avgCompletion = cards.length > 0 
    ? cards.reduce((sum, card) => sum + (card.completion_rate || 0), 0) / cards.length 
    : 0

  return (
    <Card className={`${roleStyles.business.card} mt-8`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="w-5 h-5 mr-2 text-emerald-600" />
          Performance Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalCustomers}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{avgCompletion.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg. Completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">77</div>
            <div className="text-sm text-gray-600">Monthly Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">24</div>
            <div className="text-sm text-gray-600">Rewards Given</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function CardManagementSkeleton() {
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