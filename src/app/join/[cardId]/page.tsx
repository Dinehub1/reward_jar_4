'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Apple, Chrome, Globe, Smartphone, Star, Gift, Clock, Users } from 'lucide-react'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

interface CardInfo {
  id: string
  name: string
  reward_description: string
  business: {
    id: string
    name: string
    description?: string
  }
  card_type: 'stamp' | 'membership'
  total_stamps?: number
  total_sessions?: number
  cost?: number
  duration_days?: number
}

interface DeviceInfo {
  type: 'ios' | 'android' | 'desktop'
  userAgent: string
  supportsAppleWallet: boolean
  supportsGoogleWallet: boolean
}

function LegacyJoinCardPage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.cardId as string
  
  const [step, setStep] = useState(1) // 1: Loading, 2: Card Info, 3: Registration, 4: Wallet Selection, 5: Success
  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [customerCardId, setCustomerCardId] = useState<string | null>(null)

  // Registration form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  })

  // Detect device and load card info
  useEffect(() => {
    async function initialize() {
      try {
        
        // Detect device
        const userAgent = navigator.userAgent
        const isIOS = /iPad|iPhone|iPod/.test(userAgent)
        const isAndroid = /Android/.test(userAgent)
        
        setDeviceInfo({
          type: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop',
          userAgent,
          supportsAppleWallet: true, // Always show Apple Wallet for testing/demo
          supportsGoogleWallet: true // Always show Google Wallet
        })

        // Load card information
        const supabase = createClient()
        
        
        // Try stamp cards first
        const { data: stampCard, error: stampError } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            reward_description,
            total_stamps,
            businesses!inner(id, name, description)
          `)
          .eq('id', cardId)
          .eq('status', 'active')
          .single()


        if (stampCard) {
          console.log('Stamp card data:', stampCard)
          console.log('Stamp card businesses array:', stampCard.businesses)
          console.log('Is businesses array?', Array.isArray(stampCard.businesses))
          console.log('Businesses length:', stampCard.businesses?.length)
          const business = stampCard.businesses?.[0] || { id: '', name: 'Unknown Business' }
          console.log('Business data:', business)
          console.log('Business name:', business.name)
          
          setCardInfo({
            id: stampCard.id,
            name: stampCard.name,
            reward_description: stampCard.reward_description,
            business: business,
            card_type: 'stamp',
            total_stamps: stampCard.total_stamps
          })
          setStep(2)
          return
        }


        // Try membership cards
        const { data: membershipCard, error: membershipError } = await supabase
          .from('membership_cards')
          .select(`
            id,
            name,
            total_sessions,
            cost,
            duration_days,
            businesses!inner(id, name, description)
          `)
          .eq('id', cardId)
          .eq('status', 'active')
          .single()


        if (membershipCard) {
          console.log('Membership card data:', membershipCard)
          console.log('Membership card businesses array:', membershipCard.businesses)
          console.log('Is businesses array?', Array.isArray(membershipCard.businesses))
          console.log('Businesses length:', membershipCard.businesses?.length)
          const business = membershipCard.businesses?.[0] || { id: '', name: 'Unknown Business' }
          console.log('Business data:', business)
          console.log('Business name:', business.name)
          
          setCardInfo({
            id: membershipCard.id,
            name: membershipCard.name,
            reward_description: `${membershipCard.total_sessions} sessions for $${membershipCard.cost}`,
            business: business,
            card_type: 'membership',
            total_sessions: membershipCard.total_sessions,
            cost: membershipCard.cost,
            duration_days: membershipCard.duration_days
          })
          setStep(2)
          return
        }

        setError('Card not found or inactive')
      } catch (err) {
        setError('Failed to load card information')
      } finally {
        setIsLoading(false)
      }
    }

    if (cardId) {
      initialize()
    }
  }, [cardId])

  const handleRegistration = async () => {
    if (!cardInfo || !formData.name || !formData.email || !formData.dateOfBirth) {
      setError('Please fill in all required fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate date format and that it's not in the future
    const birthDate = new Date(formData.dateOfBirth)
    const today = new Date()
    if (isNaN(birthDate.getTime())) {
      setError('Please enter a valid date of birth')
      return
    }
    if (birthDate > today) {
      setError('Date of birth cannot be in the future')
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      const response = await fetch('/api/customer/card/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
              name: formData.name,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          cardId: cardInfo.id,
          cardType: cardInfo.card_type
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Registration failed')
      }

      setCustomerCardId(result.data.customerCardId)
      
      // Show appropriate message for existing vs new users
      if (result.data.isExisting) {
        setError(null) // Clear any previous errors
        setSuccessMessage('Welcome back! You already have this card. Choose how to add it to your wallet.')
        setStep(4) // Move to wallet selection
      } else {
        setSuccessMessage('Successfully registered! Choose how to add your card to your wallet.')
        setStep(4) // Move to wallet selection for new users
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to register for card: ${errorMessage}. Please try again.`)
    } finally {
      setIsRegistering(false)
    }
  }

  const addToWallet = async (walletType: 'apple' | 'google' | 'pwa') => {
    if (!customerCardId) return

    try {
      if (walletType === 'pwa') {
        // For PWA, open directly with GET request (no auth needed)
        window.open(`/api/wallet/pwa/${customerCardId}`, '_blank')
        setStep(5)
        return
      }

      // For Apple and Google wallets, use GET (no auth needed for wallet generation)
      const response = await fetch(`/api/wallet/${walletType}/${customerCardId}`, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`${walletType} wallet API returned ${response.status}`)
      }

      if (walletType === 'apple') {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${cardInfo?.name.replace(/\s+/g, '_')}.pkpass`
        a.click()
        URL.revokeObjectURL(url)
        setStep(5)
      } else if (walletType === 'google') {
        const result = await response.json()
        console.log('Google Wallet response:', result) // Debug logging
        
        if (result.success && result.saveUrl) {
          // Automatically open the Google Wallet save URL
          window.open(result.saveUrl, '_blank')
          setSuccessMessage('Opening Google Wallet... If it doesn\'t open automatically, check your popup blocker.')
          setStep(5)
        } else {
          // Show detailed error message for debugging
          const errorMsg = result.error || result.message || 'Google Wallet integration not ready'
          console.error('Google Wallet error details:', result)
          throw new Error(errorMsg)
        }
      }
    } catch (error) {
      console.error("Wallet error:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join wallet. Please try again.'
      setError(`Google Wallet Error: ${errorMessage}`)
    }
  }

  if (isLoading || step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardContent className="p-8 text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Loading Card Information</h3>
              <p className="text-slate-600">Please wait while we prepare your card...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !cardInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <Card className="w-full max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl font-bold">!</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-3">Card Not Found</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">{error}</p>
              <Button 
                onClick={() => router.push('/')} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="font-medium">Return Home</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Modern background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Step 2: Card Information Display */}
        {step === 2 && cardInfo && (
          <Card className="overflow-hidden shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <div className="h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
              <div className="absolute bottom-2 left-4 w-16 h-16 bg-white/5 rounded-full blur-lg" />
              <div className="relative p-6 h-full flex flex-col justify-end text-white">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{cardInfo.business.name}</h1>
                <p className="text-blue-100 text-lg opacity-90">{cardInfo.name}</p>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Badge 
                  variant={cardInfo.card_type === 'stamp' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1.5 font-medium"
                >
                  {cardInfo.card_type === 'stamp' ? '⭐ Stamp Card' : '🎫 Membership Card'}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  {cardInfo.card_type === 'stamp' ? (
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
                      <Star className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">{cardInfo.total_stamps} stamps to reward</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{cardInfo.total_sessions} sessions</span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                        <Gift className="h-4 w-4 text-green-600" />
                        <span className="font-medium">${cardInfo.cost}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-5 rounded-xl border border-slate-200/50">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-blue-600" />
                  Reward Details
                </h3>
                <p className="text-slate-700 leading-relaxed">{cardInfo.reward_description}</p>
              </div>

              {cardInfo.business.description && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-200/50">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    About {cardInfo.business.name}
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{cardInfo.business.description}</p>
                </div>
              )}

              <Button 
                onClick={() => setStep(3)} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
              >
                <span className="font-semibold">Join This Card</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Registration Form */}
        {step === 3 && cardInfo && (
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span>Join {cardInfo.business.name}</span>
              </CardTitle>
              <p className="text-slate-600 text-sm">Please fill in your details to create your loyalty card.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number <span className="text-slate-400">(Optional)</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                  className="flex-1 h-11 border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <span className="font-medium">Back</span>
                </Button>
                <Button 
                  onClick={handleRegistration}
                  disabled={isRegistering || !formData.name.trim() || !formData.email.trim() || !formData.dateOfBirth}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
                >
                  <span className="font-semibold">
                    {isRegistering ? 'Registering...' : 'Register'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Wallet Selection */}
        {step === 4 && cardInfo && deviceInfo && (
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <span>Add to Your Wallet</span>
              </CardTitle>
              <p className="text-slate-600 text-sm">Choose how you&apos;d like to store your {cardInfo.name} card for easy access.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <p className="text-green-700 text-sm leading-relaxed">{successMessage}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Apple Wallet Option */}
                {deviceInfo.supportsAppleWallet && (
                  <button
                    onClick={() => addToWallet('apple')}
                    className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200 text-left group hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Apple className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-1">Apple Wallet</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Add to your iPhone&apos;s built-in wallet app for seamless access
                        </p>
                      </div>
                      <div className="w-6 h-6 border-2 border-slate-300 rounded-full group-hover:border-black transition-colors" />
                    </div>
                  </button>
                )}

                {/* Google Wallet Option */}
                {deviceInfo.supportsGoogleWallet && (
                  <button
                    onClick={() => addToWallet('google')}
                    className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200 text-left group hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Chrome className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-1">Google Wallet</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Save to Google Wallet for quick access on Android devices
                        </p>
                      </div>
                      <div className="w-6 h-6 border-2 border-slate-300 rounded-full group-hover:border-blue-500 transition-colors" />
                    </div>
                  </button>
                )}

                {/* PWA Option */}
                <button
                  onClick={() => addToWallet('pwa')}
                  className="w-full p-5 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200 text-left group hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <Globe className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 mb-1">Web Wallet</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Access your card through any web browser, anywhere
                      </p>
                    </div>
                    <div className="w-6 h-6 border-2 border-slate-300 rounded-full group-hover:border-emerald-500 transition-colors" />
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 5 && cardInfo && (
          <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/95">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-3xl font-bold">✓</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
                Welcome to {cardInfo.business.name}!
              </h2>
              <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                Your {cardInfo.name} has been successfully added to your wallet.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  What&apos;s Next?
                </h3>
                <ul className="text-sm text-blue-700 space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <span>Show your digital card when making purchases</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <span>Earn {cardInfo.card_type === 'stamp' ? 'stamps' : 'points'} with each visit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">3</span>
                    </div>
                    <span>Your card updates automatically - no manual tracking needed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">4</span>
                    </div>
                    <span>Enjoy your rewards when you complete the card!</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] px-8 py-3"
                size="lg"
              >
                <span className="font-semibold">Return Home</span>
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
} 
export default function JoinCardPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Join Card Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the join card</p>
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
        <LegacyJoinCardPage />
      </div>
    </ComponentErrorBoundary>
  )
}