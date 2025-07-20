'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, Users, CreditCard, Activity } from 'lucide-react'

interface TestCard {
  id: string
  scenario: string
  cardType: 'loyalty' | 'gym'
  progress: number
  isCompleted: boolean
  isExpired?: boolean
  details: {
    membership?: {
      sessions_used?: number
      total_sessions?: number
      cost?: number
      expiry_date?: string
      is_expired?: boolean
    }
    business?: {
      name?: string
    }
    current_stamps?: number
    total_stamps?: number
    reward_description?: string
    cost?: number
    sessions_used?: number
    total_sessions?: number
    expiry_date?: string
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
  details: {
    error?: string
    result?: {
      sessions_remaining?: number
      current_stamps?: number
    }
  }
}

export default function WalletPreviewPage() {
  const [selectedTab, setSelectedTab] = useState<'loyalty' | 'membership'>('loyalty')
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [loading, setLoading] = useState(false)
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({ apple: false, google: false, pwa: true })
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null)
  const [sessionMarking, setSessionMarking] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState('')

  // Test scenarios are created dynamically by the API

  // Load existing test data
  const loadExistingData = async (cardType: 'loyalty' | 'membership') => {
    try {
      let url: string
      
      if (cardType === 'loyalty') {
        url = '/api/dev-seed'
      } else {
        url = '/api/dev-seed/membership'
      }

      const response = await fetch(url, {
        method: 'GET'
      })

      if (!response.ok) {
        console.log(`No existing ${cardType} data found, will show empty state`)
        setTestCards([])
        return
      }

      const data = await response.json()
      
      if (cardType === 'loyalty') {
        // Process loyalty card data
        const cards = data.cards?.map((card: { customerCardId?: string; id?: string; scenario?: string; current_stamps?: number; total_stamps?: number; [key: string]: unknown }) => ({
          id: card.customerCardId || card.id || '',
          scenario: card.scenario || 'unknown',
          cardType: 'loyalty' as const,
          progress: ((card.current_stamps || 0) / (card.total_stamps || 10)) * 100,
          isCompleted: (card.current_stamps || 0) >= (card.total_stamps || 10),
          details: card
        })) || []
        setTestCards(cards)
      } else {
        // Process membership card data (now using consistent structure)
        const cards = data.memberships?.map((membership: { customerCardId?: string; scenario?: string; membership?: { id?: string; progress?: number; sessions_used?: number; total_sessions?: number; is_expired?: boolean }; [key: string]: unknown }) => ({
          id: membership.customerCardId || membership.membership?.id || '',
          scenario: membership.scenario || 'unknown',
          cardType: 'gym' as const,
          progress: membership.membership?.progress || 0,
          isCompleted: (membership.membership?.sessions_used || 0) >= (membership.membership?.total_sessions || 20),
          isExpired: membership.membership?.is_expired || false,
          details: membership
        })) || []
        setTestCards(cards)
      }

      console.log(`✅ Loaded existing ${cardType} data:`, data)
    } catch (error) {
      console.error('Error loading existing data:', error)
      setTestCards([])
    }
  }

