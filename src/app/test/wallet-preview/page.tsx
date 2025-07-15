'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Download, 
  Globe, 
  Search, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Copy,
  Eye,
  Wallet,
  CreditCard,
  Trophy,
  Star
} from 'lucide-react'

interface CustomerCard {
  id: string
  customer_id: string
  current_stamps: number
  wallet_type: string | null
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
  customer: {
    name: string
    email: string
  }
}

interface DatabaseStampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  businesses: {
    name: string
    description: string
  }[]
}

interface DatabaseCustomer {
  name: string
  email: string
}

interface DatabaseCustomerCard {
  id: string
  customer_id: string
  current_stamps: number
  wallet_type: string | null
  wallet_pass_id: string | null
  created_at: string
  stamp_cards: DatabaseStampCard[]
  customers: DatabaseCustomer[]
}

interface TestResult {
  success: boolean
  message?: string
  data?: unknown
}

interface WalletStatus {
  apple: {
    configured: boolean
    certificates: boolean
    teamId: boolean
    passTypeId: boolean
  }
  google: {
    configured: boolean
    serviceAccount: boolean
    classId: boolean
    privateKey: boolean
  }
  pwa: {
    configured: boolean
  }
}

export default function WalletPreviewPage() {
  const [customerCards, setCustomerCards] = useState<CustomerCard[]>([])
  const [selectedCard, setSelectedCard] = useState<CustomerCard | null>(null)
  const [customerCardId, setCustomerCardId] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [walletStatusLoading, setWalletStatusLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    apple: {
      configured: false,
      certificates: false,
      teamId: false,
      passTypeId: false
    },
    google: {
      configured: false,
      serviceAccount: false,
      classId: false,
      privateKey: false
    },
    pwa: {
      configured: true // PWA is always available
    }
  })
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const supabase = createClient()

  const fetchAllCustomerCards = useCallback(async () => {
    try {
      setSearchLoading(true)
      
      // Get all customer cards with related data
      const { data: cards, error } = await supabase
        .from('customer_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          wallet_type,
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
          ),
          customers!inner (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching customer cards:', error)
        setError('Failed to load customer cards')
        return
      }

      if (cards && cards.length > 0) {
        const formattedCards = (cards as DatabaseCustomerCard[]).map(card => ({
          id: card.id,
          customer_id: card.customer_id,
          current_stamps: card.current_stamps,
          wallet_type: card.wallet_type,
          wallet_pass_id: card.wallet_pass_id,
          created_at: card.created_at,
          stamp_card: {
            id: card.stamp_cards[0].id,
            name: card.stamp_cards[0].name,
            total_stamps: card.stamp_cards[0].total_stamps,
            reward_description: card.stamp_cards[0].reward_description,
            business: {
              name: card.stamp_cards[0].businesses[0].name,
              description: card.stamp_cards[0].businesses[0].description
            }
          },
          customer: {
            name: card.customers[0].name,
            email: card.customers[0].email
          }
        }))
        setCustomerCards(formattedCards)
      } else {
        setCustomerCards([])
      }
    } catch (err) {
      console.error('Error fetching customer cards:', err)
      setError('Something went wrong while loading customer cards')
    } finally {
      setSearchLoading(false)
    }
  }, [supabase])

  const checkWalletStatus = useCallback(async () => {
    try {
      setWalletStatusLoading(true)
      const response = await fetch('/api/health/wallet')
      const data = await response.json()
      
      console.log('Wallet status API response:', data) // Debug log
      
      if (response.ok) {
        const newWalletStatus = {
          apple: {
            configured: data.wallet_availability?.apple === 'available',
            certificates: data.checks?.apple_wallet || false,
            teamId: !!data.environment?.APPLE_TEAM_IDENTIFIER,
            passTypeId: !!data.environment?.APPLE_PASS_TYPE_IDENTIFIER
          },
          google: {
            configured: data.wallet_availability?.google === 'available',
            serviceAccount: data.checks?.google_wallet || false,
            classId: !!data.environment?.GOOGLE_CLASS_ID,
            privateKey: !!data.environment?.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
          },
          pwa: {
            configured: true // PWA is always available
          }
        }
        
        console.log('Setting wallet status:', newWalletStatus) // Debug log
        setWalletStatus(newWalletStatus)
      }
    } catch (err) {
      console.error('Error checking wallet status:', err)
    } finally {
      setWalletStatusLoading(false)
    }
  }, [])

  // Load all customer cards on component mount
  useEffect(() => {
    fetchAllCustomerCards()
    checkWalletStatus()
  }, [fetchAllCustomerCards, checkWalletStatus])

  const searchCustomerCard = async (cardId: string) => {
    if (!cardId.trim()) {
      setError('Please enter a customer card ID')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data: card, error } = await supabase
        .from('customer_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          wallet_type,
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
          ),
          customers!inner (
            name,
            email
          )
        `)
        .eq('id', cardId)
        .single()

      if (error || !card) {
        setError('Customer card not found')
        setSelectedCard(null)
        return
      }

      const dbCard = card as DatabaseCustomerCard
      const formattedCard: CustomerCard = {
        id: dbCard.id,
        customer_id: dbCard.customer_id,
        current_stamps: dbCard.current_stamps,
        wallet_type: dbCard.wallet_type,
        wallet_pass_id: dbCard.wallet_pass_id,
        created_at: dbCard.created_at,
        stamp_card: {
          id: dbCard.stamp_cards[0].id,
          name: dbCard.stamp_cards[0].name,
          total_stamps: dbCard.stamp_cards[0].total_stamps,
          reward_description: dbCard.stamp_cards[0].reward_description,
          business: {
            name: dbCard.stamp_cards[0].businesses[0].name,
            description: dbCard.stamp_cards[0].businesses[0].description
          }
        },
        customer: {
          name: dbCard.customers[0].name,
          email: dbCard.customers[0].email
        }
      }

      setSelectedCard(formattedCard)
      setCustomerCardId(cardId)
    } catch (err) {
      console.error('Error searching customer card:', err)
      setError('Something went wrong while searching')
    } finally {
      setLoading(false)
    }
  }

  const testWalletEndpoint = async (walletType: 'apple' | 'google' | 'pwa', debug = false) => {
    if (!selectedCard) {
      setError('Please select a customer card first')
      return
    }

    try {
      setLoading(true)
      const debugParam = debug ? '?debug=true' : ''
      const response = await fetch(`/api/wallet/${walletType}/${selectedCard.id}${debugParam}`)
      
      if (response.ok) {
        if (walletType === 'apple' && !debug) {
          // Download PKPass file
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${selectedCard.stamp_card.name.replace(/[^a-zA-Z0-9]/g, '_')}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          
          setTestResults(prev => ({
            ...prev,
            [walletType]: { success: true, message: 'PKPass downloaded successfully' }
          }))
        } else if (walletType === 'google' && !debug) {
          // Redirect to Google Wallet
          window.open(response.url, '_blank')
          setTestResults(prev => ({
            ...prev,
            [walletType]: { success: true, message: 'Opened Google Wallet' }
          }))
        } else if (walletType === 'pwa') {
          // Open PWA wallet
          window.open(response.url, '_blank')
          setTestResults(prev => ({
            ...prev,
            [walletType]: { success: true, message: 'Opened PWA wallet' }
          }))
        } else if (debug) {
          // Show debug information
          const debugData = await response.json()
          setTestResults(prev => ({
            ...prev,
            [`${walletType}_debug`]: { success: true, data: debugData }
          }))
        }
      } else {
        const errorData = await response.json()
        setTestResults(prev => ({
          ...prev,
          [walletType]: { success: false, message: errorData.message || 'Test failed' }
        }))
      }
    } catch (err) {
      console.error(`Error testing ${walletType} wallet:`, err)
      setTestResults(prev => ({
        ...prev,
        [walletType]: { success: false, message: 'Network error' }
      }))
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getWalletIcon = (walletType: string | null) => {
    switch (walletType) {
      case 'apple': return '🍎'
      case 'google': return '🤖'
      case 'pwa': return '🌐'
      default: return '💳'
    }
  }

  const getProgressColor = (current: number, total: number) => {
    const percentage = (current / total) * 100
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <Fragment>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Preview Testing</h1>
            <p className="text-gray-600">Test Apple Wallet, Google Wallet, and PWA functionality with any customer card</p>
          </div>

          {/* Wallet Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Apple Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Configured</span>
                    {walletStatusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : walletStatus.apple.configured ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Certificates</span>
                    {walletStatusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : walletStatus.apple.certificates ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Team ID</span>
                    {walletStatusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : walletStatus.apple.teamId ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="w-5 h-5 mr-2" />
                  Google Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Configured</span>
                    {walletStatusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : walletStatus.google.configured ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Account</span>
                    {walletStatusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : walletStatus.google.serviceAccount ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Class ID</span>
                    {walletStatusLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : walletStatus.google.classId ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Globe className="w-5 h-5 mr-2" />
                  PWA Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Configured</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Service Worker</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Manifest</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Card Selection */}
            <div className="space-y-6">
              {/* Search by ID */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    Search Customer Card
                  </CardTitle>
                  <CardDescription>
                    Enter a customer card ID to test wallet functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerCardId">Customer Card ID</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="customerCardId"
                        placeholder="Enter customer card UUID..."
                        value={customerCardId}
                        onChange={(e) => setCustomerCardId(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => searchCustomerCard(customerCardId)}
                        disabled={loading}
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Customer Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Recent Customer Cards
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchAllCustomerCards}
                      disabled={searchLoading}
                    >
                      {searchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Click on any card to select it for testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {customerCards.map((card) => (
                      <div 
                        key={card.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCard?.id === card.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedCard(card)
                          setCustomerCardId(card.id)
                          setError(null)
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getWalletIcon(card.wallet_type)}</span>
                            <span className="font-medium text-sm">{card.stamp_card.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {card.current_stamps}/{card.stamp_card.total_stamps}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Business: {card.stamp_card.business.name}</div>
                          <div>Customer: {card.customer.name}</div>
                          <div>Created: {formatDate(card.created_at)}</div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(card.current_stamps, card.stamp_card.total_stamps)}`}
                              style={{ width: `${Math.min((card.current_stamps / card.stamp_card.total_stamps) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {customerCards.length === 0 && !searchLoading && (
                      <div className="text-center text-gray-500 py-8">
                        <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No customer cards found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Testing Interface */}
            <div className="space-y-6">
              {/* Selected Card Info */}
              {selectedCard ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Selected Card Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Card Name:</span>
                        <p className="font-semibold">{selectedCard.stamp_card.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Business:</span>
                        <p className="font-semibold">{selectedCard.stamp_card.business.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Customer:</span>
                        <p className="font-semibold">{selectedCard.customer.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Wallet Type:</span>
                        <p className="font-semibold flex items-center">
                          <span className="mr-1">{getWalletIcon(selectedCard.wallet_type)}</span>
                          {selectedCard.wallet_type || 'None'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Progress:</span>
                        <p className="font-semibold">
                          {selectedCard.current_stamps}/{selectedCard.stamp_card.total_stamps} stamps
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <p className="font-semibold">
                          {selectedCard.current_stamps >= selectedCard.stamp_card.total_stamps ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Trophy className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Star className="w-3 h-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">Reward:</span>
                      <p className="text-sm mt-1">{selectedCard.stamp_card.reward_description}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">Customer Card ID:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">{selectedCard.id}</code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(selectedCard.id)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Wallet Testing Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Wallet Testing
                  </CardTitle>
                  <CardDescription>
                    Test wallet generation and functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedCard ? (
                    <div className="text-center text-gray-500 py-8">
                      <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Select a customer card to test wallet functionality</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Apple Wallet */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Smartphone className="w-5 h-5 mr-2" />
                            <span className="font-medium">Apple Wallet</span>
                          </div>
                          <Badge variant={walletStatus?.apple.configured ? "default" : "secondary"}>
                            {walletStatus?.apple.configured ? "Ready" : "Setup Required"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => testWalletEndpoint('apple')}
                            disabled={loading}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PKPass
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => testWalletEndpoint('apple', true)}
                            disabled={loading}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        {testResults.apple && (
                          <div className={`mt-2 text-sm ${testResults.apple.success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResults.apple.success ? '✅' : '❌'} {testResults.apple.message}
                          </div>
                        )}
                      </div>

                      {/* Google Wallet */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Wallet className="w-5 h-5 mr-2" />
                            <span className="font-medium">Google Wallet</span>
                          </div>
                          <Badge variant={walletStatus?.google.configured ? "default" : "secondary"}>
                            {walletStatus?.google.configured ? "Ready" : "Setup Required"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => testWalletEndpoint('google')}
                            disabled={loading}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Save to Google Pay
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => testWalletEndpoint('google', true)}
                            disabled={loading}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        {testResults.google && (
                          <div className={`mt-2 text-sm ${testResults.google.success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResults.google.success ? '✅' : '❌'} {testResults.google.message}
                          </div>
                        )}
                      </div>

                      {/* PWA Wallet */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Globe className="w-5 h-5 mr-2" />
                            <span className="font-medium">PWA Wallet</span>
                          </div>
                          <Badge variant="default">Always Ready</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => testWalletEndpoint('pwa')}
                            disabled={loading}
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Web App
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => window.open(`/customer/card/${selectedCard.id}`, '_blank')}
                            disabled={loading}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        {testResults.pwa && (
                          <div className={`mt-2 text-sm ${testResults.pwa.success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResults.pwa.success ? '✅' : '❌'} {testResults.pwa.message}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Debug Information */}
              {(testResults.apple_debug || testResults.google_debug) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Debug Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testResults.apple_debug && (
                        <div>
                          <h4 className="font-medium mb-2">Apple Wallet Debug Data:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(testResults.apple_debug.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {testResults.google_debug && (
                        <div>
                          <h4 className="font-medium mb-2">Google Wallet Debug Data:</h4>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(testResults.google_debug.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
} 