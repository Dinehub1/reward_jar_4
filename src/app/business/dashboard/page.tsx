'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, CreditCard, Users, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'

interface DashboardStats {
  totalStampCards: number
  totalCustomers: number
  activeCards: number
}

interface DashboardError {
  message: string
  details?: string
}

export default function BusinessDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<DashboardError | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/auth/login')
          return
        }
        
        if (!session?.user) {
          console.log('No authenticated user, redirecting to login')
          router.push('/auth/login')
          return
        }

        console.log('Dashboard: Authenticated user:', session.user.email)
        setUser(session.user)
        setIsAuthenticated(true)
        
        // Now fetch dashboard data
        await fetchDashboardData(session.user.id)
        
      } catch (err) {
        console.error('Authentication check failed:', err)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  const fetchDashboardData = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Get user role to ensure they're a business user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', userId)
        .single()

      if (userError) {
        throw new Error(`User lookup error: ${userError.message}`)
      }

      if (!userData || userData.role_id !== 2) {
        throw new Error('User does not have business permissions')
      }

      console.log('Dashboard: User has business role')

      // Get business info
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('name')
        .eq('owner_id', userId)
        .single()

      if (businessError) {
        console.warn('Dashboard: Business lookup error:', businessError.message)
        // Don't throw here - user might not have completed business setup
        setBusinessName('Your Business')
      } else if (business) {
        setBusinessName(business.name)
        console.log('Dashboard: Business found:', business.name)
      }

      // Get business ID for stamp cards query
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (!businessData) {
        console.log('Dashboard: No business data found, showing empty state')
        setStats({
          totalStampCards: 0,
          totalCustomers: 0,
          activeCards: 0
        })
        return
      }

      // Get stamp cards count
      const { data: stampCards, count: stampCardsCount, error: cardsError } = await supabase
        .from('stamp_cards')
        .select('id', { count: 'exact' })
        .eq('business_id', businessData.id)
        .eq('status', 'active')

      if (cardsError) {
        console.warn('Dashboard: Stamp cards error:', cardsError.message)
      }

      console.log('Dashboard: Found stamp cards:', stampCardsCount)

      // Get total customers (unique customers across all business's cards)
      let customersCount = 0
      let activeCardsSet = new Set()

      if (stampCards && stampCards.length > 0) {
        const { data: customerCards, count: customersTotal, error: customersError } = await supabase
          .from('customer_cards')
          .select('customer_id, stamp_card_id', { count: 'exact' })
          .in('stamp_card_id', stampCards.map(card => card.id))

        if (customersError) {
          console.warn('Dashboard: Customer cards error:', customersError.message)
        } else {
          customersCount = customersTotal || 0
          activeCardsSet = new Set(customerCards?.map(cc => cc.stamp_card_id))
          console.log('Dashboard: Found customers:', customersCount)
        }
      }

      setStats({
        totalStampCards: stampCardsCount || 0,
        totalCustomers: customersCount,
        activeCards: activeCardsSet.size
      })

      console.log('Dashboard: Stats updated successfully')
    } catch (error) {
      console.error('Dashboard: Error fetching data:', error)
      setError({
        message: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const [businessName, setBusinessName] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
  }

  // Show loading while checking authentication
  if (!isAuthenticated && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <div className="text-lg font-medium">Checking authentication...</div>
          <div className="text-sm text-gray-500 mt-1">
            Please wait while we verify your access
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-lg font-medium">Loading dashboard...</div>
            <div className="text-sm text-gray-500 mt-1">
              Fetching your business data
            </div>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  if (error) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md mx-auto border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {error.message}
                </h3>
                {error.details && (
                  <p className="text-sm text-gray-600 mb-4">
                    {error.details}
                  </p>
                )}
                <div className="space-y-2">
                  <Button onClick={handleRetry} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/auth/login'}
                    className="w-full"
                  >
                    Sign In Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <div className="text-2xl font-bold">{stats?.totalStampCards}</div>
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
              <div className="text-2xl font-bold">{stats?.totalCustomers}</div>
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
              <div className="text-2xl font-bold">{stats?.activeCards}</div>
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
        {stats?.totalStampCards === 0 && (
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

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm text-gray-600">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Retry count: {retryCount}</div>
                <div>Business name: {businessName || 'Not set'}</div>
                <div>Stats loaded: {JSON.stringify(stats)}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  )
} 