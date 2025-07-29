'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import LivePreviewBuilder from '@/components/wallet/LivePreviewBuilder'
import { createClient } from '@/lib/supabase'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Activity,
  TrendingUp,
  Star,
  Clock,
  Building
} from 'lucide-react'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  businesses: {
    id: string
    name: string
  }
  customer_cards: Array<{
    id: string
    current_stamps: number
    customers: {
      name: string
      email: string
    }
  }>
}

interface MembershipCard {
  id: string
  name: string
  total_sessions: number
  cost: number
  duration_days: number
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  businesses: {
    id: string
    name: string
  }
  customer_cards: Array<{
    id: string
    sessions_used: number
    expiry_date: string
    customers: {
      name: string
      email: string
    }
  }>
}

export default function AdminCardsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stamp' | 'membership'>('stamp')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [previewCard, setPreviewCard] = useState<any>(null)
  
  const [stampCards, setStampCards] = useState<StampCard[]>([])
  const [membershipCards, setMembershipCards] = useState<MembershipCard[]>([])
  const [stats, setStats] = useState({
    totalStampCards: 0,
    totalMembershipCards: 0,
    totalCustomers: 0,
    activeCards: 0
  })

  // Load cards data
  useEffect(() => {
    async function loadCards() {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // Load stamp cards
        const { data: stampCardsData } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            status,
            created_at,
            businesses!inner(id, name),
            customer_cards(
              id,
              current_stamps,
              customers!inner(name, email)
            )
          `)
          .order('created_at', { ascending: false })

        // Load membership cards
        const { data: membershipCardsData } = await supabase
          .from('membership_cards')
          .select(`
            id,
            name,
            total_sessions,
            cost,
            duration_days,
            status,
            created_at,
            businesses!inner(id, name),
            customer_cards(
              id,
              sessions_used,
              expiry_date,
              customers!inner(name, email)
            )
          `)
          .order('created_at', { ascending: false })

        if (stampCardsData) {
          setStampCards(stampCardsData as StampCard[])
        }

        if (membershipCardsData) {
          setMembershipCards(membershipCardsData as MembershipCard[])
        }

        // Calculate stats
        const totalCustomers = new Set([
          ...(stampCardsData?.flatMap(card => card.customer_cards.map(cc => cc.customers.email)) || []),
          ...(membershipCardsData?.flatMap(card => card.customer_cards.map(cc => cc.customers.email)) || [])
        ]).size

        setStats({
          totalStampCards: stampCardsData?.length || 0,
          totalMembershipCards: membershipCardsData?.length || 0,
          totalCustomers,
          activeCards: (stampCardsData?.filter(c => c.status === 'active').length || 0) + 
                      (membershipCardsData?.filter(c => c.status === 'active').length || 0)
        })

      } catch (error) {
        console.error('Error loading cards:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  const filteredStampCards = stampCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.businesses.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredMembershipCards = membershipCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.businesses.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePreviewCard = (card: StampCard | MembershipCard, type: 'stamp' | 'membership') => {
    const cardData = {
      id: card.id,
      name: card.name,
      business_name: card.businesses.name,
      card_type: type,
      theme: {
        background: type === 'stamp' ? '#4F46E5' : '#DC2626',
        primaryColor: type === 'stamp' ? '#4F46E5' : '#DC2626',
        secondaryColor: type === 'stamp' ? '#E0E7FF' : '#FEE2E2',
        textColor: '#FFFFFF',
        font: 'Inter'
      },
      values: type === 'stamp' ? {
        stamps_used: 0,
        total_stamps: (card as StampCard).total_stamps
      } : {
        sessions_used: 0,
        total_sessions: (card as MembershipCard).total_sessions,
        cost: (card as MembershipCard).cost
      },
      reward_description: card.reward_description || (type === 'membership' ? 
        `${(card as MembershipCard).total_sessions} sessions for $${(card as MembershipCard).cost}` : 
        'Complete your card for rewards!')
    }
    setPreviewCard(cardData)
  }

  return (
    <AdminLayoutClient>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Card Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Create and manage loyalty and membership cards</p>
            </div>
            <Button 
              onClick={() => router.push('/admin/cards/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Card
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Stamp Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStampCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Membership Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembershipCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cards List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Card Types */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stamp" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    📮 Stamp Cards ({filteredStampCards.length})
                  </TabsTrigger>
                  <TabsTrigger value="membership" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    🎟️ Membership Cards ({filteredMembershipCards.length})
                  </TabsTrigger>
                </TabsList>

                {/* Stamp Cards Tab */}
                <TabsContent value="stamp" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">📮 Stamp Cards</h2>
                    <Badge variant="outline">{filteredStampCards.length} cards</Badge>
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Loading stamp cards...</p>
                    </div>
                  ) : filteredStampCards.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No stamp cards found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {searchTerm ? 'No cards match your search criteria.' : 'Create your first stamp card to get started.'}
                        </p>
                        {!searchTerm && (
                          <Button onClick={() => router.push('/admin/cards/new')}>
                            Create Stamp Card
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredStampCards.map((card) => (
                        <Card key={card.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">{card.name}</h3>
                                  <Badge variant={card.status === 'active' ? 'default' : 
                                               card.status === 'draft' ? 'secondary' : 'destructive'}>
                                    {card.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {card.businesses.name}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    {card.total_stamps} stamps required
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {card.customer_cards.length} customers
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreviewCard(card, 'stamp')}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/cards/stamp/${card.id}`)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Membership Cards Tab */}
                <TabsContent value="membership" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🎟️ Membership Cards</h2>
                    <Badge variant="outline">{filteredMembershipCards.length} cards</Badge>
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">Loading membership cards...</p>
                    </div>
                  ) : filteredMembershipCards.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No membership cards found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {searchTerm ? 'No cards match your search criteria.' : 'Create your first membership card to get started.'}
                        </p>
                        {!searchTerm && (
                          <Button onClick={() => router.push('/admin/cards/new')}>
                            Create Membership Card
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {filteredMembershipCards.map((card) => (
                        <Card key={card.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">{card.name}</h3>
                                  <Badge variant={card.status === 'active' ? 'default' : 
                                               card.status === 'draft' ? 'secondary' : 'destructive'}>
                                    {card.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {card.businesses.name}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {card.total_sessions} sessions
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    ${card.cost}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {card.customer_cards.length} members
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreviewCard(card, 'membership')}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/cards/membership/${card.id}`)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Live Preview Panel */}
            <div className="lg:col-span-1">
              {previewCard ? (
                <div className="sticky top-6">
                  <LivePreviewBuilder
                    cardData={previewCard}
                    isEditable={false}
                    showControls={false}
                  />
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setPreviewCard(null)}
                      className="w-full"
                    >
                      Close Preview
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="sticky top-6">
                  <CardContent className="p-8 text-center">
                    <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Live Preview</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Click the preview button on any card to see how it will look in different wallets.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  )
} 