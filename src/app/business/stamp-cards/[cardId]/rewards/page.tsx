'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'
import {
  ArrowLeft, 
  Award, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Search,
  Download,
  Mail,
  Gift
} from 'lucide-react'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  business: {
    name: string
  }
}

interface CompletedReward {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  reward_earned_date: string
  redeemed_at: string | null
  is_redeemed: boolean
}

function LegacyStampCardRewardsPage() {
  const [stampCard, setStampCard] = useState<StampCard | null>(null)
  const [rewards, setRewards] = useState<CompletedReward[]>([])
  const [filteredRewards, setFilteredRewards] = useState<CompletedReward[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'redeemed' | 'pending'>('all')
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const cardId = params.cardId as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        // Verify business ownership and get stamp card details
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .single()

        if (!business) {
          setError('Business not found')
          return
        }

        // Get stamp card details with business name
        const { data: cardData, error: cardError } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            businesses!inner (
              name
            )
          `)
          .eq('id', cardId)
          .eq('business_id', business.id)
          .eq('status', 'active')
          .single()

        if (cardError || !cardData) {
          setError('Stamp card not found or access denied')
          return
        }

        setStampCard({
          ...cardData,
          business: (cardData.businesses as { name: string }[])[0]
        })

        // Get completed rewards for this stamp card
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('rewards')
          .select(`
            id,
            customer_id,
            created_at,
            redeemed_at,
            customers!inner (
              name,
              email
            )
          `)
          .eq('stamp_card_id', cardId)
          .order('created_at', { ascending: false })

        if (rewardsError) {
          setError('Failed to load rewards')
          return
        }

        if (rewardsData) {
          const formattedRewards: CompletedReward[] = rewardsData.map(reward => {
            const customer = (reward.customers as { name: string; email: string }[])[0]
            return {
            id: reward.id,
            customer_id: reward.customer_id,
              customer_name: customer.name,
              customer_email: customer.email,
            reward_earned_date: reward.created_at,
            redeemed_at: reward.redeemed_at,
            is_redeemed: !!reward.redeemed_at
            }
          })

          setRewards(formattedRewards)
          setFilteredRewards(formattedRewards)
        }
      } catch (err) {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cardId, supabase, router])

  // Filter rewards based on search term and status
  useEffect(() => {
    let filtered = rewards

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reward =>
        reward.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus === 'redeemed') {
      filtered = filtered.filter(reward => reward.is_redeemed)
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(reward => !reward.is_redeemed)
    }

    setFilteredRewards(filtered)
  }, [searchTerm, filterStatus, rewards])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const exportRewards = () => {
    if (filteredRewards.length === 0) return

    const csvHeaders = ['Customer Name', 'Email', 'Reward Earned', 'Redemption Status', 'Redeemed Date']
    const csvData = filteredRewards.map(reward => [
      reward.customer_name,
      reward.customer_email,
      formatDate(reward.reward_earned_date),
      reward.is_redeemed ? 'Redeemed' : 'Pending',
      reward.redeemed_at ? formatDate(reward.redeemed_at) : 'N/A'
    ])

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${stampCard?.name || 'stamp-card'}-rewards-${formatDate(new Date().toISOString())}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading rewards...</div>
        </div>
      </BusinessLayout>
    )
  }

  if (error) {
    return (
      <BusinessLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="text-center py-8">
              <div className="text-red-600 mb-4">⚠️</div>
              <h3 className="font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Link href="/business/stamp-cards">
                <Button variant="outline">Back to Stamp Cards</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </BusinessLayout>
    )
  }

  const pendingRewards = rewards.filter(r => !r.is_redeemed).length
  const redeemedRewards = rewards.filter(r => r.is_redeemed).length

  return (
    <BusinessLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/business/stamp-cards">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cards
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {stampCard?.name} - Rewards
            </h1>
            <p className="text-gray-600 mt-1">
              Track completed rewards and redemptions for this stamp card
            </p>
          </div>
        </div>

        {/* Card Info */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900">{stampCard?.name}</p>
                <p className="text-sm text-green-700">
                  Reward: {stampCard?.reward_description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{rewards.length}</div>
                <div className="text-sm text-green-700">Total Rewards Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewards.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{redeemedRewards}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingRewards}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rewards.length > 0 ? Math.round((redeemedRewards / rewards.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All ({rewards.length})
                </Button>
                <Button
                  variant={filterStatus === 'redeemed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('redeemed')}
                >
                  Redeemed ({redeemedRewards})
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                >
                  Pending ({pendingRewards})
                </Button>
              </div>

              <Button onClick={exportRewards} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <div className="mt-2 text-sm text-gray-500">
              Showing {filteredRewards.length} of {rewards.length} rewards
            </div>
          </CardContent>
        </Card>

        {/* Rewards List */}
        {filteredRewards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No rewards found' : 'No rewards earned yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter settings' 
                  : 'Customers need to complete their stamp cards to earn rewards'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link href={`/business/stamp-cards/${cardId}/customers`}>
                  <Button>View Customer Progress</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{reward.customer_name}</h3>
                          <Badge 
                            className={
                              reward.is_redeemed 
                                ? "bg-green-100 text-green-800 border-green-300" 
                                : "bg-orange-100 text-orange-800 border-orange-300"
                            }
                          >
                            {reward.is_redeemed ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Redeemed
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{reward.customer_email}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Earned: {formatDate(reward.reward_earned_date)}</span>
                          </div>
                          {reward.redeemed_at && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Redeemed: {formatDate(reward.redeemed_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reward Info */}
                      <div className="text-right min-w-[200px]">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Reward</p>
                          <p className="text-sm text-gray-900">{stampCard?.reward_description}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <Link href={`/business/stamp-cards/${cardId}/customers/${reward.customer_id}`}>
                          <Button variant="outline" size="sm">
                            View Customer
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/business/stamp-cards/${cardId}/customers`}>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  View All Customers
                </Button>
              </Link>
              <Link href="/business/stamp-cards">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Cards
                </Button>
              </Link>
              <Link href="/business/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
} 
export default function StampCardRewardsPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Card Rewards Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the card rewards</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyStampCardRewardsPage />
      </div>
    </ComponentErrorBoundary>
  )
}