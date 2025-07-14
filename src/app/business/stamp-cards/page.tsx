'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Target, Calendar, QrCode } from 'lucide-react'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: string
  created_at: string
  customer_count?: number
}

export default function StampCardsPage() {
  const [stampCards, setStampCards] = useState<StampCard[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStampCards = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Get business ID
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .single()

        if (!business) return

        // Get stamp cards with customer counts
        const { data: cards } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            status,
            created_at
          `)
          .eq('business_id', business.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (cards) {
          // Get customer counts for each card
          const cardsWithCounts = await Promise.all(
            cards.map(async (card) => {
              const { count } = await supabase
                .from('customer_cards')
                .select('*', { count: 'exact', head: true })
                .eq('stamp_card_id', card.id)

              return {
                ...card,
                customer_count: count || 0
              }
            })
          )

          setStampCards(cardsWithCounts)
        }
      } catch (error) {
        console.error('Error fetching stamp cards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStampCards()
  }, [supabase])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading stamp cards...</div>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stamp Cards</h1>
            <p className="text-gray-600 mt-2">
              Manage your loyalty programs and track customer engagement
            </p>
          </div>
          <Link href="/business/stamp-cards/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Card
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stampCards.length}</div>
              <p className="text-xs text-muted-foreground">
                Active loyalty programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stampCards.reduce((sum, card) => sum + (card.customer_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Customers enrolled across all cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...stampCards.map(card => card.customer_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest customer enrollment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stamp Cards Grid */}
        {stampCards.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stamp cards yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create your first loyalty program to start engaging customers and driving repeat business.
              </p>
              <Link href="/business/stamp-cards/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Card
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stampCards.map((card) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {card.total_stamps} stamps required
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {card.customer_count || 0}
                      </div>
                      <div className="text-xs text-gray-500">customers</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stamp Progress Visual */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(card.total_stamps, 10) }, (_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-blue-200 bg-blue-50"
                        />
                      ))}
                      {card.total_stamps > 10 && (
                        <span className="text-sm text-gray-500 ml-2">
                          +{card.total_stamps - 10} more
                        </span>
                      )}
                    </div>

                    {/* Reward Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Reward:</h4>
                      <p className="text-sm text-gray-600">{card.reward_description}</p>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      Created {formatDate(card.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <QrCode className="w-3 h-3 mr-1" />
                        QR Code
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Users className="w-3 h-3 mr-1" />
                        View Customers
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {stampCards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/business/stamp-cards/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Card
                  </Button>
                </Link>
                <Link href="/business/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/business/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Dashboard Overview
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  )
} 