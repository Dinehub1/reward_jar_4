'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Target, 
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react'

interface AnalyticsData {
  totalCards: number
  totalCustomers: number
  totalStamps: number
  completedRewards: number
  recentActivity: {
    date: string
    stamps: number
    newCustomers: number
  }[]
  popularCards: {
    name: string
    customers: number
    completionRate: number
  }[]
}

export default function BusinessAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCards: 0,
    totalCustomers: 0,
    totalStamps: 0,
    completedRewards: 0,
    recentActivity: [],
    popularCards: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnalytics = async () => {
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

        // Get basic stats
        const { data: stampCards } = await supabase
          .from('stamp_cards')
          .select('id')
          .eq('business_id', business.id)
          .eq('status', 'active')

        const { data: customerCards } = await supabase
          .from('customer_cards')
          .select('customer_id, current_stamps, stamp_cards!inner(total_stamps)')
          .in('stamp_card_id', stampCards?.map(card => card.id) || [])

        const { data: rewards } = await supabase
          .from('rewards')
          .select('id')
          .in('stamp_card_id', stampCards?.map(card => card.id) || [])

        // Calculate metrics
        const totalCards = stampCards?.length || 0
        const uniqueCustomers = new Set(customerCards?.map(cc => cc.customer_id) || []).size
        const totalStamps = customerCards?.reduce((sum, cc) => sum + cc.current_stamps, 0) || 0
        const completedRewards = rewards?.length || 0

        // Get popular cards data
        const { data: popularCardsData } = await supabase
          .from('stamp_cards')
          .select(`
            name,
            total_stamps,
            customer_cards(customer_id, current_stamps)
          `)
          .eq('business_id', business.id)
          .eq('status', 'active')

        const popularCards = popularCardsData?.map(card => {
          const customers = card.customer_cards?.length || 0
          const completedCustomers = card.customer_cards?.filter(
            cc => cc.current_stamps >= card.total_stamps
          ).length || 0
          const completionRate = customers > 0 ? (completedCustomers / customers) * 100 : 0

          return {
            name: card.name,
            customers,
            completionRate: Math.round(completionRate)
          }
        }).sort((a, b) => b.customers - a.customers) || []

        setAnalytics({
          totalCards,
          totalCustomers: uniqueCustomers,
          totalStamps,
          completedRewards,
          recentActivity: [], // TODO: Implement recent activity tracking
          popularCards
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [supabase])

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">
            Track your loyalty program performance and customer engagement
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCards}</div>
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
              <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Unique customers enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stamps</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalStamps}</div>
              <p className="text-xs text-muted-foreground">
                Stamps collected by customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.completedRewards}</div>
              <p className="text-xs text-muted-foreground">
                Completed loyalty cards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Popular Cards
              </CardTitle>
              <CardDescription>
                Customer enrollment and completion rates by card
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.popularCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No stamp cards created yet
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.popularCards.slice(0, 5).map((card, _index) => (
                    <div key={card.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{card.name}</p>
                        <p className="text-xs text-gray-500">
                          {card.customers} customers • {card.completionRate}% completion
                        </p>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(card.completionRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Summary
              </CardTitle>
              <CardDescription>
                Overall loyalty program performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">Customer Engagement</p>
                    <p className="text-sm text-green-700">
                      {analytics.totalCustomers > 0 && analytics.totalCards > 0 
                        ? Math.round(analytics.totalCustomers / analytics.totalCards)
                        : 0} avg customers per card
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Stamp Activity</p>
                    <p className="text-sm text-blue-700">
                      {analytics.totalCustomers > 0 
                        ? Math.round(analytics.totalStamps / analytics.totalCustomers)
                        : 0} avg stamps per customer
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-purple-900">Completion Rate</p>
                    <p className="text-sm text-purple-700">
                      {analytics.totalCustomers > 0 
                        ? Math.round((analytics.completedRewards / analytics.totalCustomers) * 100)
                        : 0}% customers earned rewards
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">More Analytics Coming Soon</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We&apos;re working on advanced analytics including customer behavior tracking, 
              time-based reports, and revenue impact analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
} 