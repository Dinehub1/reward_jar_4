'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth-protection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Users, TrendingUp, Smartphone, Gift, CheckCircle, ChevronDown } from 'lucide-react'

interface Business {
  id: string
  name: string
  description: string | null
}

export default function BusinessCardsIntroPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCardType, setSelectedCardType] = useState<'stamp' | 'membership' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Load business data
  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const authResult = await checkAuth()
        if (!authResult.isAuthenticated || !authResult.isBusiness) {
          router.push('/auth/login')
          return
        }

        const { data: businessData, error } = await supabase
          .from('businesses')
          .select('id, name, description')
          .eq('owner_id', authResult.user!.id)
          .single()

        if (error) {
          console.error('Error loading business:', error)
          return
        }

        setBusiness(businessData)
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinessData()
  }, [router, supabase])

  const handleCreateCard = () => {
    if (selectedCardType === 'stamp') {
      router.push('/business/stamp-cards/new')
    } else if (selectedCardType === 'membership') {
      // For now, redirect to stamp cards (membership creation coming soon)
      router.push('/business/stamp-cards/new')
    }
  }

  const skipToDashboard = () => {
    router.push('/business/dashboard')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your business details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to RewardJar!</h1>
            <p className="text-gray-600">
              Step 3 of 3 - Choose your loyalty card type and start building customer relationships
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div className="bg-green-500 h-2 rounded-full w-full"></div>
        </div>

        {/* Educational Section */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Your Business Profile is Ready!</CardTitle>
            <CardDescription className="text-lg">
              {business?.name && (
                <span className="text-green-600 font-medium">{business.name}</span>
              )}
              {business?.name && ' is '}now set up to create digital loyalty programs
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card Type Selection */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Choose Your Loyalty Card Type</h2>
          <p className="text-gray-600 text-center mb-8">
            Select the best fit for your business model and customer engagement strategy
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Stamp Card Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 shadow-lg border-2 ${
                selectedCardType === 'stamp' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300 hover:shadow-xl'
              }`}
              onClick={() => setSelectedCardType('stamp')}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  {selectedCardType === 'stamp' && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-xl font-semibold text-green-700">Stamp Card</CardTitle>
                <CardDescription className="text-base">
                 Ideal for cafes, restaurants, salons, retail stores collect stamps, earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Gift className="h-4 w-4 mr-2 text-green-600" />
                    Reward-based loyalty system
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-green-600" />
                    Encourage repeat visits
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Increase customer retention
                  </div>
                </div>

                {/* Sample Card Preview */}
                <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
                  <div className="text-sm font-medium">{business?.name || 'Your Business Name'}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {business?.description || 'Your business description'}
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-lg font-bold">• • • • • • • ○ ○ ○</div>
                    <div className="text-xs opacity-90">Collect 10 stamps to earn a reward</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membership Card Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 shadow-lg border-2 ${
                selectedCardType === 'membership' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl'
              }`}
              onClick={() => setSelectedCardType('membership')}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <Smartphone className="h-6 w-6 text-indigo-600" />
                  </div>
                  {selectedCardType === 'membership' && (
                    <CheckCircle className="h-6 w-6 text-indigo-600" />
                  )}
                </div>
                <CardTitle className="text-xl font-semibold text-indigo-700">Membership Card</CardTitle>
                <CardDescription className="text-base">
                  Ideal for gyms, spas, coachings, studios, gaming arenas- track sessions, manage memberships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="h-4 w-4 mr-2 text-indigo-600" />
                    Session-based tracking
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-indigo-600" />
                    Premium service upselling
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
                    Higher customer lifetime value
                  </div>
                </div>

                {/* Sample Card Preview */}
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white">
                  <div className="text-sm font-medium">{business?.name || 'Your Business Name'}</div>
                  <div className="text-xs opacity-90 mt-1">Monthly Membership</div>
                  <div className="mt-3 text-center">
                    <div className="text-lg font-bold">Session Tracking</div>
                    <div className="text-xs opacity-90">Track member visits and usage</div>
                  </div>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-3 bg-indigo-100 border border-indigo-200 rounded-md p-2 text-center">
                  <span className="text-xs font-medium text-indigo-800">Advanced features available</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Multi-Wallet Integration Preview */}
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Multi-Wallet Integration</CardTitle>
            <CardDescription>
              Your loyalty cards work across all platforms automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">📱</div>
                <div className="font-medium text-sm">Apple Wallet</div>
                <div className="text-xs text-gray-600">iPhone & iPad</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">🤖</div>
                <div className="font-medium text-sm">Google Wallet</div>
                <div className="text-xs text-gray-600">Android devices</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">🌐</div>
                <div className="font-medium text-sm">PWA Wallet</div>
                <div className="text-xs text-gray-600">All devices</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="shadow-lg border border-gray-200">
          <CardContent className="pt-6">
            {selectedCardType ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to create your {selectedCardType === 'stamp' ? 'Stamp Card' : 'Membership Card'}?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    You can always create more cards later from your dashboard
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={skipToDashboard}
                    className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={handleCreateCard}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-11 font-medium"
                  >
                    Create {selectedCardType === 'stamp' ? 'Stamp Card' : 'Membership Card'} →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center text-gray-400 mb-4">
                  <ChevronDown className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Select a card type above to continue</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Choose between stamp cards or membership cards based on your business model
                </p>
                <Button
                  variant="outline"
                  onClick={skipToDashboard}
                  className="px-8 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Skip for Now - Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Preview */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <Users className="h-4 w-4 mr-2 text-green-600" />
              Customer retention tools
            </div>
            <div className="flex items-center justify-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Real-time analytics
            </div>
            <div className="flex items-center justify-center">
              <Smartphone className="h-4 w-4 mr-2 text-green-600" />
              Multi-platform wallet support
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 