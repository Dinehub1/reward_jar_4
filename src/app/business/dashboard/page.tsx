'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-admin-auth'
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
  Star,
  Trophy,
  ArrowUpRight,
  QrCode,
  BarChart3,
  Settings,
  Bell,
  DollarSign,
  Activity,
  UserCheck,
  CheckCircle,
  X,
  Loader2,
  Eye,
  Edit
} from 'lucide-react'
import ManagerModeToggle from '@/components/business/ManagerModeToggle'
import { QRScanner } from '@/components/business/QRScanner'

// Import card templates from admin section for consistency
const CARD_TEMPLATES = [
  {
    id: 'coffee-shop',
    name: 'Coffee Shop',
    description: 'Perfect for cafes and coffee shops',
    cardColor: '#8B4513',
    iconEmoji: '☕',
    stampsRequired: 10,
    reward: 'Free Coffee',
    rewardDescription: 'Free coffee of your choice',
    category: 'Food & Beverage'
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Great for restaurants and food services',
    cardColor: '#FF6347',
    iconEmoji: '🍕',
    stampsRequired: 8,
    reward: 'Free Meal',
    rewardDescription: 'Free main course meal',
    category: 'Food & Beverage'
  },
  {
    id: 'salon-spa',
    name: 'Salon & Spa',
    description: 'Ideal for beauty and wellness services',
    cardColor: '#FF69B4',
    iconEmoji: '💅',
    stampsRequired: 6,
    reward: 'Free Service',
    rewardDescription: 'Free haircut or basic facial',
    category: 'Beauty & Wellness'
  },
  {
    id: 'retail-store',
    name: 'Retail Store',
    description: 'Perfect for retail and shopping',
    cardColor: '#32CD32',
    iconEmoji: '🛍️',
    stampsRequired: 12,
    reward: '20% Discount',
    rewardDescription: '20% off your next purchase',
    category: 'Retail'
  },
  {
    id: 'fitness-gym',
    name: 'Fitness & Gym',
    description: 'Great for gyms and fitness centers',
    cardColor: '#FF4500',
    iconEmoji: '🏋️',
    stampsRequired: 15,
    reward: 'Free Session',
    rewardDescription: 'Free personal training session',
    category: 'Fitness'
  }
]

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
  status?: string
  card_color?: string
  icon_emoji?: string
}

interface RecentActivity {
  id: string
  type: 'stamp' | 'session' | 'reward' | 'membership'
  amount?: number
  description: string
  time: string
  customer_name: string
}

interface SubscriptionStatus {
  status: 'active' | 'inactive' | 'expired'
  plan?: string
  expiry_date: string
  amount_due?: number
}

