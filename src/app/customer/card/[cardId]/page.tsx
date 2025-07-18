'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import CustomerLayout from '@/components/layouts/CustomerLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Trophy, 
  Download, 
  Smartphone, 
  Star, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Gift
} from 'lucide-react'
import Link from 'next/link'

interface CustomerCard {
  id: string
  current_stamps: number
  wallet_pass_id: string | null
  created_at: string
  stamp_card: {
    id: string
    name: string
    total_stamps: number
    reward_description: string
    business: {
      name: string
      description: string
    }
  }
}

export default function CustomerCardPage() {
  const [customerCard, setCustomerCard] = useState<CustomerCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const cardId = params.cardId as string

  useEffect(() => {
    const fetchCustomerCard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth/login?role=customer')
          return
        }

        // Get customer ID
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (!customer) {
          setError('Customer profile not found')
          return
        }

        // Fetch customer card with stamp card details
        const { data: cardData, error: cardError } = await supabase
          .from('customer_cards')
          .select(`
            id,
            current_stamps,
            wallet_pass_id,
            created_at,
            stamp_cards!inner (
              id,
              name,
              total_stamps,
              reward_description,
              businesses!inner (
                name,
                description
              )
            )
          `)
          .eq('stamp_card_id', cardId)
          .eq('customer_id', customer.id)
          .single()

        if (cardError) {
          console.error('Error fetching customer card:', cardError)
          setError('Card not found or you don\'t have access to it')
          return
        }

        if (cardData) {
          // Handle the nested structure correctly - stamp_cards and businesses are objects, not arrays
          const stampCard = (cardData.stamp_cards as unknown) as { id: string; name: string; total_stamps: number; reward_description: string; businesses: unknown }
          const business = (stampCard.businesses as unknown) as { name: string; description: string }
          
          setCustomerCard({
            ...cardData,
            stamp_card: {
              id: stampCard.id,
              name: stampCard.name,
              total_stamps: stampCard.total_stamps,
              reward_description: stampCard.reward_description,
              business: {
                name: business.name,
                description: business.description
              }
            }
          })
        }
      } catch (err) {
        console.error('Error in fetchCustomerCard:', err)
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerCard()
  }, [cardId, supabase, router])

  const handleAddToWallet = async (walletType: 'apple' | 'google' | 'pwa') => {
    if (!customerCard) return

    setWalletLoading(true)
    try {
      const baseUrl = window.location.origin
      const walletUrl = `${baseUrl}/api/wallet/${walletType}/${customerCard.id}`
      
      if (walletType === 'pwa') {
        // For PWA, open in new tab or show instructions
        window.open(walletUrl, '_blank')
      } else {
        // For Apple/Google, trigger download
        window.location.href = walletUrl
      }
    } catch (err) {
      console.error('Error adding to wallet:', err)
      setError('Failed to add to wallet. Please try again.')
    } finally {
      setWalletLoading(false)
    }
  }

  const calculateProgress = () => {
    if (!customerCard) return 0
    return Math.min((customerCard.current_stamps / customerCard.stamp_card.total_stamps) * 100, 100)
  }

  const isCompleted = () => {
    if (!customerCard) return false
    return customerCard.current_stamps >= customerCard.stamp_card.total_stamps
  }

  const stampsRemaining = () => {
    if (!customerCard) return 0
    return Math.max(customerCard.stamp_card.total_stamps - customerCard.current_stamps, 0)
  }

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your card...</p>
          </div>
        </div>
      </CustomerLayout>
    )
  }

  if (error || !customerCard) {
    return (
      <CustomerLayout>
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error || 'Card not found'}</p>
              <Link href="/customer/dashboard">
                <Button variant="outline">Back to My Cards</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link 
          href="/customer/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Cards
        </Link>

        {/* Card Header */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  {customerCard.stamp_card.name}
                </CardTitle>
                <CardDescription className="text-green-100 text-base mt-1">
                  by {customerCard.stamp_card.business.name}
                </CardDescription>
              </div>
              <div className="text-right">
                {isCompleted() ? (
                  <Trophy className="w-12 h-12 text-yellow-300" />
                ) : (
                  <CreditCard className="w-12 h-12 text-white" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Progress Section */}
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-green-100">
                  <span>Progress</span>
                  <span>{customerCard.current_stamps} / {customerCard.stamp_card.total_stamps} stamps</span>
                </div>
                <div className="w-full bg-green-600/30 rounded-full h-3">
                  <div 
                    className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-2">
                {isCompleted() ? (
                  <div className="flex items-center text-yellow-300">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Reward Unlocked!</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-100">
                    <Star className="w-5 h-5 mr-2" />
                    <span>{stampsRemaining()} more stamps needed</span>
                  </div>
                )}
                <span className="text-2xl font-bold text-white">
                  {Math.round(calculateProgress())}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reward Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="w-5 h-5 mr-2 text-green-600" />
              Your Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{customerCard.stamp_card.reward_description}</p>
            {isCompleted() ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Congratulations! Your reward is ready to claim.</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Show this card to {customerCard.stamp_card.business.name} to redeem your reward.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm">
                  Collect {stampsRemaining()} more stamps to unlock this reward.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-green-600" />
              Add to Wallet
            </CardTitle>
            <CardDescription>
              Save this card to your mobile wallet for easy access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={() => handleAddToWallet('apple')}
                disabled={walletLoading}
                variant="outline"
                className="flex items-center justify-center h-12"
              >
                {walletLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    🍎 Apple Wallet
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleAddToWallet('google')}
                disabled={walletLoading}
                variant="outline"
                className="flex items-center justify-center h-12"
              >
                {walletLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    🤖 Google Wallet
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleAddToWallet('pwa')}
                disabled={walletLoading}
                variant="outline"
                className="flex items-center justify-center h-12"
              >
                {walletLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    🌐 Web App
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Your card will automatically update when you collect new stamps
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle>{customerCard.stamp_card.business.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {customerCard.stamp_card.business.description}
            </p>
            <div className="text-sm text-gray-500">
              <p>Card joined on {new Date(customerCard.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomerLayout>
  )
} 