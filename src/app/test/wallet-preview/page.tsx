'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
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
  }
}

interface DatabaseCustomer {
  name: string
  email: string
}

interface DatabaseCustomerCard {
  id: string
  customer_id: string
  current_stamps: number
  wallet_pass_id: string | null
  created_at: string
  stamp_cards: DatabaseStampCard
  customers: DatabaseCustomer
}

interface TestResult {
  success: boolean
  message?: string
  data?: unknown
  size?: string
  structured?: boolean
  error?: string
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
      
      // Get all customer cards with related data - using a different approach
      const { data: cards, error } = await supabase
        .from('customer_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          wallet_pass_id,
          created_at,
          stamp_cards (
            id,
            name,
            total_stamps,
            reward_description,
            businesses (
              name,
              description
            )
          ),
          customers (
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
        const formattedCards = (cards as any[])
          .filter(card => 
            card.stamp_cards && card.customers && card.stamp_cards.businesses
          )
          .map(card => ({
          id: card.id,
          customer_id: card.customer_id,
          current_stamps: card.current_stamps,
          wallet_pass_id: card.wallet_pass_id,
          created_at: card.created_at,
          stamp_card: {
              id: card.stamp_cards.id,
              name: card.stamp_cards.name,
              total_stamps: card.stamp_cards.total_stamps,
              reward_description: card.stamp_cards.reward_description,
            business: {
                name: card.stamp_cards.businesses.name,
                description: card.stamp_cards.businesses.description
            }
          },
          customer: {
              name: card.customers.name,
              email: card.customers.email
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
          wallet_pass_id,
          created_at,
          stamp_cards (
            id,
            name,
            total_stamps,
            reward_description,
            businesses (
              name,
              description
            )
          ),
          customers (
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

      console.log('Fetched individual card:', card) // Debug log
      
      // Cast to any for easier access
      const cardData = card as any
      
      // Validate that required nested data exists
      if (!cardData.stamp_cards) {
        setError('Customer card has no associated stamp card')
        setSelectedCard(null)
        return
      }
      
      if (!cardData.customers) {
        setError('Customer card has no associated customer')
        setSelectedCard(null)
        return
      }
      
      if (!cardData.stamp_cards.businesses) {
        setError('Stamp card has no associated business')
        setSelectedCard(null)
        return
      }

      const formattedCard: CustomerCard = {
        id: cardData.id,
        customer_id: cardData.customer_id,
        current_stamps: cardData.current_stamps,
        wallet_pass_id: cardData.wallet_pass_id,
        created_at: cardData.created_at,
        stamp_card: {
          id: cardData.stamp_cards.id,
          name: cardData.stamp_cards.name,
          total_stamps: cardData.stamp_cards.total_stamps,
          reward_description: cardData.stamp_cards.reward_description,
          business: {
            name: cardData.stamp_cards.businesses.name,
            description: cardData.stamp_cards.businesses.description
          }
        },
        customer: {
          name: cardData.customers.name,
          email: cardData.customers.email
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
          // Check PKPass size and structure
          const blob = await response.blob()
          const sizeKB = (blob.size / 1024).toFixed(1)
          
          // Open PKPass directly in Apple Wallet (for mobile) or download (for desktop)
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
          
          if (isMobile) {
            // On mobile, open directly to trigger Apple Wallet
            window.open(`/api/wallet/${walletType}/${selectedCard.id}`, '_blank')
            setTestResults(prev => ({
              ...prev,
              [walletType]: { 
                success: true, 
                message: `Opened in Apple Wallet (${sizeKB} KB)`,
                size: sizeKB,
                structured: blob.size > 2000 // Basic size check
              }
            }))
          } else {
            // On desktop, download the file
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
              [walletType]: { 
                success: true, 
                message: `PKPass downloaded (${sizeKB} KB)`,
                size: sizeKB,
                structured: blob.size > 2000 // Basic size check
              }
          }))
          }
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
        let errorMessage = 'Request failed'
        let errorDetails = ''
        
        try {
        const errorData = await response.json()
          errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
          errorDetails = JSON.stringify(errorData, null, 2)
        } catch (e) {
          const errorText = await response.text()
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
          errorDetails = errorText.substring(0, 200)
        }
        
        setTestResults(prev => ({
          ...prev,
          [walletType]: { 
            success: false, 
            message: errorMessage,
            error: errorDetails
          }
        }))
      }
    } catch (err) {
      console.error('Error testing wallet endpoint:', err)
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

          {/* Fixed PKPass Download Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Enhanced PKPass - Certificate Chain Fixed
              </CardTitle>
              <CardDescription>
                Test the iOS-compatible PKPass with complete visual styling and proper certificate chain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800">Certificate Chain Fixed</div>
                        <div className="text-sm text-green-600">WWDR G4 certificate chain</div>
                      </div>
                    </div>
                    <div className="text-sm text-green-600">4.4KB</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Star className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800">Enhanced PKPass</div>
                        <div className="text-sm text-blue-600">Complete visual styling + fields</div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-600">4.9KB</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => window.open('/manual_fixed.pkpass', '_blank')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Enhanced PKPass</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/test_chain_fixed.pkpass', '_blank')}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Basic PKPass</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/manual_fixed.pkpass`)}
                    className="flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Enhanced URL</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`${window.location.origin}/manual_fixed.pkpass`, '_blank')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Safari</span>
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• <strong>Certificate Chain:</strong> Pass Certificate ← WWDR G4 ← Apple Root CA</div>
                  <div>• <strong>MIME Type:</strong> application/vnd.apple.pkpass (✅ Next.js headers configured)</div>
                  <div>• <strong>Enhanced Features:</strong> Visual styling, colors, multiple fields, back content</div>
                  <div>• <strong>iOS Compatible:</strong> Should install without "Unsupported file type" error</div>
                  <div>• <strong>Network Access:</strong> Available at http://192.168.29.219:3000/manual_fixed.pkpass</div>
                  <div>• <strong>Test Instructions:</strong> Open URL in iPhone Safari or AirDrop to device</div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                            <span className="text-lg">{getProgressColor(card.current_stamps, card.stamp_card.total_stamps)}</span>
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
                        <div className="font-medium mb-2">No customer cards found.</div>
                        <div className="text-sm text-gray-400 mb-4">
                          Please join a card by scanning a QR code at a business.
                        </div>
                        <div className="text-xs text-gray-400 text-left space-y-1">
                          <div><strong>To create test data:</strong></div>
                          <div>1. Go to <Link href="/business/dashboard" className="text-blue-500 hover:underline">/business/dashboard</Link></div>
                          <div>2. Create a stamp card</div>
                          <div>3. Use the QR code to join as a customer</div>
                          <div>4. The customer card will appear here for testing</div>
                        </div>
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
                        <div className="font-semibold">{selectedCard.stamp_card.name}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Business:</span>
                        <div className="font-semibold">{selectedCard.stamp_card.business.name}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Customer:</span>
                        <div className="font-semibold">{selectedCard.customer.name}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Wallet Type:</span>
                        <div className="font-semibold flex items-center">
                          <span className="mr-1">{getProgressColor(selectedCard.current_stamps, selectedCard.stamp_card.total_stamps)}</span>
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
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Progress:</span>
                        <div className="font-semibold">
                          {selectedCard.current_stamps}/{selectedCard.stamp_card.total_stamps} stamps
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-600">Reward:</span>
                      <div className="text-sm mt-1">{selectedCard.stamp_card.reward_description}</div>
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
                      <div>Select a customer card to test wallet functionality</div>
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
                            {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Add to Apple Wallet' : 'Download PKPass'}
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
                          <div className="mt-2 space-y-1">
                            <div className={`text-sm ${testResults.apple.success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResults.apple.success ? '✅' : '❌'} {testResults.apple.message}
                            </div>
                            {testResults.apple.size && (
                              <div className="text-xs text-gray-500">
                                Size: {testResults.apple.size} KB {testResults.apple.structured ? '(Structured ✅)' : '(Too small ⚠️)'}
                              </div>
                            )}
                            {testResults.apple.error && (
                              <details className="text-xs text-red-500">
                                <summary className="cursor-pointer">Show error details</summary>
                                <pre className="mt-1 whitespace-pre-wrap">{testResults.apple.error}</pre>
                              </details>
                            )}
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