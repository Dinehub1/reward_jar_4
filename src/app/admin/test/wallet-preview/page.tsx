'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Users, CreditCard, Activity, Coffee, Calendar, Smartphone, Apple } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'

interface TestCard {
  id: string
  membership_type: 'loyalty' | 'membership'
  current_stamps?: number
      sessions_used?: number
      total_sessions?: number
      cost?: number
      expiry_date?: string
  stamp_cards: {
    id: string
    name: string
    total_stamps: number
    reward_description: string
    businesses: {
      name: string
      description?: string
    }
  }
  customers: {
    name: string
    email: string
  }
}

interface WalletStatus {
  apple: boolean
  google: boolean
  pwa: boolean
}

interface LastUpdate {
  timestamp: string
  type: 'session' | 'stamp'
  success: boolean
  details: any
}

interface PlatformInfo {
  detected: 'apple' | 'google' | 'pwa'
  userAgent: string
  reasoning: string
}

function WalletPreviewPageContent() {
  const [selectedTab, setSelectedTab] = useState<'loyalty' | 'membership'>('loyalty')
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    apple: false,
    google: false,
    pwa: false
  })
  const [loading, setLoading] = useState(false)
  const [sessionMarking, setSessionMarking] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const customerCardId = searchParams?.get('customerCardId')
  const type = searchParams?.get('type') as 'loyalty' | 'membership' | null

  // Admin authentication check
  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', user.id)
          .single()

        if (userData?.role_id !== 1) {
          router.push('/')
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAdminAuth()
  }, [router])

  // Set mounted to true after component mounts to avoid hydration issues
  useEffect(() => {
    setMounted(true)
    if (type) {
      setSelectedTab(type)
    }
  }, [type])

  // Check wallet status
  const checkWalletStatus = async () => {
    try {
      const response = await fetch('/api/health/wallet')
      const data = await response.json()
      setWalletStatus({
        apple: data.checks?.apple_wallet || false,
        google: data.checks?.google_wallet || false,
        pwa: true // PWA is always available
      })
    } catch (error) {
      console.error('Error checking wallet status:', error)
    }
  }

  // Generate or load test data
  const generateTestData = async (cardType: 'loyalty' | 'membership') => {
    setLoading(true)
    try {
      // First try to load existing data
      console.log('🔍 Loading test data for card type:', cardType)
      const response = await fetch('/api/dev-seed')
      const data = await response.json()
      console.log('📊 API Response:', data)
      
      if (data.success && data.cards && data.cards.length > 0) {
        // Filter cards by type with more lenient data validation
        const filteredCards = data.cards
          .filter((card: TestCard) => 
            cardType === 'loyalty' ? card.membership_type === 'loyalty' : card.membership_type === 'membership'
          )
          .filter((card: TestCard) => 
            // Ensure card has basic structure (allow null values, we'll provide fallbacks)
            card.stamp_cards && 
            card.customers
          )
        
        console.log(`🎯 Filtered ${cardType} cards:`, filteredCards.length, filteredCards)
        setTestCards(filteredCards)
        
        if (filteredCards.length === 0) {
          // Generate new cards if none exist for this type
          await generateNewCards()
        }
      } else {
        // Generate new cards
        await generateNewCards()
      }
    } catch (error) {
      console.error('Error loading test data:', error)
      await generateNewCards()
    }
    setLoading(false)
  }

  // Generate new test cards
  const generateNewCards = async () => {
    try {
      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createAll: true })
      })
      
      const data = await response.json()
      if (data.success && data.cards) {
        const filteredCards = data.cards.filter((card: TestCard) => 
          selectedTab === 'loyalty' ? card.membership_type === 'loyalty' : card.membership_type === 'membership'
        )
        setTestCards(filteredCards)
      }
    } catch (error) {
      console.error('Error generating test cards:', error)
    }
  }

  // Enhanced mark usage with wallet sync (QR Scan Simulation)
  const markUsage = async (cardId: string, usageType: 'stamp' | 'session') => {
    if (sessionMarking) return
    
    setSessionMarking(true)
    setError(null) // Clear previous errors
    
    try {
      console.log(`🔍 Starting QR scan simulation for ${usageType} on card: ${cardId}`)
      
      // Step 1: Mark the usage (stamp or session)
      const markResponse = await fetch(`/api/wallet/mark-session/${cardId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'}`
        },
        body: JSON.stringify({
          usageType: usageType === 'stamp' ? 'auto' : 'session',
          testMode: true
        })
      })

      if (!markResponse.ok) {
        const errorData = await markResponse.json()
        throw new Error(errorData.error || 'Failed to mark usage')
      }

      const markResult = await markResponse.json()
      console.log(`✅ ${usageType} marked successfully:`, markResult)

      // Step 2: Queue wallet update for all platforms
      try {
        const updateResponse = await fetch(`/api/wallet/update-queue/${cardId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'}`
          },
          body: JSON.stringify({
            platform: 'all',
            updateType: usageType === 'stamp' ? 'stamp_update' : 'session_update',
            testMode: true
          })
        })

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json()
          console.log(`✅ Wallet sync queued successfully:`, updateResult)
        } else {
          console.warn(`⚠️ Wallet sync failed but usage was marked:`, await updateResponse.text())
        }
      } catch (syncError) {
        console.warn(`⚠️ Wallet sync error (usage still marked):`, syncError)
      }

      // Step 3: Update local state and refresh data
      setLastUpdate({
        timestamp: new Date().toISOString(),
        type: usageType,
        success: true,
        details: { 
          ...markResult,
          walletSyncAttempted: true,
          message: markResult.message || `${usageType === 'stamp' ? 'Stamp' : 'Session'} marked successfully!`
        }
      })

      // Step 4: Show success alert
      const successMessage = markResult.message || `${usageType === 'stamp' ? 'Stamp' : 'Session'} added successfully!`
      alert(`✅ QR Scan Success: ${successMessage}`)

      // Step 5: Refresh test data to show updated counts
      await generateTestData(selectedTab)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error in QR scan simulation:`, error)
      
      // Set error state for red alert display
      setError(`QR scan failed: ${errorMessage}`)
      
      setLastUpdate({
        timestamp: new Date().toISOString(),
        type: usageType,
        success: false,
        details: { error: errorMessage, action: 'qr_scan_simulation' }
      })
    }
    
    // Reset loading state after 1 second
    setTimeout(() => setSessionMarking(false), 1000)
  }

  // Enhanced platform detection with debug logging
  const detectPlatform = useCallback((): 'apple' | 'google' | 'pwa' => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent
      console.log('🔍 Platform Detection - User Agent:', userAgent)
      
      if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('Mac')) {
        console.log('📱 Platform Detected: Apple (iOS/macOS)')
        return 'apple'
      } else if (userAgent.includes('Android')) {
        console.log('🤖 Platform Detected: Google (Android)')
        return 'google'
      } else {
        console.log('🌐 Platform Detected: PWA (Default/Other)')
      }
    }
    return 'pwa'
  }, [])

  // Detailed platform info detection for debug mode
  const detectPlatformInfo = useCallback((): PlatformInfo => {
    if (typeof window === 'undefined') {
      return {
        detected: 'pwa',
        userAgent: 'Server-side rendering',
        reasoning: 'No window object available'
      }
    }

    const userAgent = window.navigator.userAgent
    let detected: 'apple' | 'google' | 'pwa' = 'pwa'
    let reasoning = 'Default fallback'

    if (userAgent.includes('iPhone')) {
      detected = 'apple'
      reasoning = 'iPhone detected in User-Agent'
    } else if (userAgent.includes('iPad')) {
      detected = 'apple'
      reasoning = 'iPad detected in User-Agent'
    } else if (userAgent.includes('Mac')) {
      detected = 'apple'
      reasoning = 'macOS detected in User-Agent'
    } else if (userAgent.includes('Android')) {
      detected = 'google'
      reasoning = 'Android detected in User-Agent'
    } else {
      reasoning = 'No mobile platform detected, using PWA'
    }

    const info: PlatformInfo = { detected, userAgent, reasoning }
    console.log('🔬 Detailed Platform Info:', info)
    return info
  }, [])

  // Update platform info when debug mode is enabled
  useEffect(() => {
    if (mounted && debugMode) {
      const info = detectPlatformInfo()
      setPlatformInfo(info)
    }
  }, [mounted, debugMode, detectPlatformInfo])

  // Debounced wallet generation function
  const generateWallet = useCallback(async (cardId: string, cardType: 'loyalty' | 'membership') => {
    if (sessionMarking) return // Prevent multiple concurrent calls
    
    setSessionMarking(true)
    const platform = detectPlatform()
    
    try {
      console.log(`🎫 Generating ${platform} wallet for ${cardType} card: ${cardId}`)
      
      const response = await fetch(`/api/wallet/${platform}/${cardId}`)
      if (response.ok) {
        console.log(`✅ ${platform} wallet generation successful`)
        
        if (platform === 'apple') {
          // For Apple Wallet, trigger download
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${cardType === 'loyalty' ? 'Stamp' : 'Membership'}_Card_${cardId.substring(0, 8)}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          // For Google and PWA, open in new tab
          window.open(`/api/wallet/${platform}/${cardId}`, '_blank')
        }
        
        setLastUpdate({
          timestamp: new Date().toISOString(),
          type: 'stamp', // Using stamp as generic type
          success: true,
          details: { platform, cardType, action: 'wallet_generated' }
        })
      } else {
        throw new Error(`${platform} wallet generation failed`)
      }
    } catch (error) {
      console.error(`❌ Error generating ${platform} wallet:`, error)
      setLastUpdate({
        timestamp: new Date().toISOString(),
        type: 'stamp',
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error', platform, cardType }
      })
    }
    
    // Debounce: wait 1 second before allowing next call
    setTimeout(() => setSessionMarking(false), 1000)
  }, [detectPlatform, sessionMarking])

  // Generate specific wallet type with enhanced logging and platform consistency checks
  const generateSpecificWallet = useCallback(async (cardId: string, platform: 'apple' | 'google' | 'pwa', cardType: 'loyalty' | 'membership') => {
    if (sessionMarking) return // Prevent multiple concurrent calls
    
    setSessionMarking(true)
    setError(null) // Clear previous errors
    
    try {
      // Map cardType to API type parameter
      const apiType = cardType === 'loyalty' ? 'stamp' : 'membership'
      const detectedPlatform = detectPlatform()
      
      console.log(`🎫 Platform Consistency Check:`)
      console.log(`   Requested Platform: ${platform}`)
      console.log(`   Detected Platform: ${detectedPlatform}`)
      console.log(`   Card Type: ${cardType} → API Type: ${apiType}`)
      console.log(`   Card ID: ${cardId}`)
      
      if (debugMode && detectedPlatform !== platform) {
        console.warn(`⚠️ Platform Mismatch: Requested ${platform} but detected ${detectedPlatform}`)
      }
      
      // Add authentication header
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'}`
      }
      
      const apiUrl = `/api/wallet/${platform}/${cardId}?type=${apiType}`
      console.log(`📡 API Request: POST ${apiUrl}`)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers
      })
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        let responseData: any = null
        
        if (platform === 'apple') {
          // For Apple Wallet, handle blob response
          responseData = await response.blob()
          console.log(`📦 Apple Response: Blob size ${responseData.size} bytes`)
          
          const url = URL.createObjectURL(responseData)
          const a = document.createElement('a')
          a.href = url
          a.download = `${apiType === 'stamp' ? 'Stamp' : 'Membership'}_Card_${cardId.substring(0, 8)}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          console.log(`✅ Apple Pass: Downloaded ${a.download}`)
          alert(`✅ Apple Pass generated successfully! Download: ${a.download}`)
          
        } else if (platform === 'google') {
          // For Google Wallet, handle JSON response
          responseData = await response.json()
          console.log(`📦 Google Response:`, responseData)
          
          // Check stamp count consistency
          if (responseData.loyaltyObject?.loyaltyPoints?.balance?.string) {
            console.log(`🎯 Stamp Count: ${responseData.loyaltyObject.loyaltyPoints.balance.string}`)
          }
          
          // Check theme consistency
          if (responseData.loyaltyObject?.hexBackgroundColor) {
            const expectedColor = apiType === 'stamp' ? '#10b981' : '#6366f1'
            const actualColor = responseData.loyaltyObject.hexBackgroundColor
            console.log(`🎨 Theme Check: Expected ${expectedColor}, Got ${actualColor}`)
            
            if (actualColor !== expectedColor) {
              console.warn(`⚠️ Theme Mismatch: Expected ${expectedColor} for ${apiType} card, got ${actualColor}`)
            }
          }
          
          if (responseData.saveUrl) {
            window.open(responseData.saveUrl, '_blank')
            alert(`✅ Google Pass generated successfully!`)
          } else {
            throw new Error('No save URL returned from Google Wallet API')
          }
          
        } else {
          // For PWA, handle HTML response
          responseData = await response.text()
          console.log(`📦 PWA Response: HTML length ${responseData.length} characters`)
          
          // Check for theme consistency in HTML
          const expectedThemeColor = apiType === 'stamp' ? '#10b981' : '#6366f1'
          if (responseData.includes(expectedThemeColor)) {
            console.log(`🎨 PWA Theme Check: ✅ Found expected color ${expectedThemeColor}`)
          } else {
            console.warn(`⚠️ PWA Theme Issue: Expected color ${expectedThemeColor} not found in HTML`)
          }
          
          const newWindow = window.open('', '_blank')
          if (newWindow) {
            newWindow.document.write(responseData)
            newWindow.document.close()
            alert(`✅ PWA Pass generated successfully!`)
          } else {
            throw new Error('Could not open PWA pass in new window')
          }
        }
        
        setLastUpdate({
          timestamp: new Date().toISOString(),
          type: 'stamp',
          success: true,
          details: { 
            platform, 
            cardType: apiType, 
            action: 'specific_wallet_generated', 
            cardId,
            detectedPlatform,
            responseData: platform === 'google' ? responseData : 'Binary/HTML data'
          }
        })
        
        console.log(`✅ ${platform.toUpperCase()} wallet generation completed successfully`)
        
      } else {
        const errorText = await response.text()
        console.error(`❌ API Error Response: ${errorText}`)
        throw new Error(`${platform} wallet generation failed: ${response.status} ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error generating ${platform} wallet:`, error)
      
      // Set error state for red alert display
      setError(`Error generating ${platform} pass: ${errorMessage}`)
      
      setLastUpdate({
        timestamp: new Date().toISOString(),
        type: 'stamp',
        success: false,
        details: { error: errorMessage, platform, cardType, cardId }
      })
    }
    
    // Reset loading state after 1 second
    setTimeout(() => setSessionMarking(false), 1000)
  }, [sessionMarking, detectPlatform, debugMode])

  // Test wallet generation (legacy function for individual buttons)
  const testWalletGeneration = async (cardId: string, walletType: 'apple' | 'google' | 'pwa') => {
    try {
      const response = await fetch(`/api/wallet/${walletType}/${cardId}`)
      if (response.ok) {
        console.log(`✅ ${walletType} wallet generation successful`)
        if (walletType === 'apple') {
          // For Apple Wallet, trigger download
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `loyalty-card-${cardId}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          // For Google and PWA, open in new tab
          window.open(`/api/wallet/${walletType}/${cardId}`, '_blank')
        }
      } else {
        console.error(`❌ ${walletType} wallet generation failed`)
      }
    } catch (error) {
      console.error(`Error testing ${walletType} wallet:`, error)
    }
  }

  // Initialize on mount
  useEffect(() => {
    if (mounted) {
      checkWalletStatus()
      generateTestData(selectedTab)
    }
  }, [mounted, selectedTab])

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              🎫 RewardJar 4.0 - Wallet Testing
            </CardTitle>
            <p className="text-center text-gray-600">
              Test wallet integrations for both Stamp Cards and Membership Cards
            </p>
          </CardHeader>
        </Card>

        {/* Debug Mode Toggle */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="debug-mode"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="debug-mode" className="text-sm font-medium text-blue-700">
                    Debug Mode
                  </label>
                </div>
                {debugMode && platformInfo && (
                  <div className="text-sm text-blue-600">
                    <span className="font-medium">Platform:</span> {platformInfo.detected.toUpperCase()} 
                    <span className="ml-2 text-blue-500">({platformInfo.reasoning})</span>
                  </div>
                )}
              </div>
              {debugMode && (
                <Button
                  onClick={() => setPlatformInfo(detectPlatformInfo())}
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Refresh Detection
                </Button>
              )}
            </div>
            {debugMode && platformInfo && (
              <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                <div className="text-xs text-blue-800 space-y-1">
                  <div><span className="font-medium">User Agent:</span> {platformInfo.userAgent}</div>
                  <div><span className="font-medium">Detection Logic:</span> {platformInfo.reasoning}</div>
                  <div><span className="font-medium">Expected Wallet:</span> {
                    platformInfo.detected === 'apple' ? 'Apple Wallet (.pkpass)' :
                    platformInfo.detected === 'google' ? 'Google Wallet (Save URL)' :
                    'PWA Wallet (HTML)'
                  }</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  size="sm"
                  className="ml-auto text-red-700 border-red-300 hover:bg-red-100"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs Interface */}
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'loyalty' | 'membership')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Coffee size={16} />
              Stamp Card
              <Badge variant="secondary">{testCards.filter(c => c.membership_type === 'loyalty').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="membership" className="flex items-center gap-2">
              <Calendar size={16} />
              Membership Card
              <Badge variant="secondary">{testCards.filter(c => c.membership_type === 'membership').length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Stamp Card Tab */}
          <TabsContent value="loyalty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-green-500" />
                  Stamp Card Testing
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Test stamp collection, 5x2 grid layout, and reward redemption
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading stamp cards...</p>
                  </div>
                ) : testCards.filter(c => c.membership_type === 'loyalty').length === 0 ? (
                  <div className="text-center py-8">
                    <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No stamp cards available</p>
                    <div className="space-y-3">
                      <Button onClick={generateNewCards} className="bg-green-500 hover:bg-green-600 w-full">
                        Generate Stamp Cards
                      </Button>
                      <Button 
                        onClick={() => generateWallet('3e234610-9953-4a8b-950e-b03a1924a1fe', 'loyalty')}
                        disabled={sessionMarking}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        {sessionMarking ? 'Generating...' : '🎫 Generate Stamp Card Wallet'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {testCards.filter(c => c.membership_type === 'loyalty').map((card) => (
                      <Card key={card.id} className="border-green-200">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-green-700">
                                {card.stamp_cards?.businesses?.name || 'Test Business'}
                              </h3>
                              <p className="text-sm text-gray-600">{card.stamp_cards?.name || 'Test Loyalty Card'}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-700">
                              {card.current_stamps || 0}/{card.stamp_cards?.total_stamps || 10} stamps
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm text-gray-600">
                            {card.stamp_cards?.reward_description || 'Free coffee after 10 stamps'}
                          </div>
                          
                          {/* Generate Wallet Button */}
                          <Button
                            onClick={() => generateWallet(card.id, 'loyalty')}
                            disabled={sessionMarking}
                            className="w-full bg-green-600 hover:bg-green-700 mb-2"
                          >
                            {sessionMarking ? 'Generating...' : '🎫 Generate Stamp Card Wallet'}
                          </Button>
                          
                          {/* QR Simulation */}
                          <Button
                            onClick={() => markUsage(card.id, 'stamp')}
                            disabled={sessionMarking}
                            className="w-full bg-green-500 hover:bg-green-600"
                          >
                            {sessionMarking ? 'Processing QR Scan...' : '📱 Simulate QR Scan (Add Stamp + Sync Wallets)'}
                          </Button>

                          {/* Individual Wallet Generation Tests */}
                          <div className="space-y-2">
                            <Button
                              onClick={() => generateSpecificWallet(card.id, 'apple', 'loyalty')}
                              disabled={sessionMarking || !walletStatus.apple}
                              className="w-full bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center gap-2"
                            >
                              <Apple size={16} />
                              Generate Apple Pass
                            </Button>
                            <Button
                              onClick={() => generateSpecificWallet(card.id, 'google', 'loyalty')}
                              disabled={sessionMarking || !walletStatus.google}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                            >
                              <CreditCard size={16} />
                              Generate Google Pass
                            </Button>
                            <Button
                              onClick={() => generateSpecificWallet(card.id, 'pwa', 'loyalty')}
                              disabled={sessionMarking}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                            >
                              <Smartphone size={16} />
                              Generate PWA Pass
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Membership Card Tab */}
          <TabsContent value="membership" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  Membership Card Testing
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Test session tracking, cost display, and expiry management
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading membership cards...</p>
                  </div>
                ) : testCards.filter(c => c.membership_type === 'membership').length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No membership cards available</p>
                    <div className="space-y-3">
                      <Button onClick={generateNewCards} className="bg-indigo-500 hover:bg-indigo-600 w-full">
                        Generate Membership Cards
                      </Button>
                      <Button 
                        onClick={() => generateWallet('90910c9c-f8cc-4e49-b53c-87863f8f30a5', 'membership')}
                        disabled={sessionMarking}
                        className="bg-indigo-600 hover:bg-indigo-700 w-full"
                      >
                        {sessionMarking ? 'Generating...' : '🎫 Generate Membership Card Wallet'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {testCards.filter(c => c.membership_type === 'membership').map((card) => (
                      <Card key={card.id} className="border-indigo-200">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-indigo-700">
                                {card.stamp_cards?.businesses?.name || 'Test Gym'}
                              </h3>
                              <p className="text-sm text-gray-600">{card.stamp_cards?.name || 'Test Membership Card'}</p>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700">
                              {card.sessions_used || 0}/{card.total_sessions || 20} sessions
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm space-y-1">
                            <div className="text-gray-600">{card.stamp_cards?.reward_description || 'Full gym access and classes'}</div>
                            {card.cost && (
                              <div className="text-indigo-600 font-medium">₩{card.cost.toLocaleString()}</div>
                            )}
                            {card.expiry_date && (
                              <div className="text-gray-500 text-xs">
                                Expires: {new Date(card.expiry_date).toLocaleDateString()}
                              </div>
                            )}
      </div>

                          {/* Generate Wallet Button */}
                          <Button
                            onClick={() => generateWallet(card.id, 'membership')}
                            disabled={sessionMarking}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 mb-2"
                          >
                            {sessionMarking ? 'Generating...' : '🎫 Generate Membership Card Wallet'}
                          </Button>
                          
                          {/* QR Simulation */}
                          <Button
                            onClick={() => markUsage(card.id, 'session')}
                            disabled={sessionMarking}
                            className="w-full bg-indigo-500 hover:bg-indigo-600"
                          >
                            {sessionMarking ? 'Processing QR Scan...' : '📱 Simulate QR Scan (Mark Session + Sync Wallets)'}
                          </Button>

                          {/* Individual Wallet Generation Tests */}
                          <div className="space-y-2">
                            <Button
                              onClick={() => generateSpecificWallet(card.id, 'apple', 'membership')}
                              disabled={sessionMarking || !walletStatus.apple}
                              className="w-full bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center gap-2"
                            >
                              <Apple size={16} />
                              Generate Apple Pass
                            </Button>
                            <Button
                              onClick={() => generateSpecificWallet(card.id, 'google', 'membership')}
                              disabled={sessionMarking || !walletStatus.google}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                            >
                              <CreditCard size={16} />
                              Generate Google Pass
                            </Button>
                            <Button
                              onClick={() => generateSpecificWallet(card.id, 'pwa', 'membership')}
                              disabled={sessionMarking}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                            >
                              <Smartphone size={16} />
                              Generate PWA Pass
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Wallet Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Environment Status
            </CardTitle>
              <Button variant="outline" size="sm" onClick={checkWalletStatus}>
              Refresh Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                {walletStatus.apple ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Apple Wallet</span>
            </div>
              <div className="flex items-center gap-2">
                {walletStatus.google ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm">Google Wallet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">PWA Wallet</span>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Last Update Status */}
      {lastUpdate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Last Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
              {lastUpdate.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>
                  {lastUpdate.type} - {new Date(lastUpdate.timestamp).toLocaleTimeString()}
                </span>
                  {lastUpdate.success ? (
                  <Badge className="bg-green-100 text-green-700">Success</Badge>
                  ) : (
                  <Badge variant="destructive">Failed</Badge>
                  )}
              </div>
              {lastUpdate.details && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(lastUpdate.details, null, 2)}
                </pre>
              )}
          </CardContent>
        </Card>
      )}
          </div>
      </div>
    </AdminLayout>
  )
}

export default function WalletPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading wallet preview...</div>
      </div>
    }>
      <WalletPreviewPageContent />
    </Suspense>
  )
}