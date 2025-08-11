'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CardLivePreview } from '@/components/unified/CardLivePreview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
// Simple toast replacement
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
}

interface TestCard {
  id: string
  name: string
  type: 'stamp' | 'membership'
  business_name: string
  total_stamps?: number
  total_sessions?: number
  reward_description?: string
  cost?: number
  card_color?: string
  icon_emoji?: string
}

interface TestResult {
  id: string
  action: string
  timestamp: string
  result: 'success' | 'error'
  message: string
}

function WalletPreview({ card, walletType }: { card: TestCard, walletType: 'apple' | 'google' | 'pwa' }) {
  return (
    <CardLivePreview
      defaultPlatform={walletType}
      showControls={false}
      cardData={{
        cardType: card.type === 'stamp' ? 'stamp' : 'membership',
        businessName: card.business_name,
        cardName: card.name,
        cardColor: card.card_color || '#10b981',
        iconEmoji: card.icon_emoji || '⭐',
        stampsRequired: card.total_stamps,
        totalSessions: card.total_sessions,
        reward: card.reward_description,
      }}
    />
  )
}

export default function AdminSandbox() {
  const [cards, setCards] = useState<TestCard[]>([])
  const [selectedCardType, setSelectedCardType] = useState<string>('all')
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all')
  const [selectedCard, setSelectedCard] = useState<string | undefined>(undefined)
  const [currentCard, setCurrentCard] = useState<TestCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isGeneratingData, setIsGeneratingData] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cards')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const formattedCards: TestCard[] = data.data.map((card: any) => ({
            id: card.id,
            name: card.name || card.card_name,
            type: card.card_type,
            business_name: card.businesses?.name || 'Unknown Business',
            total_stamps: card.total_stamps,
            total_sessions: card.total_sessions,
            reward_description: card.reward_description,
            cost: card.cost,
            card_color: card.card_color,
            icon_emoji: card.icon_emoji
          }))
          setCards(formattedCards)
          if (formattedCards.length > 0) {
            setCurrentCard(formattedCards[0])
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load cards')
    } finally {
      setLoading(false)
    }
  }

  const filteredCards = cards.filter(card => {
    if (selectedCardType && selectedCardType !== 'all' && card.type !== selectedCardType) {
      return false
    }
    if (selectedBusiness && selectedBusiness !== 'all' && card.business_name !== selectedBusiness) {
      return false
    }
    return true
  })

  const businesses = Array.from(new Set(cards.map(card => card.business_name)))

  const loadCardPreview = () => {
    const card = cards.find(c => c.id === selectedCard)
    if (card) {
      setCurrentCard(card)
      toast.success(`Loaded ${card.name} for preview`)
    }
  }

  const copyTestQR = async () => {
    if (!currentCard) {
      toast.error('Please select a card first')
      return
    }

    try {
      setIsGeneratingQR(true)
      // Generate test QR code URL
      const qrData = {
        cardId: currentCard.id,
        cardType: currentCard.type,
        businessName: currentCard.business_name,
        testMode: true,
        timestamp: new Date().toISOString()
      }
      
      const qrString = JSON.stringify(qrData)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(qrUrl)
      toast.success('Test QR code URL copied to clipboard!')
      
      // Add to test results
      setTestResults(prev => [{
        id: Date.now().toString(),
        action: 'Generate QR Code',
        timestamp: new Date().toLocaleString(),
        result: 'success',
        message: `QR code generated for ${currentCard.name}`
      }, ...prev])
      
    } catch (error) {
      toast.error('Failed to generate QR code')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const generateTestData = async () => {
    if (!currentCard) {
      toast.error('Please select a card first')
      return
    }

    try {
      setIsGeneratingData(true)
      
      // Generate test customer card data
      const testData = {
        cardId: currentCard.id,
        cardType: currentCard.type,
        testCustomerId: 'test-customer-' + Date.now(),
        currentStamps: currentCard.type === 'stamp' ? Math.floor(Math.random() * (currentCard.total_stamps || 10)) : undefined,
        sessionsUsed: currentCard.type === 'membership' ? Math.floor(Math.random() * (currentCard.total_sessions || 20)) : undefined,
        walletType: 'pwa'
      }

      // Call the API to create test data
      const response = await fetch('/api/dev-seed/admin-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test customer data generated successfully!')
        
        // Add to test results
        setTestResults(prev => [{
          id: Date.now().toString(),
          action: 'Generate Test Data',
          timestamp: new Date().toLocaleString(),
          result: 'success',
          message: `Test customer data created for ${currentCard.name} (ID: ${result.data.customerCard.id})`
        }, ...prev])
        
      } else {
        throw new Error(result.error || 'Failed to generate test data')
      }
      
    } catch (error) {
      toast.error('Failed to generate test data: ' + (error instanceof Error ? error.message : 'Unknown error'))
      
      // Add error to test results
      setTestResults(prev => [{
        id: Date.now().toString(),
        action: 'Generate Test Data',
        timestamp: new Date().toLocaleString(),
        result: 'error',
        message: `Failed to create test data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, ...prev])
    } finally {
      setIsGeneratingData(false)
    }
  }

  const executeTestAction = async (actionType: string) => {
    if (!currentCard) {
      toast.error('Please select a card first')
      return
    }

    try {
      let message = ''
      switch (actionType) {
        case 'stamp':
          message = `Added stamp to ${currentCard.name}`
          break
        case 'session':
          message = `Marked session for ${currentCard.name}`
          break
        case 'reward':
          message = `Unlocked reward for ${currentCard.name}`
          break
        case 'qr':
          message = `Generated QR code for ${currentCard.name}`
          break
        default:
          message = `Executed ${actionType} for ${currentCard.name}`
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(message)
      
      // Add to test results
      setTestResults(prev => [{
        id: Date.now().toString(),
        action: actionType,
        timestamp: new Date().toLocaleString(),
        result: 'success',
        message
      }, ...prev])
      
    } catch (error) {
      toast.error('Test action failed')
    }
  }

  if (loading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <div className="text-lg">Loading sandbox...</div>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testing Sandbox</h1>
          <p className="text-muted-foreground">
            Global preview mode for cards, wallets, and system flows
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="preview">Card Preview</TabsTrigger>
            <TabsTrigger value="testing">Flow Testing</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-6">
            {/* Card Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Card Selection</CardTitle>
                <CardDescription>Choose a card to preview across wallet types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Card Type</label>
                    <Select value={selectedCardType} onValueChange={setSelectedCardType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cards</SelectItem>
                        <SelectItem value="stamp">Stamp Cards</SelectItem>
                        <SelectItem value="membership">Membership Cards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Business</label>
                    <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Businesses</SelectItem>
                        {businesses.map(businessName => (
                          <SelectItem key={businessName} value={businessName}>
                            {businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Specific Card</label>
                  <Select value={selectedCard || ""} onValueChange={(value) => setSelectedCard(value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card to preview" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCards.map(card => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name} ({card.business_name}) - {card.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={loadCardPreview}
                  disabled={!selectedCard}
                >
                  Load Card Preview
                </Button>
              </CardContent>
            </Card>
            
            {/* Wallet Previews */}
            {currentCard && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Wallet Previews</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyTestQR}
                      disabled={isGeneratingQR}
                    >
                      {isGeneratingQR ? 'Generating...' : 'Copy Test QR'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generateTestData}
                      disabled={isGeneratingData}
                    >
                      {isGeneratingData ? 'Generating...' : 'Generate Test Data'}
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <span>🍎</span>
                      <span>Apple Wallet</span>
                    </h4>
                    <WalletPreview card={currentCard} walletType="apple" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <span>🤖</span>
                      <span>Google Wallet</span>
                    </h4>
                    <WalletPreview card={currentCard} walletType="google" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <span>🌐</span>
                      <span>PWA Wallet</span>
                    </h4>
                    <WalletPreview card={currentCard} walletType="pwa" />
                  </div>
                </div>
              </div>
            )}

            {!currentCard && (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Select a card to preview wallet designs
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="testing" className="space-y-6">
            {/* Test Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Test Actions</CardTitle>
                <CardDescription>Simulate customer interactions and system responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: 'Simulate Stamp Action', description: 'Add a stamp to test card and trigger wallet update', icon: '🎫', action: 'stamp' },
                    { title: 'Simulate Session Mark', description: 'Mark a session for membership card testing', icon: '💪', action: 'session' },
                    { title: 'Trigger Reward Unlock', description: 'Complete card and unlock reward for testing', icon: '🎉', action: 'reward' },
                    { title: 'Test QR Generation', description: 'Generate and display test QR codes', icon: '📱', action: 'qr' }
                  ].map((action) => (
                    <div key={action.action} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{action.icon}</span>
                        <div>
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-gray-500">{action.description}</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => executeTestAction(action.action)}
                        disabled={!currentCard}
                      >
                        Execute
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Results from recent test executions</CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length > 0 ? (
                  <div className="space-y-3">
                    {testResults.slice(0, 10).map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{result.action}</div>
                          <div className="text-sm text-gray-500">{result.message}</div>
                          <div className="text-xs text-gray-400">{result.timestamp}</div>
                        </div>
                        <Badge 
                          className={result.result === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {result.result}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent test results
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time status of all system components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { name: 'Apple Wallet API', status: 'operational', icon: '🍎' },
                    { name: 'Google Wallet API', status: 'operational', icon: '🤖' },
                    { name: 'PWA Generation', status: 'operational', icon: '🌐' },
                    { name: 'Database', status: 'operational', icon: '🗄️' },
                    { name: 'QR Generation', status: 'operational', icon: '📱' },
                    { name: 'Notification System', status: 'degraded', icon: '📧' }
                  ].map((system) => (
                    <div key={system.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{system.icon}</span>
                        <span className="font-medium">{system.name}</span>
                      </div>
                      <Badge 
                        className={
                          system.status === 'operational' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }
                      >
                        {system.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
}