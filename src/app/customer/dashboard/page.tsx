'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CustomerLayout from '@/components/layouts/CustomerLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Trophy, Star, ArrowRight, Gift } from 'lucide-react'
import Link from 'next/link'

interface CustomerCard {
  id: string
  current_stamps: number
  created_at: string
  stamp_card: {
    id: string
    name: string
    total_stamps: number
    reward_description: string
    business: {
      name: string
    }
  }
}

function CustomerDashboard() {
  const [customerCards, setCustomerCards] = useState<CustomerCard[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCards: 0,
    completedCards: 0,
    totalStamps: 0
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchCustomerCards = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Get customer ID first
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (!customer) return

        // Fetch customer cards with stamp card details
        const { data: cards } = await supabase
          .from('customer_cards')
          .select(`
            id,
            current_stamps,
            created_at,
            stamp_cards!inner (
              id,
              name,
              total_stamps,
              reward_description,
              businesses!inner (
                name
              )
            )
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })

        if (cards && Array.isArray(cards)) {
          const formattedCards = cards.map(card => {
            // ✅ FIXED: Safe data processing with null checks
            const stampCard = card.stamp_cards?.[0] || {}
            const business = stampCard.businesses?.[0] || {}
            
            return {
              ...card,
              stamp_card: {
                id: stampCard.id || '',
                name: stampCard.name || 'Unknown Card',
                total_stamps: stampCard.total_stamps || 0,
                reward_description: stampCard.reward_description || '',
                business: {
                  name: business.name || 'Unknown Business'
                }
              }
            }
          }).filter(card => card.stamp_card.id) // Filter out invalid cards

          setCustomerCards(formattedCards)

          // Calculate stats
          const totalCards = formattedCards.length
          const completedCards = formattedCards.filter(
            card => card.current_stamps >= card.stamp_card.total_stamps
          ).length
          const totalStamps = formattedCards.reduce(
            (sum, card) => sum + card.current_stamps, 0
          )

          setStats({
            totalCards,
            completedCards,
            totalStamps
          })
        }
      } catch (error) {
        // ✅ FIXED: Set empty state instead of letting error propagate to render
        setCustomerCards([])
        setStats({
          totalCards: 0,
          completedCards: 0,
          totalStamps: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerCards()
  }, [supabase])

  const calculateProgress = (currentStamps: number, totalStamps: number) => {
    return Math.min((currentStamps / totalStamps) * 100, 100)
  }

  const isCompleted = (currentStamps: number, totalStamps: number) => {
    return currentStamps >= totalStamps
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading your cards...</div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Cards</h1>
          <p className="text-gray-600">
            Collect stamps and earn rewards from your favorite businesses
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cards</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCards}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedCards}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Stamps</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStamps}</p>
                </div>
                <Star className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Grid */}
        {customerCards.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customerCards.map((customerCard) => {
                const progress = calculateProgress(
                  customerCard.current_stamps,
                  customerCard.stamp_card.total_stamps
                )
                const completed = isCompleted(
                  customerCard.current_stamps,
                  customerCard.stamp_card.total_stamps
                )
                const stampsRemaining = Math.max(
                  customerCard.stamp_card.total_stamps - customerCard.current_stamps,
                  0
                )

                return (
                  <Card 
                    key={customerCard.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">
                            {customerCard.stamp_card.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {customerCard.stamp_card.business.name}
                          </CardDescription>
                        </div>
                        {completed && (
                          <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progress</span>
                          <span>
                            {customerCard.current_stamps}/{customerCard.stamp_card.total_stamps} stamps
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              completed ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between text-sm">
                        {completed ? (
                          <div className="flex items-center text-yellow-600">
                            <Gift className="w-4 h-4 mr-1" />
                            <span className="font-medium">Reward Ready!</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-600">
                            <Star className="w-4 h-4 mr-1" />
                            <span>{stampsRemaining} more needed</span>
                          </div>
                        )}
                        <span className="font-bold text-gray-900">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      {/* Reward Preview */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          <strong>Reward:</strong> {customerCard.stamp_card.reward_description}
                        </p>
                      </div>

                      {/* View Card Button */}
                      <Link href={`/customer/card/${customerCard.stamp_card.id}`}>
                        <Button variant="outline" className="w-full">
                          View Card
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          /* Empty State */
          <Card className="text-center py-12">
            <CardContent>
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cards Yet</h3>
              <p className="text-gray-600 mb-6">
                Start collecting stamps by scanning QR codes at participating businesses
              </p>
              <div className="max-w-md mx-auto space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">How to Get Started:</h4>
                  <ol className="text-sm text-green-800 space-y-1 text-left">
                    <li>1. Visit a business with RewardJar</li>
                    <li>2. Scan their QR code</li>
                    <li>3. Join their loyalty program</li>
                    <li>4. Start collecting stamps!</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  )
}

export default CustomerDashboard 