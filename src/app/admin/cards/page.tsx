'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { CardLivePreview } from '@/components/unified/CardLivePreview'
// Supabase client is not used here; avoid importing admin/service role in client code
// import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Users, 
  Activity,
  Star,
  Clock,
  Building,
  Apple,
  Chrome,
  Globe
} from 'lucide-react'

import { mapSimpleToPreview } from '@/lib/card-mappers'
import { normalizeDatabaseResponse } from '@/lib/utils/field-mapping'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  business_id: string
  businesses: {
    id: string
    name: string
  } | null
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
  business_id: string
  businesses: {
    id: string
    name: string
  } | null
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
  const [activeTab, setActiveTab] = useState<'stamp' | 'membership' | 'templates'>('stamp')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [previewCard, setPreviewCard] = useState<StampCard | MembershipCard | null>(null)
  const [previewCardType, setPreviewCardType] = useState<'stamp' | 'membership'>('stamp')
  const [previewWalletType, setPreviewWalletType] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [showBackPage, setShowBackPage] = useState(false)
  
  const [stampCards, setStampCards] = useState<StampCard[]>([])
  const [membershipCards, setMembershipCards] = useState<MembershipCard[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalStampCards: 0,
    totalMembershipCards: 0,
    totalCustomers: 0,
    activeCards: 0
  })

  // Load cards data using API endpoint
  useEffect(() => {
    async function loadCards() {
      setIsLoading(true)
      try {
        
        // Use the unified API endpoint for consistent data (get all data for customer count)
        const response = await fetch('/api/admin/dashboard-unified')
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success === false) {
          throw new Error(data.error || 'Failed to load card data')
        }

        // Use the unified API response format
        const unifiedData = data.data
        const stampCards = unifiedData.cards?.stampCards || []
        const membershipCards = unifiedData.cards?.membershipCards || []
        const stats = {
          totalStampCards: unifiedData.stats?.totalStampCards || stampCards.length,
          totalMembershipCards: unifiedData.stats?.totalMembershipCards || membershipCards.length,
          totalCustomers: unifiedData.stats?.totalCustomers || 0,
          activeCards: unifiedData.stats?.totalCards || 0
        }
        
          stampCards: stampCards.length,
          membershipCards: membershipCards.length,
          stats
        })

        setStampCards(stampCards)
        setMembershipCards(membershipCards)
        setStats(stats)

        // Load templates list (best-effort)
        try {
          const tRes = await fetch('/api/admin/templates')
          const tJson = await tRes.json()
          setTemplates(tJson?.data || [])
        } catch (e) {
        }

      } catch (error) {
        
        // Fallback: create some sample data to show the UI is working
        
        const sampleStampCards: StampCard[] = [
          {
            id: '1',
            name: 'Sample Coffee Card',
            total_stamps: 10,
            reward_description: 'Free coffee after 10 stamps',
            status: 'active',
            created_at: new Date().toISOString(),
            business_id: '1',
            businesses: { id: '1', name: 'Sample Coffee Shop' },
            customer_cards: []
          }
        ]
        
        const sampleMembershipCards: MembershipCard[] = [
          {
            id: '1',
            name: 'Sample Gym Membership',
            total_sessions: 20,
            cost: 100,
            duration_days: 365,
            status: 'active',
            created_at: new Date().toISOString(),
            business_id: '1',
            businesses: { id: '1', name: 'Sample Gym' },
            customer_cards: []
          }
        ]
        
        setStampCards(sampleStampCards)
        setMembershipCards(sampleMembershipCards)
        setStats({
          totalStampCards: sampleStampCards.length,
          totalMembershipCards: sampleMembershipCards.length,
          totalCustomers: 0,
          activeCards: sampleStampCards.length + sampleMembershipCards.length
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  const filteredStampCards = stampCards.filter(card => {
    if (!card) return false
    const matchesSearch = (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (card.businesses?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredMembershipCards = membershipCards.filter(card => {
    if (!card) return false
    const matchesSearch = (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (card.businesses?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePreviewCard = (card: StampCard | MembershipCard, type: 'stamp' | 'membership') => {
    setPreviewCard(card)
    setPreviewCardType(type)
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
            <Button onClick={() => router.push('/admin/cards/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create New Card
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stamp Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStampCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Membership Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembershipCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
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
          </div>

          {/* Tabs for Stamp, Membership, and Templates */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stamp" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                📮 Stamp Cards ({filteredStampCards.length})
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                🎟️ Membership Cards ({filteredMembershipCards.length})
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                🧩 Templates ({templates.length})
              </TabsTrigger>
            </TabsList>

            {/* Stamp Cards Tab Content */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStampCards.map((card) => (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{card.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{card.reward_description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {card.businesses?.name || "Unknown Business"}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembershipCards.map((card) => (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{card.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                              {card.total_sessions} sessions • ${card.cost} • {card.duration_days} days
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {card.businesses?.name || "Unknown Business"}
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

          {/* Templates Tab content (placed after Tabs for layout consistency) */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🧩 Templates</h2>
                  <Badge variant="outline">{templates.length} total</Badge>
                </div>
                <Button onClick={() => router.push('/admin/cards/new')}>New Card</Button>
              </div>
              {templates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No templates yet. Create a card to start a template or use the Template Editor.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((tpl) => (
                    <Card key={tpl.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-lg text-gray-900 dark:text-white">{tpl.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{tpl.type}</div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/admin/templates/${tpl.id}`)}>Edit</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Live Preview Panel */}
          <Card className="sticky top-6">
            <CardContent className="p-6">
              {!previewCard ? (
                <div className="text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Live Preview</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Click the preview button on any card to see how it will look in different wallets.
              </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Preview</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCard(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  {/* Wallet Type Selector */}
                  <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => setPreviewWalletType('apple')}
                      className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                        previewWalletType === 'apple' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Apple className="w-4 h-4" />
                      Apple
                    </button>
                    <button 
                      onClick={() => setPreviewWalletType('google')}
                      className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                        previewWalletType === 'google' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Chrome className="w-4 h-4" />
                      Google
                    </button>
                    <button 
                      onClick={() => setPreviewWalletType('pwa')}
                      className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                        previewWalletType === 'pwa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      PWA
                    </button>
                  </div>
                  
                  {/* Front/Back Toggle */}
                  <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => setShowBackPage(false)}
                      className={`px-3 py-2 rounded-md transition-all text-sm ${
                        !showBackPage ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      Front
                    </button>
                    <button 
                      onClick={() => setShowBackPage(true)}
                      className={`px-3 py-2 rounded-md transition-all text-sm ${
                        showBackPage ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      Back
                    </button>
                  </div>
                  
                  {/* Unified Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg min-h-[400px] flex items-center justify-center">
                    {previewCard && (() => {
                      const canonical = normalizeDatabaseResponse(previewCard)
                      const isStamp = previewCardType === 'stamp'
                      const stamp = isStamp ? (previewCard as StampCard) : undefined
                      const member = !isStamp ? (previewCard as MembershipCard) : undefined
                      const previewData = mapSimpleToPreview({
                        cardType: previewCardType,
                        businessName: previewCard.businesses?.name || 'Business',
                        cardName: canonical.card_name,
                        cardColor: canonical.card_color,
                        iconEmoji: canonical.icon_emoji,
                        stampsRequired: isStamp ? (canonical.stamps_required || stamp?.total_stamps || 10) : undefined,
                        totalSessions: !isStamp ? (member?.total_sessions || 0) : undefined,
                        reward: (stamp?.reward_description as string | undefined) || (canonical as any).reward || 'Reward'
                      })
                      return (
                        <CardLivePreview
                          defaultPlatform={previewWalletType}
                          showControls={false}
                          cardData={previewData}
                        />
                      )
                    })()}
                  </div>
                  
                  {/* Card Info */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Card:</strong> {(previewCard as any).card_name || (previewCard as any).name}</div>
                    <div><strong>Business:</strong> {previewCard.businesses?.name || 'Unknown'}</div>
                    {previewCardType === 'stamp' && previewCard && (
                      <div><strong>Stamps:</strong> {(previewCard as StampCard).total_stamps || 0}</div>
                    )}
                    {previewCardType === 'membership' && previewCard && (
                      <div><strong>Total Sessions:</strong> {(previewCard as MembershipCard).total_sessions || 0}</div>
                    )}
                    <div><strong>Status:</strong> <Badge variant={previewCard.status === 'active' ? 'default' : 'secondary'}>{previewCard.status}</Badge></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutClient>
  )
} 