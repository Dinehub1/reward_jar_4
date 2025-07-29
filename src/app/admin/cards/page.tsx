'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface CardData {
  id: string
  name: string
  type: 'stamp' | 'membership'
  business_name: string
  business_id: string
  created_at: string
  total_stamps?: number
  total_sessions?: number
  reward_description?: string
  status: string
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cardTypeFilter, setCardTypeFilter] = useState('all')
  const [metrics, setMetrics] = useState({
    totalCards: 0,
    stampCards: 0,
    membershipCards: 0,
    totalCustomers: 0
  })

  useEffect(() => {
    fetchCardsData()
  }, [])

  const fetchCardsData = async () => {
    try {
      setLoading(true)
      console.log('🎴 CARDS PAGE - Fetching cards data...')
      
      // Fetch from our comprehensive admin API
      const response = await fetch('/api/admin/panel-data')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch cards data')
      }

      console.log('📊 CARDS PAGE - Received data:', {
        stampCards: data.data.stampCards?.length || 0,
        membershipCards: data.data.membershipCards?.length || 0,
        metrics: data.metrics
      })

      // Combine stamp cards and membership cards into unified format
      const allCards: CardData[] = [
        ...(data.data.stampCards || []).map((card: any) => ({
          id: card.id,
          name: card.name,
          type: 'stamp' as const,
          business_name: card.businesses?.name || 'Unknown Business',
          business_id: card.business_id,
          created_at: card.created_at,
          total_stamps: card.total_stamps,
          reward_description: card.reward_description,
          status: card.status || 'active'
        })),
        ...(data.data.membershipCards || []).map((card: any) => ({
          id: card.id,
          name: card.name,
          type: 'membership' as const,
          business_name: card.businesses?.name || 'Unknown Business',
          business_id: card.business_id,
          created_at: card.created_at,
          total_sessions: card.total_sessions,
          status: card.status || 'active'
        }))
      ]

      console.log('✅ CARDS PAGE - Processed cards:', allCards.length)

      setCards(allCards)
      setMetrics({
        totalCards: allCards.length,
        stampCards: data.data.stampCards?.length || 0,
        membershipCards: data.data.membershipCards?.length || 0,
        totalCustomers: data.metrics.totalCustomers || 0
      })
      setError(null)
    } catch (err) {
      console.error('💥 CARDS PAGE - Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch cards data')
    } finally {
      setLoading(false)
    }
  }

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.business_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = cardTypeFilter === 'all' || card.type === cardTypeFilter
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Card Management</h1>
              <p className="text-muted-foreground">Manage all loyalty and membership cards</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-semibold mb-2">Loading cards...</h3>
              <p className="text-muted-foreground">Fetching card data from database</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Card Management</h1>
              <p className="text-muted-foreground">Manage all loyalty and membership cards</p>
            </div>
          </div>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Cards</h3>
              <p className="text-muted-foreground text-center mb-4">{error}</p>
              <Button onClick={fetchCardsData} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Card Management</h1>
            <p className="text-muted-foreground">Manage all loyalty and membership cards</p>
          </div>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/admin/cards/stamp/new">
                <span className="mr-2">🎯</span>
                New Stamp Card
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cards/membership/new">
                <span className="mr-2">🎗️</span>
                New Membership Card
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <span className="text-2xl">🎴</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.totalCards}</div>
              <p className="text-xs text-muted-foreground">All card templates</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stamp Cards</CardTitle>
              <span className="text-2xl">🎯</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.stampCards}</div>
              <p className="text-xs text-muted-foreground">Loyalty stamp cards</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membership Cards</CardTitle>
              <span className="text-2xl">🎗️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.membershipCards}</div>
              <p className="text-xs text-muted-foreground">Premium memberships</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <span className="text-2xl">👥</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metrics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search cards or businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm dark:bg-gray-800 dark:border-gray-700"
          />
          <Tabs value={cardTypeFilter} onValueChange={setCardTypeFilter} className="w-full sm:w-auto">
            <TabsList className="dark:bg-gray-800">
              <TabsTrigger value="all">All Cards</TabsTrigger>
              <TabsTrigger value="stamp">Stamp Cards</TabsTrigger>
              <TabsTrigger value="membership">Membership Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Cards List */}
        {filteredCards.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No cards found</h3>
              <p className="text-muted-foreground text-center">
                {cards.length === 0 
                  ? "No cards have been created yet." 
                  : "No cards match your current filters."}
              </p>
              {cards.length === 0 && (
                <div className="mt-4 flex space-x-2">
                  <Button asChild>
                    <Link href="/admin/cards/stamp/new">Create Stamp Card</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/admin/cards/membership/new">Create Membership Card</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCards.map((card) => (
              <Card key={card.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {card.type === 'stamp' ? '🎯' : '🎗️'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {card.business_name}
                      </p>
                      {card.type === 'stamp' && card.total_stamps && (
                        <p className="text-xs text-muted-foreground">
                          {card.total_stamps} stamps required • {card.reward_description}
                        </p>
                      )}
                      {card.type === 'membership' && card.total_sessions && (
                        <p className="text-xs text-muted-foreground">
                          {card.total_sessions} sessions included
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                      {card.status}
                    </Badge>
                    <Badge variant="outline">
                      {new Date(card.created_at).toLocaleDateString()}
                    </Badge>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/cards/${card.type}/${card.id}`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Summary</span>
            </CardTitle>
            <CardDescription>Card management overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredCards.length}</div>
                <p className="text-sm text-muted-foreground">Showing cards</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredCards.filter(c => c.type === 'stamp').length}
                </div>
                <p className="text-sm text-muted-foreground">Stamp cards</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredCards.filter(c => c.type === 'membership').length}
                </div>
                <p className="text-sm text-muted-foreground">Membership cards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 