  // Generate test data based on selected card type
  const generateTestData = async (cardType: 'loyalty' | 'membership', scenario?: string) => {
    setLoading(true)
    try {
      let url: string
      let payload: { scenario?: string; count?: number; createAll?: boolean }

      if (cardType === 'loyalty') {
        url = '/api/dev-seed'
        payload = scenario ? { scenario, count: 1 } : { createAll: true }
      } else {
        url = '/api/dev-seed/membership'
        payload = scenario ? { scenario, count: 1 } : { scenario: 'all', count: 1 }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to generate test data: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (cardType === 'loyalty') {
        // Process loyalty card data
        const cards = data.cards?.map((card: { customerCardId?: string; id?: string; scenario?: string; current_stamps?: number; total_stamps?: number; [key: string]: unknown }) => ({
          id: card.customerCardId || card.id || '',
          scenario: card.scenario || 'unknown',
          cardType: 'loyalty' as const,
          progress: ((card.current_stamps || 0) / (card.total_stamps || 10)) * 100,
          isCompleted: (card.current_stamps || 0) >= (card.total_stamps || 10),
          details: card
        })) || []
        setTestCards(cards)
      } else {
        // Process membership card data
        const cards = data.memberships?.map((membership: { customerCardId?: string; scenario?: string; membership?: { id?: string; progress?: number; sessions_used?: number; total_sessions?: number; is_expired?: boolean }; [key: string]: unknown }) => ({
          id: membership.customerCardId || membership.membership?.id || '',
          scenario: membership.scenario || 'unknown',
          cardType: 'gym' as const,
          progress: membership.membership?.progress || 0,
          isCompleted: (membership.membership?.sessions_used || 0) >= (membership.membership?.total_sessions || 20),
          isExpired: membership.membership?.is_expired || false,
          details: membership
        })) || []
        setTestCards(cards)
      }

      console.log(`✅ Generated ${cardType} test data:`, data)
    } catch (error) {
      console.error('Error generating test data:', error)
      alert(`Failed to generate test data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  // Check wallet environment status
  const checkWalletStatus = async () => {
    try {
      const response = await fetch('/api/health/env')
      if (response.ok) {
        const data = await response.json()
        console.log('Environment data:', data) // Debug logging
        setWalletStatus({
          apple: data.appleWallet?.configured || false,
          google: data.googleWallet?.configured || false,
          pwa: true // PWA is always available
        })
      }
    } catch (error) {
      console.error('Error checking wallet status:', error)
      // Set default values on error
      setWalletStatus({
        apple: false,
        google: false,
        pwa: true
      })
    }
  }

  // Generate wallet pass
  const generateWallet = async (cardId: string, walletType: 'apple' | 'google' | 'pwa') => {
    try {
      const cardType = selectedTab === 'loyalty' ? '' : 'membership/'
      const url = `/api/wallet/${walletType}/${cardType}${cardId}`
      
      if (walletType === 'apple') {
        // For Apple Wallet, try to download PKPass or show preview
        const response = await fetch(url)
        if (response.headers.get('content-type')?.includes('application/vnd.apple.pkpass')) {
          // Download PKPass file
          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = `${selectedTab}-${cardId.substring(0, 8)}.pkpass`
          a.click()
          window.URL.revokeObjectURL(downloadUrl)
        } else {
          // Open preview in new tab
          window.open(url, '_blank')
        }
      } else {
        // Open in new tab for Google Wallet and PWA
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error(`Error generating ${walletType} wallet:`, error)
      alert(`Failed to generate ${walletType} wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mark session or stamp
  const markUsage = async (cardId: string, usageType: 'session' | 'stamp') => {
    if (!selectedBusiness) {
      alert('Please select a business first')
      return
    }

    setSessionMarking(true)
    try {
      const response = await fetch(`/api/wallet/mark-session/${cardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness,
          usageType,
          notes: `Test ${usageType} marking from wallet preview`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark usage')
      }

      const result = await response.json()
      setLastUpdate({
        timestamp: new Date().toISOString(),
        type: usageType,
        success: true,
        details: result
      })

      // Refresh test data to show updated progress
      await generateTestData(selectedTab)
      
      console.log(`✅ ${usageType} marked successfully:`, result)
    } catch (error) {
      console.error(`Error marking ${usageType}:`, error)
      setLastUpdate({
        timestamp: new Date().toISOString(),
        type: usageType,
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
    setSessionMarking(false)
  }

  // Initialize page
  useEffect(() => {
    checkWalletStatus()
    loadExistingData(selectedTab)
  }, [])

  // Switch card type
  useEffect(() => {
    if (selectedTab) {
      loadExistingData(selectedTab)
    }
  }, [selectedTab])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Preview Testing</h1>
        <p className="text-gray-600">Test RewardJar 4.0 wallet integration with real-time data synchronization</p>
      </div>

      {/* Environment Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Environment Status
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkWalletStatus}
            >
              Refresh Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${walletStatus.apple ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">Apple Wallet</p>
              <p className={`text-xs ${walletStatus.apple ? 'text-green-600' : 'text-red-600'}`}>
                {walletStatus.apple ? 'Configured' : 'Not Configured'}
              </p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${walletStatus.google ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">Google Wallet</p>
              <p className={`text-xs ${walletStatus.google ? 'text-green-600' : 'text-red-600'}`}>
                {walletStatus.google ? 'Configured' : 'Not Configured'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-2 bg-green-500"></div>
              <p className="text-sm font-medium">PWA Wallet</p>
              <p className="text-xs text-green-600">Always Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Testing Interface */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Wallet Testing Interface</CardTitle>
            <Button 
              onClick={() => generateTestData(selectedTab)} 
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Regenerate Test Data'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'loyalty' | 'membership')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="loyalty" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Loyalty Cards
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gym Memberships
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="loyalty" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Loyalty Card Test Scenarios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testCards.filter(card => card.cardType === 'loyalty').map((card) => (
                    <TestCardComponent
                      key={card.id}
                      card={card}
                      onGenerateWallet={generateWallet}
                      onMarkUsage={markUsage}
                      walletStatus={walletStatus}
                      isMarking={sessionMarking}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="membership" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gym Membership Test Scenarios</h3>
                  <div className="flex gap-2">
                    <Select onValueChange={setSelectedBusiness} value={selectedBusiness}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select business for testing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="test-gym-1">Test Gym 1</SelectItem>
                        <SelectItem value="test-gym-2">Test Gym 2</SelectItem>
                        <SelectItem value="test-gym-3">Test Gym 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testCards.filter(card => card.cardType === 'gym').map((card) => (
                    <TestCardComponent
                      key={card.id}
                      card={card}
                      onGenerateWallet={generateWallet}
                      onMarkUsage={markUsage}
                      walletStatus={walletStatus}
                      isMarking={sessionMarking}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Update Status */}
      {lastUpdate && (
        <Card className={lastUpdate.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {lastUpdate.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold ${lastUpdate.success ? 'text-green-800' : 'text-red-800'}`}>
                  {lastUpdate.success ? 'Update Successful' : 'Update Failed'}
                </h4>
                <p className={`text-sm ${lastUpdate.success ? 'text-green-700' : 'text-red-700'}`}>
                  {lastUpdate.success ? (
                                         `${lastUpdate.type === 'session' ? 'Session' : 'Stamp'} marked successfully. 
                      ${lastUpdate.type === 'session' ? 
                        `Remaining: ${lastUpdate.details.result?.sessions_remaining || 0}` : 
                        `Current: ${lastUpdate.details.result?.current_stamps || 0}`}`
                  ) : (
                                         lastUpdate.details.error || 'Unknown error'
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(lastUpdate.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Generate Test Data</h4>
            <p className="text-sm text-gray-600">
              Click &quot;Regenerate Test Data&quot; to create fresh test scenarios for the selected card type.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Test Wallet Generation</h4>
            <p className="text-sm text-gray-600">
              Use the Apple (🍎), Google (G), and PWA (📱) buttons to generate wallet passes for each scenario.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Test Data Synchronization</h4>
            <p className="text-sm text-gray-600">
              For gym memberships, select a business and use &quot;Mark Session&quot; to test real-time updates.
              For loyalty cards, use &quot;Add Stamp&quot; to test stamp collection.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">4. Verify Updates</h4>
            <p className="text-sm text-gray-600">
              After marking sessions/stamps, regenerate wallets to verify that updates are reflected immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual test card component
function TestCardComponent({ 
  card, 
  onGenerateWallet, 
  onMarkUsage, 
  walletStatus, 
  isMarking 
}: {
  card: TestCard
  onGenerateWallet: (cardId: string, walletType: 'apple' | 'google' | 'pwa') => void
  onMarkUsage: (cardId: string, usageType: 'session' | 'stamp') => void
  walletStatus: WalletStatus
  isMarking: boolean
}) {
  const [walletGenerating, setWalletGenerating] = useState<Record<string, boolean>>({})
  
  const handleGenerateWallet = async (type: 'apple' | 'google' | 'pwa') => {
    setWalletGenerating(prev => ({ ...prev, [type]: true }))
    await onGenerateWallet(card.id, type)
    setWalletGenerating(prev => ({ ...prev, [type]: false }))
  }
  
  const getStatusColor = () => {
    if (card.isExpired) return 'border-red-200 bg-red-50'
    if (card.isCompleted) return 'border-green-200 bg-green-50'
    return 'border-blue-200 bg-blue-50'
  }
  
  const getProgressText = () => {
    if (card.cardType === 'gym') {
      const details = card.details.membership || card.details
      return `${details.sessions_used || 0}/${details.total_sessions || 20} sessions`
    } else {
      const details = card.details
      return `${details.current_stamps || 0}/${details.total_stamps || 10} stamps`
    }
  }
  
  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-sm">{card.scenario.replace(/_/g, ' ').toUpperCase()}</CardTitle>
            <p className="text-xs text-gray-600">{getProgressText()}</p>
          </div>
          <Badge variant={card.isExpired ? 'destructive' : card.isCompleted ? 'default' : 'secondary'}>
            {card.isExpired ? 'Expired' : card.isCompleted ? 'Complete' : 'Active'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{Math.round(card.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                card.isCompleted ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(card.progress, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Card Details */}
        <div className="text-xs text-gray-600 space-y-1">
          {card.cardType === 'gym' ? (
            <>
              <p>Cost: ₩{(card.details.membership?.cost || card.details.cost || 15000).toLocaleString()}</p>
              {card.details.membership?.expiry_date && (
                <p>Expires: {new Date(card.details.membership.expiry_date).toLocaleDateString()}</p>
              )}
            </>
          ) : (
            <>
              <p>Business: {card.details.business?.name || 'Test Business'}</p>
              <p>Reward: {card.details.reward_description || 'Free item'}</p>
            </>
          )}
          <p>ID: {card.id.substring(0, 8)}</p>
        </div>
        
        {/* Wallet Generation Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateWallet('apple')}
              disabled={walletGenerating.apple || !walletStatus.apple}
              className="text-xs"
              title={walletStatus.apple ? 'Generate Apple Wallet' : 'Apple Wallet not configured'}
            >
              {walletGenerating.apple ? '...' : '🍎'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateWallet('google')}
              disabled={walletGenerating.google || !walletStatus.google}
              className="text-xs"
              title={walletStatus.google ? 'Generate Google Wallet' : 'Google Wallet not configured'}
            >
              {walletGenerating.google ? '...' : 'G'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleGenerateWallet('pwa')}
              disabled={walletGenerating.pwa}
              className="text-xs"
              title="Generate PWA Wallet"
            >
              {walletGenerating.pwa ? '...' : '📱'}
            </Button>
          </div>
          
          {/* Mark Usage Button */}
          {!card.isExpired && !card.isCompleted && (
            <Button
              size="sm"
              onClick={() => onMarkUsage(card.id, card.cardType === 'gym' ? 'session' : 'stamp')}
              disabled={isMarking}
              className="w-full text-xs"
            >
              {isMarking ? 'Marking...' : 
                card.cardType === 'gym' ? 'Mark Session' : 'Add Stamp'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}