'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import ManagerModeToggle from '@/components/business/ManagerModeToggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Users, 
  Calendar, 
  DollarSign,
  QrCode,
  BarChart3,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Building,
  Clock,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react'

// Interfaces
interface MembershipCard {
  id: string
  name: string
  total_sessions: number
  cost: number
  customer_count: number
  active_memberships: number
  expired_memberships: number
  revenue: number
  created_at: string
  status: 'active' | 'inactive'
  business_id: string
}

interface CustomerStats {
  total_customers: number
  active_customers: number
  sessions_used: number
  total_sessions: number
  average_utilization: number
  recent_activity: Array<{
    customer_name: string
    sessions_used: number
    last_visit: string
  }>
}

interface ManagerPermissions {
  add_stamps: boolean
  redeem_rewards: boolean
  view_analytics: boolean
  generate_qr: boolean
  view_customer_data: boolean
}

export default function MembershipDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const membershipId = params.id as string

  const [membershipCard, setMembershipCard] = useState<MembershipCard | null>(null)
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [managerMode, setManagerMode] = useState(false)
  const [managerPermissions, setManagerPermissions] = useState<ManagerPermissions>({
    add_stamps: false,
    redeem_rewards: false,
    view_analytics: false,
    generate_qr: false,
    view_customer_data: false
  })
  const [session, setSession] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)

  const supabase = createClient()

  // Fetch membership card details
  const fetchMembershipDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      setSession(session)

      // Get business data
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_id', session.user.id)
        .single()

      if (businessError || !business) {
        setError('Business not found')
        return
      }

      setBusiness(business)

      // TODO: Replace with actual MCP integration
      // const mcpResponse = await fetch('/mcp/query', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tables: ['membership_cards', 'customer_cards'],
      //     query: `
      //       SELECT 
      //         mc.id, mc.name, mc.total_sessions, mc.cost, mc.created_at, mc.status, mc.business_id,
      //         COUNT(DISTINCT cc.customer_id) as customer_count,
      //         COUNT(DISTINCT CASE WHEN cc.expiry_date > NOW() THEN cc.id END) as active_memberships,
      //         COUNT(DISTINCT CASE WHEN cc.expiry_date <= NOW() THEN cc.id END) as expired_memberships,
      //         SUM(CASE WHEN cc.expiry_date > NOW() THEN mc.cost ELSE 0 END) as revenue
      //       FROM membership_cards mc
      //       LEFT JOIN customer_cards cc ON mc.id = cc.stamp_card_id AND cc.membership_type = 'gym'
      //       WHERE mc.id = $1 AND mc.business_id = $2
      //       GROUP BY mc.id, mc.name, mc.total_sessions, mc.cost, mc.created_at, mc.status, mc.business_id
      //     `,
      //     params: [membershipId, business.id]
      //   })
      // })

      // Get membership card using Supabase for now
      const { data: membershipData, error: membershipError } = await supabase
        .from('membership_cards')
        .select('*')
        .eq('id', membershipId)
        .eq('business_id', business.id)
        .single()

      if (membershipError || !membershipData) {
        // Card not found or doesn't belong to this business
        notFound()
        return
      }

      // Get customer stats for this membership card
      const { count: customerCount } = await supabase
        .from('customer_cards')
        .select('customer_id', { count: 'exact' })
        .eq('stamp_card_id', membershipId)
        .eq('membership_type', 'gym')

      // Mock additional stats (would come from MCP query in production)
      const cardWithStats: MembershipCard = {
        ...membershipData,
        customer_count: customerCount || 0,
        active_memberships: Math.floor((customerCount || 0) * 0.8), // 80% active rate
        expired_memberships: Math.floor((customerCount || 0) * 0.2), // 20% expired rate
        revenue: (customerCount || 0) * membershipData.cost
      }

      setMembershipCard(cardWithStats)

      // Mock customer stats (would come from MCP query in production)
      const mockCustomerStats: CustomerStats = {
        total_customers: customerCount || 0,
        active_customers: Math.floor((customerCount || 0) * 0.8),
        sessions_used: Math.floor((customerCount || 0) * membershipData.total_sessions * 0.6),
        total_sessions: (customerCount || 0) * membershipData.total_sessions,
        average_utilization: 60,
        recent_activity: [
          { customer_name: 'John D.', sessions_used: 8, last_visit: '2025-01-20' },
          { customer_name: 'Sarah M.', sessions_used: 12, last_visit: '2025-01-19' },
          { customer_name: 'Mike R.', sessions_used: 5, last_visit: '2025-01-18' }
        ]
      }

      setCustomerStats(mockCustomerStats)

    } catch (err) {
      console.error('Error fetching membership details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load membership details')
    } finally {
      setLoading(false)
    }
  }, [membershipId, supabase, router])

  useEffect(() => {
    fetchMembershipDetails()
  }, [fetchMembershipDetails])

  const handleManagerToggle = (isEnabled: boolean, permissions: ManagerPermissions) => {
    setManagerMode(isEnabled)
    setManagerPermissions(permissions)
  }

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateQRCode = () => {
    // TODO: Implement QR code generation
    console.log('Generate QR code for membership card:', membershipId)
    // This would typically open a modal or navigate to QR generation page
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50'
    if (percentage >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  if (!membershipCard) {
    notFound()
    return null
  }

  return (
    <BusinessLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
            <Link href="/business/memberships">
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Memberships
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
                <Building className="w-5 md:w-6 h-5 md:h-6 mr-2 text-indigo-600" />
                {membershipCard.name}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Membership program details and analytics
              </p>
            </div>
          </div>
          
          {/* Manager Mode Toggle */}
          <div className="flex flex-col space-y-4">
            <ManagerModeToggle
              userId={session?.user?.id || ''}
              businessId={business?.id}
              onToggle={handleManagerToggle}
              className="w-full lg:w-auto"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mb-2 md:mb-0" />
                <span className="text-red-700 flex-1">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchMembershipDetails}
                  className="w-full md:w-auto mt-2 md:mt-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Membership Card Overview */}
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <CardTitle className="text-lg md:text-xl font-semibold text-indigo-900">
                Membership Overview
              </CardTitle>
              <Badge 
                variant={membershipCard.status === 'active' ? 'default' : 'secondary'}
                className={membershipCard.status === 'active' ? 'bg-green-100 text-green-800' : ''}
              >
                {membershipCard.status === 'active' ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {membershipCard.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-indigo-100">
                <div className="text-xl md:text-2xl font-bold text-indigo-600">{membershipCard.total_sessions}</div>
                <div className="text-xs md:text-sm text-indigo-700">Total Sessions</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-green-100">
                <div className="text-xl md:text-2xl font-bold text-green-600">{formatCurrency(membershipCard.cost)}</div>
                <div className="text-xs md:text-sm text-green-700">Cost</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-blue-100">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{membershipCard.customer_count}</div>
                <div className="text-xs md:text-sm text-blue-700">Total Members</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-white rounded-lg border border-purple-100">
                <div className="text-xl md:text-2xl font-bold text-purple-600">{formatCurrency(membershipCard.revenue)}</div>
                <div className="text-xs md:text-sm text-purple-700">Revenue</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm text-gray-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Active Members
                </span>
                <span className="font-medium text-green-600">{membershipCard.active_memberships}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  Expired Members
                </span>
                <span className="font-medium text-orange-600">{membershipCard.expired_memberships}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-sm text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                  Created
                </span>
                <span className="font-medium text-indigo-600">{formatDate(membershipCard.created_at)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 pt-4">
              {!managerMode && (
                <Link href={`/business/memberships/${membershipCard.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Membership
                  </Button>
                </Link>
              )}
              
              {managerPermissions.generate_qr && (
                <Button 
                  variant="outline" 
                  onClick={generateQRCode}
                  className="flex-1"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR
                </Button>
              )}
              
              {managerPermissions.view_analytics && (
                <Link href={`/business/analytics?card=${membershipCard.id}&type=membership`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Statistics */}
        {customerStats && managerPermissions.view_customer_data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Stats */}
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-indigo-700 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Session Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sessions Used</span>
                  <span className="font-medium">{customerStats.sessions_used} / {customerStats.total_sessions}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(customerStats.sessions_used / customerStats.total_sessions) * 100}%` }}
                  ></div>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${getUtilizationColor(customerStats.average_utilization)}`}>
                  <div className="text-lg font-bold">{customerStats.average_utilization}%</div>
                  <div className="text-xs">Average Utilization</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{customerStats.active_customers}</div>
                    <div className="text-xs text-green-700">Active Members</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{customerStats.total_customers}</div>
                    <div className="text-xs text-blue-700">Total Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-indigo-700 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerStats.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{activity.customer_name}</div>
                        <div className="text-sm text-gray-600">{activity.sessions_used} sessions used</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(activity.last_visit)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {customerStats.recent_activity.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Customer activity will appear here once members start using their sessions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Insights */}
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-indigo-700 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  ₩{Math.round(membershipCard.revenue / Math.max(membershipCard.customer_count, 1)).toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Revenue per Member</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {customerStats ? Math.round((customerStats.sessions_used / Math.max(customerStats.total_sessions, 1)) * 100) : 0}%
                </div>
                <div className="text-sm text-blue-700">Session Completion Rate</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((membershipCard.active_memberships / Math.max(membershipCard.customer_count, 1)) * 100)}%
                </div>
                <div className="text-sm text-purple-700">Retention Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
} 