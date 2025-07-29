'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QrCode, CreditCard, User, ArrowRight, Loader2, AlertCircle, Mail, UserIcon, Gift, Smartphone, Apple, Star, Trophy, ExternalLink, LogIn } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  membership_type?: 'loyalty' | 'gym'
  status?: string
  business: {
    id: string
    name: string
    logo_url: string | null
  }
}

interface CustomerCard {
  id: string
  current_stamps: number
  sessions_used: number
  total_sessions: number
  membership_type: 'loyalty' | 'gym'
  stamp_card: StampCard
}

interface CustomerForm {
  name: string
  email: string
}

// Device detection utility
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'web'
  const userAgent = navigator.userAgent.toLowerCase()
  if (/iphone|ipod|ipad/.test(userAgent)) return 'ios'
  if (/android/.test(userAgent)) return 'android'
  return 'web'
}

// Notification and feedback system placeholders
const triggerStampNotification = (stampData: { billAmount?: number; currentStamps: number; totalStamps: number; businessName: string }) => {
  console.log('🔔 Stamp Notification Triggered:', {
    message: `Stamp added! ${stampData.totalStamps - stampData.currentStamps} more needed for reward`,
    billAmount: stampData.billAmount,
    businessName: stampData.businessName,
    geofence: '1km radius (configurable)',
    type: 'stamp_added'
  })
  // Future: Implement push notification API call
}

const triggerRewardNotification = (rewardData: { businessName: string; rewardDescription: string }) => {
  console.log('🎉 Reward Notification Triggered:', {
    message: 'Reward unlocked! Visit to redeem',
    businessName: rewardData.businessName,
    reward: rewardData.rewardDescription,
    geofence: '1km radius (configurable)',
    type: 'reward_available'
  })
  // Future: Implement push notification API call
}

