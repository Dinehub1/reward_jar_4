'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  User, 
  Award,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  Mail,
  Download
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

interface CustomerDetail {
  id: string
  customer_id: string
  name: string
  email: string
  current_stamps: number
  wallet_pass_id: string | null
  joined_date: string
  is_completed: boolean
}

interface StampHistory {
  id: string
  created_at: string
}

interface RewardHistory {
  id: string
  redeemed_at: string | null
  created_at: string
}

export default function CustomerDetailPage() {
  const [stampCard, setStampCard] = useState<StampCard | null>(null)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [stampHistory, setStampHistory] = useState<StampHistory[]>([])
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const cardId = params.cardId as string
  const customerId = params.customerId as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        // Verify business ownership
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .single()

        if (!business) {
          setError('Business not found')
          return
        }

        // Get stamp card details
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

        // Get customer details for this stamp card
        const { data: customerData, error: customerError } = await supabase
          .from('customer_cards')
          .select(`
            id,
            customer_id,
            current_stamps,
            wallet_pass_id,
            created_at,
            customers!inner (
              name,
              email
            )
          `)
          .eq('stamp_card_id', cardId)
          .eq('customer_id', customerId)
          .single()

        if (customerError || !customerData) {
          setError('Customer not found for this stamp card')
          return
        }

        const customer = (customerData.customers as { name: string; email: string }[])[0]
        const customerDetail: CustomerDetail = {
          id: customerData.id,
          customer_id: customerData.customer_id,
          name: customer.name,
          email: customer.email,
          current_stamps: customerData.current_stamps,
          wallet_pass_id: customerData.wallet_pass_id,
          joined_date: customerData.created_at,
          is_completed: customerData.current_stamps >= cardData.total_stamps
        }

        setCustomer(customerDetail)

        // Get stamp history (last 10 stamps)
        const { data: stamps, error: stampsError } = await supabase
          .from('stamps')
          .select('id, created_at')
          .eq('stamp_card_id', cardId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (!stampsError && stamps) {
          setStampHistory(stamps)
        }

        // Get reward history
        const { data: rewards, error: rewardsError } = await supabase
          .from('rewards')
          .select('id, redeemed_at, created_at')
          .eq('stamp_card_id', cardId)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })

        if (!rewardsError && rewards) {
          setRewardHistory(rewards)
        }

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cardId, customerId, supabase, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProgressPercentage = (current: number, total: number) => {
    return Math.min((current / total) * 100, 100)
  }

  const generateWalletPass = async (walletType: 'apple' | 'google' | 'pwa') => {
    if (!customer || !stampCard) return

    try {
      const baseUrl = window.location.origin
      const walletUrl = `${baseUrl}/api/wallet/${walletType}/${customer.id}`
      window.open(walletUrl, '_blank')
    } catch (error) {
      console.error('Error generating wallet pass:', error)
    }
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading customer details...</div>
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
              <Link href={`/business/stamp-cards/${cardId}/customers`}>
                <Button variant="outline">Back to Customers</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </BusinessLayout>
    )
  }

  // Removed wallet_type display logic - now shows all wallet options

  return (
    <BusinessLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href={`/business/stamp-cards/${cardId}/customers`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Customers
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {customer?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Customer progress for {stampCard?.name}
            </p>
          </div>
        </div>

        {/* Customer Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold">{customer?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-lg">{customer?.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joined Date</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-lg">{customer && formatDate(customer.joined_date)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Wallet Type</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{walletDisplay.icon}</span>
                    <p className="text-lg">{walletDisplay.name}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Generate Wallet Pass</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button onClick={() => generateWalletPass('apple')} variant="outline" size="sm">
                    <Download className="w-3 h-3 mr-1" />
                    🍎 Apple
                  </Button>
                  <Button onClick={() => generateWalletPass('google')} variant="outline" size="sm">
                    <Download className="w-3 h-3 mr-1" />
                    🤖 Google
                  </Button>
                  <Button onClick={() => generateWalletPass('pwa')} variant="outline" size="sm">
                    <Download className="w-3 h-3 mr-1" />
                    📱 Web App
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Circle */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#e5e7eb" 
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke={customer?.is_completed ? "#10b981" : "#3b82f6"}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (customer ? getProgressPercentage(customer.current_stamps, stampCard?.total_stamps || 1) / 100 : 0))}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {customer?.current_stamps}
                    </div>
                    <div className="text-xs text-gray-500">
                      of {stampCard?.total_stamps}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center">
                {customer?.is_completed ? (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    In Progress
                  </Badge>
                )}
              </div>

              {/* Remaining */}
              {!customer?.is_completed && (
                <div className="text-center text-sm text-gray-600">
                  {(stampCard?.total_stamps || 0) - (customer?.current_stamps || 0)} stamps remaining
                </div>
              )}

              {/* Reward */}
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-500">Reward</label>
                <p className="text-sm text-gray-900">{stampCard?.reward_description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Stamp Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Stamp Activity
              </CardTitle>
              <CardDescription>
                Last {Math.min(stampHistory.length, 5)} stamps collected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stampHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No stamps collected yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stampHistory.slice(0, 5).map((stamp, index) => (
                    <div key={stamp.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {stampHistory.length - index}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Stamp collected</p>
                        <p className="text-xs text-gray-500">{formatDateTime(stamp.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {stampHistory.length > 5 && (
                    <div className="text-center text-sm text-gray-500">
                      +{stampHistory.length - 5} more stamps
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Rewards History
              </CardTitle>
              <CardDescription>
                Completed rewards and redemptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rewardHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No rewards earned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewardHistory.map((reward) => (
                    <div key={reward.id} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Reward earned</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(reward.created_at)}
                        </p>
                        {reward.redeemed_at && (
                          <p className="text-xs text-green-600">
                            Redeemed: {formatDateTime(reward.redeemed_at)}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={reward.redeemed_at ? "default" : "secondary"}
                        className={reward.redeemed_at ? "bg-green-100 text-green-800 border-green-300" : ""}
                      >
                        {reward.redeemed_at ? "Redeemed" : "Available"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/business/stamp-cards/${cardId}/customers`}>
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Customers
                </Button>
              </Link>
              <Link href={`/business/stamp-cards/${cardId}/rewards`}>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  View All Rewards
                </Button>
              </Link>
              <Link href="/business/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
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