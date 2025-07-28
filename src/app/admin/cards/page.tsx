'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Building, 
  Users, 
  Calendar,
  Search,
  Filter,
  Eye,
  Target,
  Dumbbell,
  RefreshCw
} from 'lucide-react'

// Interfaces
interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: string
  created_at: string
  business_id: string
  business_name: string
  customer_count: number
  type: 'stamp'
}

interface MembershipCard {
  id: string
  name: string
  total_sessions: number
  cost: number
  status: string
  created_at: string
  business_id: string
  business_name: string
  customer_count: number
  type: 'membership'
}

type Card = StampCard | MembershipCard

interface Filters {
  businessName: string
  cardType: 'all' | 'stamp' | 'membership'
  dateFrom: string
  dateTo: string
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [filteredCards, setFilteredCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    businessName: '',
    cardType: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const router = useRouter()
  const supabase = createClient()

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stamp cards with business info
      const { data: stampCards, error: stampError } = await supabase
        .from('stamp_cards')
        .select(`
          id,
          name,
          total_stamps,
          reward_description,
          status,
          created_at,
          business_id,
          businesses!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (stampError) {
        console.error('Error fetching stamp cards:', stampError)
      }

      // Fetch membership cards with business info
      const { data: membershipCards, error: membershipError } = await supabase
        .from('membership_cards')
        .select(`
          id,
          name,
          total_sessions,
          cost,
          status,
          created_at,
          business_id,
          businesses!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (membershipError) {
        console.error('Error fetching membership cards:', membershipError)
      }

      // Process stamp cards
      const processedStampCards: StampCard[] = await Promise.all(
        (stampCards || []).map(async (card) => {
          // Get customer count
          const { count } = await supabase
            .from('customer_cards')
            .select('*', { count: 'exact', head: true })
            .eq('stamp_card_id', card.id)

          return {
            id: card.id,
            name: card.name,
            total_stamps: card.total_stamps,
            reward_description: card.reward_description,
            status: card.status,
            created_at: card.created_at,
            business_id: card.business_id,
            business_name: (card.businesses as any)?.name || 'Unknown Business',
            customer_count: count || 0,
            type: 'stamp' as const
          }
        })
      )

      // Process membership cards
      const processedMembershipCards: MembershipCard[] = await Promise.all(
        (membershipCards || []).map(async (card) => {
          // Get customer count
          const { count } = await supabase
            .from('customer_cards')
            .select('*', { count: 'exact', head: true })
            .eq('stamp_card_id', card.id)
            .eq('membership_type', 'gym')

          return {
            id: card.id,
            name: card.name,
            total_sessions: card.total_sessions,
            cost: card.cost,
            status: card.status,
            created_at: card.created_at,
            business_id: card.business_id,
            business_name: (card.businesses as any)?.name || 'Unknown Business',
            customer_count: count || 0,
            type: 'membership' as const
          }
        })
      )

      // Combine and sort all cards
      const allCards = [...processedStampCards, ...processedMembershipCards]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setCards(allCards)
      setFilteredCards(allCards)

    } catch (err) {
      console.error('Error fetching cards:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cards')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Filter cards based on current filters
  const applyFilters = useCallback(() => {
    let filtered = [...cards]

    // Filter by business name
    if (filters.businessName) {
      filtered = filtered.filter(card => 
        card.business_name.toLowerCase().includes(filters.businessName.toLowerCase())
      )
    }

    // Filter by card type
    if (filters.cardType !== 'all') {
      filtered = filtered.filter(card => card.type === filters.cardType)
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(card => 
        new Date(card.created_at) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(card => 
        new Date(card.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    setFilteredCards(filtered)
  }, [cards, filters])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      businessName: '',
      cardType: 'all',
      dateFrom: '',
      dateTo: ''
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const getCardIcon = (type: string) => {
    return type === 'stamp' ? Target : Dumbbell
  }

  const getCardTypeColor = (type: string) => {
    return type === 'stamp' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Card Management</h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            View and manage all stamp cards and membership cards across all businesses.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cards.length}</div>
              <p className="text-xs text-muted-foreground">All active cards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stamp Cards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cards.filter(card => card.type === 'stamp').length}
              </div>
              <p className="text-xs text-muted-foreground">Loyalty programs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membership Cards</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cards.filter(card => card.type === 'membership').length}
              </div>
              <p className="text-xs text-muted-foreground">Gym memberships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cards.reduce((sum, card) => sum + card.customer_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Enrolled customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search businesses..."
                    value={filters.businessName}
                    onChange={(e) => handleFilterChange('businessName', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Type
                </label>
                <select
                  value={filters.cardType}
                  onChange={(e) => handleFilterChange('cardType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="stamp">Stamp Cards</option>
                  <option value="membership">Membership Cards</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Showing {filteredCards.length} of {cards.length} cards
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button variant="outline" size="sm" onClick={fetchCards}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cards found</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                {cards.length === 0 
                  ? "No cards have been created yet." 
                  : "No cards match your current filters. Try adjusting your search criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => {
              const Icon = getCardIcon(card.type)
              return (
                <Card key={`${card.type}-${card.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          <Badge className={getCardTypeColor(card.type)}>
                            {card.type === 'stamp' ? 'Stamp Card' : 'Membership'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg truncate">{card.name}</CardTitle>
                        <p className="text-sm text-gray-600 truncate">{card.business_name}</p>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {card.customer_count}
                        </div>
                        <div className="text-xs text-gray-500">customers</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Card-specific details */}
                      {card.type === 'stamp' ? (
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Stamps:</span>
                            <span className="font-medium">{card.total_stamps}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Reward:</span> {card.reward_description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Sessions:</span>
                            <span className="font-medium">{card.total_sessions}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium">{formatCurrency(card.cost)}</span>
                          </div>
                        </div>
                      )}

                      {/* Status and Date */}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(card.created_at)}
                        </div>
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Link 
                          href={`/admin/cards/${card.type}/${card.id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        <Link 
                          href={`/business/${card.type === 'stamp' ? 'stamp-cards' : 'memberships'}/${card.id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <Building className="w-3 h-3 mr-1" />
                            Business View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
} 