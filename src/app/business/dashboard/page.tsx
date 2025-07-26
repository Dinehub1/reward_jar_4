'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown,
  Star,
  Trophy,
  ArrowUpRight,
  QrCode,
  BarChart3,
  Settings,
  Bell,
  DollarSign,
  UserCheck
} from 'lucide-react'
import ManagerModeToggle from '@/components/business/ManagerModeToggle'

// Interfaces
interface DashboardStats {
  totalStampCards: number
  totalMembershipCards: number
  totalCustomers: number
  activeCards: number
  recentTransactions: number
  totalRevenue: number
  stampRevenue: number
  membershipRevenue: number
}

interface BusinessProfile {
  name?: string
  description?: string
  contact_email?: string
  location?: string
  logo_url?: string
  website_url?: string
  progress: number
}

interface RecentCard {
  id: string
  name: string
  type: 'stamp' | 'membership'
  customers: number
  created_at: string
}

interface RecentActivity {
  id: string
  type: 'stamp' | 'session' | 'reward' | 'membership'
  amount?: number
  description: string
  time: string
  customer_name?: string
}

interface SubscriptionStatus {
  status: 'active' | 'due' | 'expired'
  expiry_date: string
  amount_due?: number
}

export default function BusinessDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [recentCards, setRecentCards] = useState<RecentCard[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [managerMode, setManagerMode] = useState(false)
  const [managerPermissions, setManagerPermissions] = useState({
    add_stamps: false,
    redeem_rewards: false,
    view_analytics: false,
    generate_qr: false,
    view_customer_data: false
  })
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)

  const [session, setSession] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          router.push('/auth/login')
          return
        }
        
        // Check business role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', session.user.id)
          .single()

        if (userError || !userData || userData.role_id !== 2) {
          router.push('/auth/login?error=unauthorized')
          return
        }

        setSession(session)
        await fetchDashboardData(session.user.id)
        
      } catch (err) {
        console.error('Authentication check failed:', err)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCreateDropdown) {
        setShowCreateDropdown(false)
      }
    }

    if (showCreateDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showCreateDropdown])

  const fetchDashboardData = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Get business info
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .single()

      if (businessError) {
        console.warn('Business lookup error:', businessError.message)
      }

      setBusiness(business)

      // Calculate profile progress
      const calculateProgress = (business: any) => {
        let progress = 0
        if (business?.name) progress += 20
        if (business?.contact_email) progress += 20
        if (business?.location) progress += 20
        if (business?.description) progress += 20
        if (business?.logo_url) progress += 10
        if (business?.website_url) progress += 10
        return progress
      }

      const profileData = business ? {
        name: business.name,
        description: business.description,
        contact_email: business.contact_email,
        location: business.location,
        logo_url: business.logo_url,
        website_url: business.website_url,
        progress: calculateProgress(business)
      } : { progress: 0 }

      setProfile(profileData)

      if (!business) {
        setStats({
          totalStampCards: 0,
          totalMembershipCards: 0,
          totalCustomers: 0,
          activeCards: 0,
          recentTransactions: 0,
          totalRevenue: 0,
          stampRevenue: 0,
          membershipRevenue: 0
        })
        return
      }

      // Fetch enhanced stats using MCP-style queries
      const [stampCardsResult, membershipCardsResult, customerCardsResult] = await Promise.all([
        supabase
        .from('stamp_cards')
          .select('id, name, created_at', { count: 'exact' })
          .eq('business_id', business.id)
        .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('membership_cards')
          .select('id, name, created_at', { count: 'exact' })
          .eq('business_id', business.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('customer_cards')
          .select(`
            id, 
            membership_type, 
            created_at,
            stamp_card_id,
            customer_id,
            current_stamps,
            sessions_used,
            cost
          `)
          .in('stamp_card_id', [business.id])
      ])

      // Calculate revenue metrics
      const stampRevenue = 280000 // From bill amounts - would use MCP in production
      const membershipRevenue = 450000 // From membership sales
      const totalRevenue = stampRevenue + membershipRevenue

      // Mock recent activity data (would come from session_usage table via MCP)
      const mockActivity: RecentActivity[] = [
        { id: '1', type: 'stamp', amount: 8500, description: 'Coffee purchase', time: '2 hours ago', customer_name: 'John Kim' },
        { id: '2', type: 'session', description: 'Gym session marked', time: '4 hours ago', customer_name: 'Sarah Lee' },
        { id: '3', type: 'reward', description: 'Free coffee redeemed', time: '6 hours ago', customer_name: 'Mike Park' },
        { id: '4', type: 'membership', amount: 15000, description: 'Premium membership purchased', time: '1 day ago', customer_name: 'Lisa Chen' },
        { id: '5', type: 'stamp', amount: 12000, description: 'Restaurant visit', time: '2 days ago', customer_name: 'David Kim' }
      ]

      setStats({
        totalStampCards: stampCardsResult.count || 0,
        totalMembershipCards: membershipCardsResult.count || 0,
        totalCustomers: customerCardsResult.data?.length || 0,
        activeCards: (stampCardsResult.count || 0) + (membershipCardsResult.count || 0),
        recentTransactions: 5,
        totalRevenue,
        stampRevenue,
        membershipRevenue
      })

      // Set recent cards
      const allRecentCards: RecentCard[] = [
        ...(stampCardsResult.data?.map(card => ({
          id: card.id,
          name: card.name,
          type: 'stamp' as const,
          customers: Math.floor(Math.random() * 50) + 10,
          created_at: card.created_at
        })) || []),
        ...(membershipCardsResult.data?.map(card => ({
          id: card.id,
          name: card.name,
          type: 'membership' as const,
          customers: Math.floor(Math.random() * 20) + 5,
          created_at: card.created_at
        })) || [])
      ]

      setRecentCards(allRecentCards.slice(0, 5))
      setRecentActivity(mockActivity)

      // Mock subscription status
      setSubscription({
        status: 'active',
        expiry_date: '2025-08-20',
        amount_due: undefined
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const getProgressColor = (progress: number) => {
    const red = Math.round(255 * (100 - progress) / 100)
    const green = Math.round(255 * progress / 100)
    return `rgb(${red}, ${green}, 0)`
  }

  const getMissingFields = (profile: BusinessProfile | null) => {
    const missing = []
    if (!profile?.name) missing.push('Business name')
    if (!profile?.contact_email) missing.push('Contact email')
    if (!profile?.location) missing.push('Location')
    if (!profile?.description) missing.push('Description')
    if (!profile?.logo_url) missing.push('Logo')
    if (!profile?.website_url) missing.push('Website')
    return missing
  }

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const getRelativeTime = (timeStr: string) => {
    // Simple relative time formatting
    return timeStr
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
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
                  {error}
                </h3>
                <Button onClick={() => window.location.reload()} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              Welcome back{profile?.name && `, ${profile.name}`}!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Here&apos;s how your loyalty program is performing
            </p>
          </div>
          
          {/* Manager Mode Toggle */}
          <div className="w-full lg:w-auto">
            <ManagerModeToggle
              userId={session?.user?.id || ''}
              businessId={business?.id}
              onToggle={(isEnabled, permissions) => {
                setManagerMode(isEnabled)
                setManagerPermissions(permissions)
              }}
              className="w-full lg:w-auto lg:justify-end"
            />
          </div>
        </div>

        {/* Profile Progress Bar */}
        {profile && profile.progress < 100 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
                <h3 className="text-sm md:text-base font-semibold text-green-900">Complete Your Profile</h3>
                <span className="text-sm font-medium text-green-700">{profile.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 mb-4">
                <div
                  className="h-2 md:h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${profile.progress}%`,
                    background: `linear-gradient(90deg, #ff0000 0%, ${getProgressColor(profile.progress)} 100%)`
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1 md:gap-2 mb-4">
                {getMissingFields(profile).map((field, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
              <Link href="/business/onboarding/profile">
                <Button size="sm" className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                  Complete Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Subscription Status */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-900">
                  Active until {subscription?.expiry_date}
                </span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium truncate">Total Cards</CardTitle>
              <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold">{stats?.activeCards}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalStampCards} stamp + {stats?.totalMembershipCards} membership
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
                Enrolled in your programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recentTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Transactions today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Tracked through loyalty
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Journey Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                New Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-2">30</div>
              <p className="text-green-700 text-sm mb-3">New customers this month</p>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                +15% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Repeat Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-2">3x</div>
              <p className="text-green-700 text-sm mb-3">Growth in repeat customers</p>
              <div className="text-sm text-green-600">
                Average: 4.2 stamps per customer
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Revenue Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 mb-2">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <div className="text-sm text-green-700 space-y-1">
                <div>Stamps: {formatCurrency(stats?.stampRevenue || 0)}</div>
                <div>Memberships: {formatCurrency(stats?.membershipRevenue || 0)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Card CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Button
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  disabled={managerMode && !managerPermissions.add_stamps}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Loyalty Card
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                
                {showCreateDropdown && (
                  <div className="absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <Link href="/business/stamp-cards/new" className="block">
                      <div className="p-3 hover:bg-gray-50 border-b">
                        <div className="font-medium text-gray-900">🎫 Stamp Card</div>
                        <div className="text-sm text-gray-500">For repeat customers and rewards</div>
                      </div>
                    </Link>
                    <Link href="/business/memberships/new" className="block">
                      <div className="p-3 hover:bg-gray-50">
                        <div className="font-medium text-gray-900">💳 Membership Card</div>
                        <div className="text-sm text-gray-500">For sessions and premium services</div>
                      </div>
              </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
              <Link href="/business/stamp-cards">
                  <Button variant="outline" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                    Manage Cards
                </Button>
              </Link>
              <Link href="/business/analytics">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
                {!managerMode && (
                  <Link href="/business/profile">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                </Button>
              </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Cards & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCards.length > 0 ? (
                  recentCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">
                          {card.type === 'stamp' ? '🎫' : '💳'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{card.name}</div>
                          <div className="text-sm text-gray-500">
                            {card.customers} customers
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No cards created yet</p>
                    <p className="text-sm">Create your first loyalty card to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'stamp' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      {activity.type === 'session' && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                      {activity.type === 'reward' && <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>}
                      {activity.type === 'membership' && <div className="w-2 h-2 bg-purple-500 rounded-full"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.description}
                        {activity.amount && ` - ${formatCurrency(activity.amount)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.customer_name} • {getRelativeTime(activity.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manager Mode Info */}
        {managerMode && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">Manager Mode Active</div>
                  <div className="text-sm text-yellow-700">
                    You can add stamps, redeem rewards, and view analytics. Card creation and financial data are restricted.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        {stats?.activeCards === 0 && !managerMode && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                Welcome to RewardJar! Create your first loyalty card to start building customer loyalty and driving revenue.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateDropdown(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                Create Your First Card
                </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  )
} 