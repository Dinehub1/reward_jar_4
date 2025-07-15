'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, CreditCard, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  business: {
    name: string
  }
}

export default function JoinCardPage() {
  const [stampCard, setStampCard] = useState<StampCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<number | null>(null)
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const cardId = params.cardId as string
  const autoJoin = searchParams.get('autoJoin') === 'true'

  // Handle joining the card (for authenticated customers)
  const handleJoinCard = useCallback(async () => {
    if (!isAuthenticated || userRole !== 3) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/customer/card/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stampCardId: cardId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join card')
      }

      await response.json()
      
      // Redirect to customer card view
      router.push(`/customer/card/${cardId}`)
    } catch (err) {
      console.error('Error joining card:', err)
      setError(err instanceof Error ? err.message : 'Failed to join card')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, userRole, cardId, router, setLoading, setError])

  useEffect(() => {
    const checkAuthAndCard = async () => {
      try {
        // Check authentication status
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('Join page - checking auth state:', {
          hasSession: !!session?.user,
          autoJoin,
          cardId
        })
        
        if (session?.user) {
          // User is authenticated, check their role
          const { data: userData } = await supabase
            .from('users')
            .select('role_id')
            .eq('id', session.user.id)
            .single()
          
          if (userData) {
            setUserRole(userData.role_id)
            setIsAuthenticated(true)
            
            // If user is a customer and we have a valid card, check if they've already joined
            if (userData.role_id === 3 && cardId) {
              try {
                const { data: customerData } = await supabase
                  .from('customers')
                  .select('id')
                  .eq('user_id', session.user.id)
                  .single()
                
                if (customerData) {
                  const { data: existingCard } = await supabase
                    .from('customer_cards')
                    .select('id')
                    .eq('customer_id', customerData.id)
                    .eq('stamp_card_id', cardId)
                    .single()
                  
                  if (existingCard) {
                    // User has already joined this card, redirect to card view
                    router.push(`/customer/card/${cardId}`)
                    return
                  } else if (autoJoin) {
                    // Auto-join the card if user is returning from auth flow
                    console.log('Auto-joining card for customer:', customerData.id)
                    setTimeout(() => {
                      handleJoinCard()
                    }, 100) // Small delay to ensure state is set
                    return
                  }
                }
              } catch (error) {
                console.error('Error checking existing card:', error)
              }
            }
          }
        }

        // Fetch stamp card details
        if (cardId) {
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
            .eq('status', 'active')
            .single()

          if (cardError) {
            console.error('Card fetch error:', cardError)
            if (cardError.code === 'PGRST116') {
              setError('Stamp card not found or is no longer active.')
            } else {
              setError('Failed to load stamp card details.')
            }
            return
          }

          if (cardData) {
            // Handle the business relationship more safely
            const business = Array.isArray(cardData.businesses) 
              ? cardData.businesses[0] 
              : cardData.businesses

            setStampCard({
              ...cardData,
              business: business || { name: 'Unknown Business' }
            })
          }
        }
      } catch (err) {
        console.error('Error in checkAuthAndCard:', err)
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndCard()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session?.user)
        if (event === 'SIGNED_IN' && session?.user && autoJoin) {
          console.log('User signed in with autoJoin, triggering check')
          // Small delay to ensure all state is updated
          setTimeout(() => {
            checkAuthAndCard()
          }, 500)
        }
      }
    )
    
    return () => {
      subscription.unsubscribe()
    }
  }, [cardId, supabase, autoJoin, handleJoinCard, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading stamp card...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stampCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Card Not Found</h2>
            <p className="text-gray-600 mb-6">This stamp card doesn&apos;t exist or is no longer available.</p>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is authenticated but not a customer
  if (isAuthenticated && userRole !== 3) {
    const handleSignOut = async () => {
      await supabase.auth.signOut()
      window.location.reload() // Reload to show the unauthenticated customer signup flow
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <User className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Account Detected</h2>
            <p className="text-gray-600 mb-6">
              You&apos;re signed in as a business owner. To test the customer experience or join loyalty programs, you have these options:
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleSignOut}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Test as Customer (Sign Out)
              </Button>
              <Link href={`/auth/customer-signup?next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`}>
                <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                  Create Customer Account
                </Button>
              </Link>
              <Link href="/business/dashboard">
                <Button variant="outline" className="w-full">
                  Back to Business Dashboard
                </Button>
              </Link>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {stampCard?.name ? `Testing: ${stampCard.name}` : 'Testing QR Code'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Additional safety check - if stampCard is null or doesn't have required properties
  if (stampCard && (!stampCard.name || !stampCard.business)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Card Data</h2>
            <p className="text-gray-600 mb-6">This stamp card appears to have incomplete information. Please contact support.</p>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-6">
          {/* Card Preview */}
          <Card className="w-full shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {stampCard.name}
              </CardTitle>
              <CardDescription className="text-gray-600">
                by {stampCard.business.name}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Card Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Stamps needed:</span>
                  <span className="text-lg font-bold text-green-600">{stampCard?.total_stamps || 0}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">Reward:</span>
                  <p className="text-sm text-gray-600">{stampCard?.reward_description || 'Loading...'}</p>
                </div>
              </div>

              {/* Auth Options */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 text-center">Join this loyalty program</h3>
                
                <Link href={`/auth/customer-signup?next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`}>
                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold">
                    Create Account & Join
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                
                <div className="text-center">
                  <span className="text-sm text-gray-500">or</span>
                </div>
                
                <Link href={`/auth/login?role=customer&next=${encodeURIComponent(`/join/${cardId}?autoJoin=true`)}`}>
                  <Button variant="outline" className="w-full h-12 border-green-600 text-green-600 hover:bg-green-50">
                    Sign In to Existing Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
                      <div className="text-center">
              <p className="text-xs text-gray-500">
                Scan this QR code at {stampCard?.business?.name || 'this business'} to collect stamps and earn your reward!
              </p>
            </div>
        </div>
      </div>
    )
  }

  // If user is authenticated as customer - show join button
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card className="w-full shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {stampCard?.name || 'Loading...'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              by {stampCard?.business?.name || 'Unknown Business'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Card Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Stamps needed:</span>
                <span className="text-lg font-bold text-green-600">{stampCard.total_stamps}</span>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Reward:</span>
                <p className="text-sm text-gray-600">{stampCard.reward_description}</p>
              </div>
            </div>

            {/* Join Button */}
            <Button 
              onClick={handleJoinCard}
              disabled={loading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  Join Loyalty Program
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            
            {/* Auto-join indicator */}
            {autoJoin && (
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">
                  ✨ Auto-joining you to this loyalty program...
                </p>
              </div>
            )}

            {/* Info */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                You&apos;ll be able to collect stamps and track your progress once you join.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 