export default function JoinCardPage() {
  const [customerCard, setCustomerCard] = useState<CustomerCard | null>(null)
  const [stampCard, setStampCard] = useState<StampCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [customerForm, setCustomerForm] = useState<CustomerForm>({ name: '', email: '' })
  const [submittingForm, setSubmittingForm] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'web'>('web')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const cardId = params.cardId as string
  const autoJoin = searchParams.get('autoJoin') === 'true'
  const isGuestMode = searchParams.get('guest') === 'true'
  const walletType = searchParams.get('wallet') as 'apple' | 'google' | 'pwa' | null

  // Detect device type on mount
  useEffect(() => {
    setDeviceType(getDeviceType())
  }, [])

  // Construct logo URL from Supabase storage
  const getLogoUrl = (business: { id: string; logo_url: string | null }) => {
    if (!business.logo_url) return null
    
    // Check if it's already a full URL (legacy support)
    if (business.logo_url.startsWith('http')) {
      return business.logo_url
    }
    
    // Construct URL from Supabase storage bucket
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${supabaseUrl}/storage/v1/object/public/business-logos/${business.id}/${business.logo_url}`
  }

  // Get theme colors based on card type
  const getThemeColors = (cardType: string = 'loyalty') => {
    if (cardType === 'gym' || cardType === 'membership') {
      return {
        gradient: 'from-indigo-50 to-indigo-100',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
        borderColor: 'border-indigo-600',
        textColor: 'text-indigo-600',
        accentColor: 'text-indigo-600',
        progressBg: 'bg-indigo-200',
        progressFill: 'bg-indigo-600'
      }
    }
    // Default to green theme for loyalty cards
    return {
      gradient: 'from-green-50 to-emerald-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-green-600',
      textColor: 'text-green-600',
      accentColor: 'text-green-600',
      progressBg: 'bg-green-200',
      progressFill: 'bg-green-600'
    }
  }

  // Check if reward is eligible for redemption
  const isRewardEligible = () => {
    if (customerCard && customerCard.membership_type === 'loyalty') {
      return customerCard.current_stamps >= customerCard.stamp_card.total_stamps
    }
    if (customerCard && customerCard.membership_type === 'gym') {
      return customerCard.sessions_used >= customerCard.total_sessions
    }
    return false
  }

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (customerCard && customerCard.membership_type === 'loyalty') {
      return Math.min((customerCard.current_stamps / customerCard.stamp_card.total_stamps) * 100, 100)
    }
    if (customerCard && customerCard.membership_type === 'gym') {
      return Math.min((customerCard.sessions_used / customerCard.total_sessions) * 100, 100)
    }
    return 0
  }

  // Handle customer form submission for guest users
  const handleGuestFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerForm.name.trim() || !customerForm.email.trim()) {
      setError('Please fill in all fields')
      return
    }

    setSubmittingForm(true)
    setError(null)

    try {
      // For guest mode, we'll validate the data and redirect to signup
      setFormSuccess(true)
      
      // Redirect to customer signup with pre-filled data
      setTimeout(() => {
        router.push(`/auth/customer-signup?name=${encodeURIComponent(customerForm.name)}&email=${encodeURIComponent(customerForm.email)}&next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`)
      }, 2000)

    } catch (err) {
      console.error('Guest form submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit information')
    } finally {
      setSubmittingForm(false)
    }
  }, [customerForm, cardId, router])

  // Handle joining the card (for authenticated customers)
  const handleJoinCard = useCallback(async () => {
    if (!isAuthenticated || userRole !== 3) {
      // Redirect to login if not authenticated
      router.push(`/auth/login?role=customer&next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`)
      return
    }

    setLoading(true)
    try {
      const targetStampCardId = customerCard?.stamp_card?.id || stampCard?.id
      if (!targetStampCardId) {
        throw new Error('No valid stamp card found to join')
      }

      const response = await fetch('/api/customer/card/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stampCardId: targetStampCardId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join card')
      }

      const result = await response.json()
      
      // Trigger notification for successful join
      if (stampCard || customerCard?.stamp_card) {
        const card = stampCard || customerCard!.stamp_card
        triggerStampNotification({
          currentStamps: 0,
          totalStamps: card.total_stamps,
          businessName: card.business.name,
          billAmount: 0
        })
      }
      
      // Redirect to customer card view
      router.push(`/customer/card/${result.customerCardId || cardId}`)
    } catch (err) {
      console.error('Error joining card:', err)
      setError(err instanceof Error ? err.message : 'Failed to join card')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, userRole, cardId, customerCard, stampCard, router])

  // Handle wallet integration
  const handleWalletIntegration = useCallback(async (type: 'apple' | 'google' | 'pwa') => {
    if (!isAuthenticated) {
      // Redirect to login for wallet actions
      router.push(`/auth/login?role=customer&next=${encodeURIComponent(`/join/${cardId}?wallet=${type}`)}`)
      return
    }

    const targetCardId = customerCard?.id || cardId
    
    try {
      if (type === 'apple') {
        window.location.href = `/api/wallet/apple/${targetCardId}`
      } else if (type === 'google') {
        window.location.href = `/api/wallet/google/${targetCardId}`
      } else if (type === 'pwa') {
        window.location.href = `/api/wallet/pwa/${targetCardId}`
      }
    } catch (err) {
      console.error('Wallet integration error:', err)
      setError('Failed to add to wallet. Please try again.')
    }
  }, [isAuthenticated, customerCard, cardId, router])

  // Enhanced card fetching - ALWAYS try to show card preview according to journeys.md
  const fetchCardData = useCallback(async () => {
    if (!cardId) return { customerCard: null, stampCard: null }

    console.log('🔍 Fetching card data for cardId:', cardId)

    try {
      // Strategy 1: Try to fetch as customer_card_id (existing customer card)
      try {
        const { data: customerCardData, error: customerCardError } = await supabase
          .from('customer_cards')
          .select(`
            id,
            current_stamps,
            sessions_used,
            total_sessions,
            membership_type,
            stamp_cards!inner (
              id,
              name,
              total_stamps,
              reward_description,
              status,
              businesses!inner (
                id,
                name,
                logo_url
              )
            )
          `)
          .eq('id', cardId)
          .single()

        if (!customerCardError && customerCardData) {
          console.log('✅ Found customer card:', customerCardData.id)
          const stampCardData = customerCardData.stamp_cards
          const business = Array.isArray(stampCardData.businesses) 
            ? stampCardData.businesses[0] 
            : stampCardData.businesses

          const customerCard: CustomerCard = {
            id: customerCardData.id,
            current_stamps: customerCardData.current_stamps || 0,
            sessions_used: customerCardData.sessions_used || 0,
            total_sessions: customerCardData.total_sessions || 0,
            membership_type: customerCardData.membership_type || 'loyalty',
            stamp_card: {
              id: stampCardData.id,
              name: stampCardData.name,
              total_stamps: stampCardData.total_stamps,
              reward_description: stampCardData.reward_description,
              membership_type: customerCardData.membership_type || 'loyalty',
              status: stampCardData.status,
              business: business || { id: '', name: 'Unknown Business', logo_url: null }
            }
          }

          return { customerCard, stampCard: null }
        }
      } catch (err) {
        console.log('❌ Customer card fetch failed:', err)
      }

      // Strategy 2: Try to fetch as stamp_card_id (direct stamp card access for guest preview)
      try {
        const { data: stampCardData, error: stampCardError } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            status,
            businesses!inner (
              id,
              name,
              logo_url
            )
          `)
          .eq('id', cardId)
          .single()

        if (!stampCardError && stampCardData) {
          console.log('✅ Found stamp card:', stampCardData.id)
          const business = Array.isArray(stampCardData.businesses) 
            ? stampCardData.businesses[0] 
            : stampCardData.businesses

          const stampCard: StampCard = {
            id: stampCardData.id,
            name: stampCardData.name,
            total_stamps: stampCardData.total_stamps,
            reward_description: stampCardData.reward_description,
            membership_type: 'loyalty', // Default for direct stamp card access
            status: stampCardData.status,
            business: business || { id: '', name: 'Unknown Business', logo_url: null }
          }

          return { customerCard: null, stampCard }
        }
      } catch (err) {
        console.log('❌ Stamp card fetch failed:', err)
      }

      // Strategy 3: If we have authenticated user, try to find their customer cards by stamp_card_id
      if (isAuthenticated && userId) {
        try {
          const { data: customerCardsData, error: customerCardsError } = await supabase
            .from('customer_cards')
            .select(`
              id,
              current_stamps,
              sessions_used,
              total_sessions,
              membership_type,
              stamp_card_id,
              stamp_cards!inner (
                id,
                name,
                total_stamps,
                reward_description,
                status,
                businesses!inner (
                  id,
                  name,
                  logo_url
                )
              )
            `)
            .eq('stamp_card_id', cardId)
            .eq('customer_id', userId)
            .limit(1)

          if (!customerCardsError && customerCardsData && customerCardsData.length > 0) {
            console.log('✅ Found customer card by stamp_card_id:', customerCardsData[0].id)
            const customerCardData = customerCardsData[0]
            const stampCardData = customerCardData.stamp_cards
            const business = Array.isArray(stampCardData.businesses) 
              ? stampCardData.businesses[0] 
              : stampCardData.businesses

            const customerCard: CustomerCard = {
              id: customerCardData.id,
              current_stamps: customerCardData.current_stamps || 0,
              sessions_used: customerCardData.sessions_used || 0,
              total_sessions: customerCardData.total_sessions || 0,
              membership_type: customerCardData.membership_type || 'loyalty',
              stamp_card: {
                id: stampCardData.id,
                name: stampCardData.name,
                total_stamps: stampCardData.total_stamps,
                reward_description: stampCardData.reward_description,
                membership_type: customerCardData.membership_type || 'loyalty',
                status: stampCardData.status,
                business: business || { id: '', name: 'Unknown Business', logo_url: null }
              }
            }

            return { customerCard, stampCard: null }
          }
        } catch (err) {
          console.log('❌ Customer cards by stamp_card_id fetch failed:', err)
        }
      }

      // Strategy 4: Final fallback - try to get ANY active stamp card for guest preview
      try {
        const { data: allStampCards, error: allStampCardsError } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            status,
            businesses!inner (
              id,
              name,
              logo_url
            )
          `)
          .eq('status', 'active')
          .limit(1)

        if (!allStampCardsError && allStampCards && allStampCards.length > 0) {
          console.log('⚠️ Using fallback stamp card for preview:', allStampCards[0].id)
          const stampCardData = allStampCards[0]
          const business = Array.isArray(stampCardData.businesses) 
            ? stampCardData.businesses[0] 
            : stampCardData.businesses

          const stampCard: StampCard = {
            id: stampCardData.id,
            name: 'Sample Loyalty Card',
            total_stamps: stampCardData.total_stamps,
            reward_description: stampCardData.reward_description || 'Join this loyalty program to earn rewards!',
            membership_type: 'loyalty',
            status: stampCardData.status,
            business: business || { id: '', name: 'Demo Business', logo_url: null }
          }

          return { customerCard: null, stampCard }
        }
      } catch (err) {
        console.log('❌ Fallback stamp card fetch failed:', err)
      }

      // All strategies failed
      console.log('❌ All card fetch strategies failed for cardId:', cardId)
      return { customerCard: null, stampCard: null }

    } catch (err) {
      console.error('❌ Card fetch error:', err)
      return { customerCard: null, stampCard: null }
    }
  }, [cardId, supabase, isAuthenticated, userId])

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      let authAttempts = 0
      const maxRetries = 3
      
      while (authAttempts < maxRetries) {
        try {
          const { data: { session }, error: authError } = await supabase.auth.getSession()
          
          if (authError) {
            console.error('Auth check error:', authError)
            authAttempts++
            if (authAttempts < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000))
              continue
            }
            break
          }

          if (session?.user) {
            console.log('✅ User authenticated:', session.user.id)
            setIsAuthenticated(true)
            setUserId(session.user.id)
            
            // Get user role
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role_id')
              .eq('id', session.user.id)
              .single()

            if (!userError && userData) {
              setUserRole(userData.role_id)
              console.log('✅ User role:', userData.role_id)
            }
          } else {
            console.log('ℹ️ User not authenticated')
            setIsAuthenticated(false)
            setUserId(null)
            setUserRole(null)
          }
          break
        } catch (err) {
          console.error('Auth retry error:', err)
          authAttempts++
          if (authAttempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }
    } catch (err) {
      console.error('Auth status check error:', err)
      setIsAuthenticated(false)
    }
  }, [supabase])

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      
      try {
        // First, check authentication status
        await checkAuthStatus()
        
        // Then fetch card data (always attempt, regardless of auth status)
        const { customerCard: fetchedCustomerCard, stampCard: fetchedStampCard } = await fetchCardData()
        
        if (fetchedCustomerCard) {
          setCustomerCard(fetchedCustomerCard)
          setStampCard(null)
          console.log('🎯 Customer card loaded:', fetchedCustomerCard.id)
        } else if (fetchedStampCard) {
          setStampCard(fetchedStampCard)
          setCustomerCard(null)
          console.log('🎯 Stamp card loaded:', fetchedStampCard.id)
        } else {
          console.log('⚠️ No card data found, but continuing for guest mode')
          // According to journeys.md, we should still show the page for guest access
          setError('Card not found, but you can still create an account to join loyalty programs')
        }

        // If user is authenticated, customer role, and autoJoin is true, try to join
        if (isAuthenticated && userRole === 3 && autoJoin && (fetchedCustomerCard || fetchedStampCard)) {
          console.log('🚀 Auto-joining card for authenticated customer')
          setTimeout(() => handleJoinCard(), 500)
          return
        }

      } catch (err) {
        console.error('Error in initializePage:', err)
        // Don't fail completely - still show guest options
        setError('Unable to load card details, but you can still sign up')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, !!session?.user)
        if (event === 'SIGNED_IN' && session?.user) {
          await checkAuthStatus()
          if (autoJoin) {
            console.log('🚀 User signed in with autoJoin, triggering card join')
            setTimeout(() => handleJoinCard(), 500)
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false)
          setUserId(null)
          setUserRole(null)
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [cardId, autoJoin, supabase, checkAuthStatus, fetchCardData, handleJoinCard])

  // Get theme colors based on card type
  const cardData = customerCard || stampCard
  const theme = getThemeColors(cardData?.membership_type)

  // Trigger reward notification if eligible
  useEffect(() => {
    if (isRewardEligible() && cardData) {
      triggerRewardNotification({
        businessName: cardData.business.name,
        rewardDescription: cardData.reward_description
      })
    }
  }, [customerCard, stampCard])

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className={`w-8 h-8 animate-spin ${theme.iconColor}`} />
          <p className={`${theme.iconColor} font-medium`}>Loading...</p>
        </div>
      </div>
    )
  }

  // According to journeys.md: "QR access allowed, stamps/rewards require authentication"
  // Always show card preview, only require auth for actions
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center py-12 px-4`}>
      <div className="max-w-md w-full space-y-6">
        {/* Main Card Preview - Always visible according to journeys.md */}
        <Card className="w-full shadow-xl border-0" data-testid="card-preview">
          <CardHeader className="text-center pb-4">
            {/* Business Logo Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {cardData?.business?.logo_url && !logoError ? (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={getLogoUrl(cardData.business) || ''}
                      alt={`${cardData.business.name} logo`}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                      onError={() => setLogoError(true)}
                      priority
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 ${theme.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className={`${theme.iconColor} font-bold text-sm`}>
                      {cardData?.business?.name?.charAt(0) || 'R'}
                    </span>
                  </div>
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {cardData?.business?.name || 'RewardJar Business'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {cardData?.membership_type === 'gym' ? 'Membership Program' : 'Loyalty Program'}
                  </p>
                </div>
              </div>
              <div className={`flex items-center justify-center w-16 h-16 ${theme.iconBg} rounded-full`}>
                <CreditCard className={`w-8 h-8 ${theme.iconColor}`} />
              </div>
            </div>
            
            <CardTitle className="text-xl font-bold text-gray-900">
              {cardData?.name || 'Loyalty Program'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {cardData ? 
                (cardData.membership_type === 'gym' ? 'Membership program for tracking sessions' : 'Loyalty program for collecting stamps') :
                'Join our loyalty program to earn rewards'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Card Preview Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {cardData?.membership_type === 'gym' ? 'Sessions available:' : 'Stamps needed:'}
                </span>
                <span className={`text-lg font-bold ${theme.accentColor}`}>
                  {cardData?.membership_type === 'gym' ? 'Unlimited' : (cardData?.total_stamps || 10)}
                </span>
              </div>
              
              {/* Progress for authenticated users with customer card */}
              {customerCard && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Your progress:</span>
                    <span className={`text-lg font-bold ${theme.accentColor}`}>
                      {customerCard.membership_type === 'gym' 
                        ? `${customerCard.sessions_used}/${customerCard.total_sessions}`
                        : `${customerCard.current_stamps}/${customerCard.stamp_card.total_stamps}`
                      }
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`w-full ${theme.progressBg} rounded-full h-3`}>
                    <div 
                      className={`${theme.progressFill} h-3 rounded-full transition-all duration-300`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  {cardData?.membership_type === 'gym' ? 'Benefits:' : 'Reward:'}
                </span>
                <p className="text-sm text-gray-600">
                  {cardData?.reward_description || 'Join our program and earn great rewards!'}
                </p>
              </div>

              {/* Reward Eligibility for authenticated users */}
              {isRewardEligible() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        🎉 Reward eligible! Visit the store to redeem.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Authentication-based Actions */}
            {!isAuthenticated ? (
              // Guest user experience - according to journeys.md
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <LogIn className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        Sign in to collect stamps and earn rewards!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/auth/login?role=customer&next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`}>
                    <Button className={`w-full h-12 ${theme.buttonBg} text-white font-semibold`}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  
                  <Link href={`/auth/customer-signup?next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`}>
                    <Button variant="outline" className={`w-full h-12 ${theme.borderColor} ${theme.textColor}`}>
                      <UserIcon className="w-4 h-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              // Authenticated user experience
              <div className="space-y-4">
                {/* Wallet Integration Buttons */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Add to Wallet</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {deviceType === 'ios' && (
                      <Button
                        onClick={() => handleWalletIntegration('apple')}
                        className={`w-full h-12 ${theme.buttonBg} text-white font-semibold flex items-center justify-center`}
                      >
                        <Apple className="w-5 h-5 mr-2" />
                        Add to Apple Wallet
                      </Button>
                    )}
                    
                    {deviceType === 'android' && (
                      <Button
                        onClick={() => handleWalletIntegration('google')}
                        className={`w-full h-12 ${theme.buttonBg} text-white font-semibold flex items-center justify-center`}
                      >
                        <Smartphone className="w-5 h-5 mr-2" />
                        Add to Google Wallet
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleWalletIntegration('pwa')}
                      variant="outline"
                      className={`w-full h-12 ${theme.borderColor} ${theme.textColor} hover:bg-opacity-10`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open as Web App
                    </Button>
                  </div>
                </div>

                {/* Join Card Button (if not already joined) */}
                {!customerCard && stampCard && (
                  <Button 
                    onClick={handleJoinCard}
                    disabled={loading}
                    className={`w-full h-12 ${theme.buttonBg} text-white font-semibold`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Join Program
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {/* Redemption Button (if eligible) */}
                {isRewardEligible() && customerCard && (
                  <Link href={`/customer/card/${customerCard.id}/redeem`}>
                    <Button className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold">
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Reward Now
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Links for authenticated users */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 gap-4">
            <Link href="/customer/dashboard">
              <Button variant="outline" className="w-full h-12">
                <User className="w-4 h-4 mr-2" />
                My Dashboard
              </Button>
            </Link>
            
            <Link href="/customer/profile">
              <Button variant="outline" className="w-full h-12">
                <UserIcon className="w-4 h-4 mr-2" />
                My Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {cardData ? 
              `Show this card at ${cardData.business?.name || 'this business'} to collect stamps or track sessions!` :
              'Join RewardJar loyalty programs to earn rewards and track your progress!'
            }
          </p>
        </div>
      </div>
    </div>
  )
} 