function BusinessDashboardContent() {
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

  const [session, setSession] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [canCreateCards, setCanCreateCards] = useState(false) // Enforced: Business users cannot create cards
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { user, isLoading: authLoading } = useAuth()

  // Check for success message from onboarding
  useEffect(() => {
    const success = searchParams.get('success')
    if (success === 'business_created') {
      setShowSuccessMessage(true)
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [searchParams])

  // Hydration-safe auth guard: wait for client auth to load before redirecting
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        if (authLoading) return
        if (!user) {
          // no user after hydration -> redirect
          router.push('/auth/login')
          return
        }
        // Verify business role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', user.id)
          .single()
        if (userError || !userData || userData.role_id !== 2) {
          router.push('/auth/login?error=unauthorized')
          return
        }
        // Fetch data
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        await fetchDashboardData(user.id)
      } catch (err) {
        setError('Authentication failed. Please try logging in again.')
        setTimeout(() => router.push('/auth/login'), 1200)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [authLoading, user, router, supabase])

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

      if (businessError && businessError.code !== 'PGRST116') {
        setError('Failed to load business data')
        return
      }

      setBusiness(business)

      // Calculate profile progress
      const calculateProgress = (business: any) => {
        if (!business) return 0
        let progress = 20 // Base progress for having an account
        if (business?.name) progress += 20
        if (business?.contact_email) progress += 20
        if (business?.location) progress += 20
        if (business?.description) progress += 15
        if (business?.logo_url) progress += 5
        return Math.min(progress, 100)
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
        // Set empty stats but don't show error - business might not be fully set up yet
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
        setRecentCards([])
        setRecentActivity([])
        setLoading(false)
        return
      }

      // Fetch enhanced stats
      const [stampCardsResult, membershipCardsResult, customerCardsResult] = await Promise.all([
        supabase
        .from('stamp_cards')
          .select('id, name, card_name, created_at, card_color, icon_emoji, status', { count: 'exact' })
          .eq('business_id', business.id)
        .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('membership_cards')
          .select('id, name, created_at, status', { count: 'exact' })
          .eq('business_id', business.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('customer_cards')
          .select('id, customer_id', { count: 'exact' })
          .or(`stamp_card_id.in.(${business.id}),membership_card_id.in.(${business.id})`)
      ])

      // Use seed data for demo purposes when no real data exists
      const seedStats = {
        totalRevenue: 45000,
        stampRevenue: 28000,
        membershipRevenue: 17000,
        recentTransactions: 12
      }

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
        totalCustomers: customerCardsResult.count || 0,
        activeCards: (stampCardsResult.count || 0) + (membershipCardsResult.count || 0),
        recentTransactions: seedStats.recentTransactions,
        totalRevenue: seedStats.totalRevenue,
        stampRevenue: seedStats.stampRevenue,
        membershipRevenue: seedStats.membershipRevenue
      })

      // Set recent cards with proper data mapping
      const allRecentCards: RecentCard[] = [
        ...(stampCardsResult.data?.map(card => ({
          id: card.id,
          name: card.card_name || card.name || 'Untitled Card',
          type: 'stamp' as const,
          customers: Math.floor(Math.random() * 50) + 10,
          created_at: card.created_at,
          status: card.status,
          card_color: card.card_color,
          icon_emoji: card.icon_emoji
        })) || []),
        ...(membershipCardsResult.data?.map(card => ({
          id: card.id,
          name: card.name || 'Untitled Membership',
          type: 'membership' as const,
          customers: Math.floor(Math.random() * 20) + 5,
          created_at: card.created_at,
          status: card.status
        })) || [])
      ]

      setRecentCards(allRecentCards.slice(0, 5))
      setRecentActivity(mockActivity)

      // Mock subscription status
      setSubscription({
        status: 'active',
        plan: 'Business',
        expiry_date: '2025-08-20',
        amount_due: undefined
      })

    } catch (error) {
      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10B981' // green
    if (progress >= 60) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  const getMissingFields = (profile: BusinessProfile) => {
    const missing = []
    if (!profile.name) missing.push('Business Name')
    if (!profile.contact_email) missing.push('Email')
    if (!profile.location) missing.push('Location')
    if (!profile.description) missing.push('Description')
    if (!profile.logo_url) missing.push('Logo')
    return missing
  }

  const handleRefresh = () => {
    if (session?.user?.id) {
      fetchDashboardData(session.user.id)
  }
  }

  // Loading state
  if (loading) {
    return (
      <BusinessLayout>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Loading Dashboard</h3>
              <p className="text-gray-600">Please wait while we fetch your business data...</p>
            </div>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <BusinessLayout>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold mb-2 text-red-800">Error Loading Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
              </div>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Success Message from Onboarding */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Welcome to RewardJar!
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>
                    Your business profile has been created successfully. You can now start creating loyalty cards for your customers.
                  </p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                  <button
                    type="button"
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100"
                    onClick={() => setShowSuccessMessage(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Welcome back{profile?.name && `, ${profile.name}`}!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Here&apos;s how your loyalty program is performing
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            {canCreateCards && (
              <Link href="/business/stamp-cards">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Card
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Profile Progress Bar */}
        {profile && profile.progress < 100 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
                <h3 className="text-sm md:text-base font-semibold text-amber-900">Complete Your Profile</h3>
                <span className="text-sm font-medium text-amber-700">{profile.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 mb-4">
                <div
                  className="h-2 md:h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${profile.progress}%`,
                    backgroundColor: getProgressColor(profile.progress)
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
              <Link href="/business/profile">
                <Button size="sm" className="w-full md:w-auto">
                  Complete Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cards</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeCards || 0}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.totalStampCards || 0} stamp, {stats?.totalMembershipCards || 0} membership
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalCustomers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Active loyalty members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats?.totalRevenue?.toLocaleString() || '0'}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.recentTransactions || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Cards */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Cards</CardTitle>
              <Link href="/business/stamp-cards">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
            </CardHeader>
            <CardContent>
                {recentCards.length > 0 ? (
                  <div className="space-y-4">
                    {recentCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: card.card_color || '#8B4513' }}
                          >
                            {card.icon_emoji || '🎯'}
                        </div>
                        <div>
                            <p className="font-medium">{card.name}</p>
                            <p className="text-sm text-gray-500">
                              {card.type === 'stamp' ? 'Stamp Card' : 'Membership'} • {card.customers} customers
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                            {card.status || 'active'}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                      </div>
                      </div>
                    ))}
                    </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Cards Yet</h3>
                    <p className="text-gray-600 mb-4">Create your first loyalty card to get started</p>
                    <Link href="/business/no-access">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Request New Card (Admin‑Only)
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
              </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business?.id && (
                  <QRScanner 
                    businessId={business.id}
                    onScanSuccess={(result) => {
                      // Refresh dashboard data after successful scan
                      if (user?.id) {
                        fetchDashboardData(user.id)
                      }
                    }}
                    className="w-full justify-start"
                  />
                )}
                <Link href="/business/no-access">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Request New Card (Admin‑Only)
                  </Button>
                </Link>
                <Link href="/business/analytics">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/business/profile">
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Business Settings
                  </Button>
                </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'stamp' ? 'bg-blue-500' :
                          activity.type === 'reward' ? 'bg-green-500' :
                          activity.type === 'membership' ? 'bg-purple-500' : 'bg-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.customer_name} • {activity.time}</p>
                    </div>
                        {activity.amount && (
                          <p className="text-sm font-medium text-green-600">₹{activity.amount.toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Card Templates Section - Show when no cards exist */}
        {stats?.activeCards === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Get Started with Templates</CardTitle>
              <p className="text-sm text-gray-600">Choose from our pre-designed templates to create your first loyalty card</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CARD_TEMPLATES.slice(0, 6).map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">{template.iconEmoji}</div>
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: template.cardColor }}
                      />
                      </div>
                    <h3 className="font-semibold mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      <div>• {template.reward}</div>
                      <div>• {template.stampsRequired} stamps required</div>
                    </div>
                    {canCreateCards && (
                      <Link href={`/business/stamp-cards?template=${template.id}`}>
                        <Button size="sm" className="w-full">
                          Use Template
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Status */}
        {subscription && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
        </div>
                <div>
                    <p className="font-semibold text-blue-900">
                      {subscription.plan || 'Business'} Plan - {subscription.status}
                    </p>
                    <p className="text-sm text-blue-700">
                      {subscription.status === 'active' ? 
                        `Active until ${new Date(subscription.expiry_date).toLocaleDateString()}` :
                        'Plan expired'
                      }
                    </p>
                  </div>
                </div>
                {subscription.amount_due && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Pay ₹{subscription.amount_due}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  )
}

export default function BusinessDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <BusinessDashboardContent />
    </Suspense>
  )
} 