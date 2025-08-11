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

export default function JoinCardPage() {
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
          setCardInfo({
            id: stampCard.id,
            name: stampCard.name,
            reward_description: stampCard.reward_description,
            business: stampCard.businesses?.[0] || { id: '', name: 'Unknown Business' },
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
          setCardInfo({
            id: membershipCard.id,
            name: membershipCard.name,
            reward_description: `${membershipCard.total_sessions} sessions for $${membershipCard.cost}`,
            business: membershipCard.businesses?.[0] || { id: '', name: 'Unknown Business' },
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
        const html = await response.text()
        const newWindow = window.open('', '_blank')
        newWindow?.document.write(html)
        setStep(5)
      }
    } catch (error) {
      console.error("Error:", error)
      setError('Failed to join wallet. Please try again.')
    }
  }

  if (isLoading || step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading card information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !cardInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Card Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Step 2: Card Information Display */}
        {step === 2 && cardInfo && (
          <Card className="overflow-hidden">
            <div 
              className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative p-6 text-white">
                <h1 className="text-2xl font-bold">{cardInfo.business.name}</h1>
                <p className="text-blue-100">{cardInfo.name}</p>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={cardInfo.card_type === 'stamp' ? 'default' : 'secondary'}>
                  {cardInfo.card_type === 'stamp' ? 'Stamp Card' : 'Membership Card'}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {cardInfo.card_type === 'stamp' ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {cardInfo.total_stamps} stamps to reward
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {cardInfo.total_sessions} sessions
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="h-4 w-4" />
                        ${cardInfo.cost}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Reward Details</h3>
                <p className="text-gray-600">{cardInfo.reward_description}</p>
              </div>

              {cardInfo.business.description && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">About {cardInfo.business.name}</h3>
                  <p className="text-gray-600">{cardInfo.business.description}</p>
                </div>
              )}

              <Button 
                onClick={() => setStep(3)} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Join This Card
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Registration Form */}
        {step === 3 && cardInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join {cardInfo.business.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleRegistration}
                  disabled={isRegistering || !formData.name.trim() || !formData.email.trim() || !formData.dateOfBirth}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isRegistering ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Wallet Selection */}
        {step === 4 && cardInfo && deviceInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Add to Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">{successMessage}</p>
                </div>
              )}
              
              <p className="text-gray-600 mb-6">
                Choose how you&apos;d like to store your {cardInfo.name} card:
              </p>

              <div className="space-y-3">
                {/* Apple Wallet Option */}
                {deviceInfo.supportsAppleWallet && (
                  <button
                    onClick={() => addToWallet('apple')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                        <Apple className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Apple Wallet</h3>
                        <p className="text-sm text-gray-600">
                          Add to your iPhone&apos;s built-in wallet app
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Google Wallet Option */}
                {deviceInfo.supportsGoogleWallet && (
                  <button
                    onClick={() => addToWallet('google')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Chrome className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Google Wallet</h3>
                        <p className="text-sm text-gray-600">
                          Add to your Google Wallet for easy access
                        </p>
                      </div>
                    </div>
                  </button>
                )}

                {/* PWA Option */}
                <button
                  onClick={() => addToWallet('pwa')}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Web Wallet</h3>
                      <p className="text-sm text-gray-600">
                        Access your card through any web browser
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 5 && cardInfo && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to {cardInfo.business.name}!</h2>
              <p className="text-gray-600 mb-6">
                Your {cardInfo.name} has been successfully added to your wallet.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Show your card when making purchases</li>
                  <li>• Earn {cardInfo.card_type === 'stamp' ? 'stamps' : 'track sessions'} with each visit</li>
                  <li>• Your card will update automatically</li>
                  <li>• Enjoy your rewards when you complete the card!</li>
                </ul>
              </div>

              <Button 
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 