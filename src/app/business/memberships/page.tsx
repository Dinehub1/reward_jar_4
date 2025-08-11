'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import BusinessLayout from '@/components/layouts/BusinessLayout'
import ManagerModeToggle from '@/components/business/ManagerModeToggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  DollarSign,
  QrCode,
  BarChart3,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Building
} from 'lucide-react'

// Interfaces
interface MembershipCard {
  id: string
  name: string
  total_sessions: number
  cost: number
  customer_count: number
  active_memberships: number
  revenue: number
  created_at: string
  status: 'active' | 'inactive'
}

interface ManagerPermissions {
  add_stamps: boolean
  redeem_rewards: boolean
  view_analytics: boolean
  generate_qr: boolean
  view_customer_data: boolean
}

export default function MembershipsPage() {
  const [membershipCards, setMembershipCards] = useState<MembershipCard[]>([])
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

  const router = useRouter()


  // Fetch membership cards data
  const fetchMembershipCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use MCP-powered API route to get business profile and membership cards
      const [profileResponse, membershipResponse] = await Promise.all([
        fetch('/api/business/profile', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch('/api/business/memberships', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ])

      // Handle profile response
      if (!profileResponse.ok) {
        router.push('/auth/login')
        return
      }

      const profileResult = await profileResponse.json()
      if (!profileResult.success) {
        setError(profileResult.error || 'Failed to load business profile')
        return
      }

      const business = profileResult.data
      setBusiness(business)

      // Handle membership cards response
      if (!membershipResponse.ok) {
        throw new Error(`Failed to fetch membership cards: ${membershipResponse.status}`)
      }

      const membershipResult = await membershipResponse.json()
      if (!membershipResult.success) {
        throw new Error(membershipResult.error || 'Failed to load membership cards')
      }

      const membershipCardsData = membershipResult.data

      // Get customer counts for each membership card (simplified for now)
      const cardsWithStats = await Promise.all(
        (membershipCardsData || []).map(async (card: any) => {
          // Get customer count for this membership card
          // MCP Integration: Customer count fetched via API route
          // TODO: Implement via API call
          const customerCount = 0

          // Mock additional stats (would come from MCP query in production)
          return {
            ...card,
            customer_count: customerCount || 0,
            active_memberships: Math.floor((customerCount || 0) * 0.8), // 80% active rate
            revenue: (customerCount || 0) * card.cost
          }
        })
      )

      setMembershipCards(cardsWithStats)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load membership cards')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchMembershipCards()
  }, [fetchMembershipCards])

  // TODO: Setup real-time updates via MCP WebSocket
  // useEffect(() => {
  //   const subscription = supabase
  //     .channel('membership_cards_changes')
  //     .on('postgres_changes', 
  //       { event: '*', schema: 'public', table: 'membership_cards' },
  //       () => fetchMembershipCards()
  //     )
  //     .subscribe()

  //   return () => subscription.unsubscribe()
  // }, [fetchMembershipCards])

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

  const generateQRCode = (cardId: string) => {
    // TODO: Implement QR code generation
    // This would typically open a modal or navigate to QR generation page
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="max-w-7xl mx-auto space-y-6">
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

  return (
    <BusinessLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 overflow-hidden">
        {/* Header */}
        <div className="space-y-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
              <Building className="w-5 md:w-6 h-5 md:h-6 mr-2 text-indigo-600 flex-shrink-0" />
              <span className="truncate">Membership Cards</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Manage your membership programs and track customer sessions
            </p>
          </div>
          
          {/* Admin-Managed Cards Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-blue-700">
                <p className="font-medium">Cards are created and managed by RewardJar Admins.</p>
                <p className="text-sm mt-1">Contact support or use the Request link to ask for a new membership card.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Manager Mode Toggle */}
          <div className="flex justify-end">
            <ManagerModeToggle
              userId={session?.user?.id || ''}
              businessId={business?.id}
              onToggle={handleManagerToggle}
              className="w-full lg:w-auto lg:justify-end"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchMembershipCards}
                  className="ml-auto"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && membershipCards.length === 0 && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="pt-6">
              <div className="text-center">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No membership cards</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contact support to request your first membership card. Our admin team will help you set up your membership program.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Membership Cards Grid */}
        {membershipCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {membershipCards.map((card) => (
              <Card key={card.id} className="border-indigo-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                      {card.name}
                    </CardTitle>
                    <Badge 
                      variant={card.status === 'active' ? 'default' : 'secondary'}
                      className={card.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {card.status === 'active' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {card.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    Created {formatDate(card.created_at)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">{card.total_sessions}</div>
                      <div className="text-xs text-indigo-700">Sessions</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(card.cost)}</div>
                      <div className="text-xs text-green-700">Cost</div>
                    </div>
                  </div>

                  {/* Customer Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Total Customers
                      </span>
                      <span className="font-medium">{card.customer_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active Memberships
                      </span>
                      <span className="font-medium text-green-600">{card.active_memberships}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Total Revenue
                      </span>
                      <span className="font-medium text-indigo-600">{formatCurrency(card.revenue)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/business/memberships/${card.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                    
                    {managerPermissions.generate_qr && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateQRCode(card.id)}
                        className="flex-1"
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                    )}
                    
                    {managerPermissions.view_analytics && (
                      <Link href={`/business/analytics?card=${card.id}&type=membership`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Analytics
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {membershipCards.length > 0 && (
          <Card className="border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-indigo-700">
                Membership Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {membershipCards.length}
                  </div>
                  <div className="text-sm text-indigo-700">Total Programs</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {membershipCards.reduce((sum, card) => sum + card.customer_count, 0)}
                  </div>
                  <div className="text-sm text-green-700">Total Customers</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {membershipCards.reduce((sum, card) => sum + card.active_memberships, 0)}
                  </div>
                  <div className="text-sm text-blue-700">Active Memberships</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(membershipCards.reduce((sum, card) => sum + card.revenue, 0))}
                  </div>
                  <div className="text-sm text-purple-700">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BusinessLayout>
  )
} 