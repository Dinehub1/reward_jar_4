'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CreditCard, Users, TrendingUp } from 'lucide-react'

interface DashboardStats {
  totalStampCards: number
  totalCustomers: number
  activeCards: number
}

export default function BusinessDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStampCards: 0,
    totalCustomers: 0,
    activeCards: 0
  })
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Get business info
        const { data: business } = await supabase
          .from('businesses')
          .select('name')
          .eq('owner_id', session.user.id)
          .single()

        if (business) {
          setBusinessName(business.name)
        }

        // Get stamp cards count
        const { data: stampCards, count: stampCardsCount } = await supabase
          .from('stamp_cards')
          .select('id', { count: 'exact' })
          .eq('status', 'active')

        // Get total customers (unique customers across all business's cards)
        const { data: customerCards, count: customersCount } = await supabase
          .from('customer_cards')
          .select('customer_id', { count: 'exact' })
          .in('stamp_card_id', stampCards?.map(card => card.id) || [])

        // Get active cards (cards with at least one customer)
        const activeCardsSet = new Set(customerCards?.map(cc => cc.stamp_card_id))

        setStats({
          totalStampCards: stampCardsCount || 0,
          totalCustomers: customersCount || 0,
          activeCards: activeCardsSet.size
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase])

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back{businessName && `, ${businessName}`}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here&apos;s how your loyalty program is performing
            </p>
          </div>
          <Link href="/business/stamp-cards/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Card
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stamp Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStampCards}</div>
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
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Customers enrolled in your programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCards}</div>
              <p className="text-xs text-muted-foreground">
                Cards with enrolled customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/business/stamp-cards/new">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Stamp Card
                </Button>
              </Link>
              <Link href="/business/stamp-cards">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Stamp Cards
                </Button>
              </Link>
              <Link href="/business/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        {stats.totalStampCards === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                Welcome to RewardJar! Create your first stamp card to start building customer loyalty.
              </p>
              <Link href="/business/stamp-cards/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Stamp Card
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  )
} 