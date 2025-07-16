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
  Star,
  Plus,
  Trash2,
  Database,
  TestTube,
  Zap,
  FileJson,
  Monitor,
  Clock,
  BarChart3
} from 'lucide-react'

interface TestCard {
  id: string
  customer_id: string
  current_stamps: number
  wallet_pass_id: string | null
  created_at: string
  updated_at?: string
  stamp_card: {
    id: string
    name: string
    total_stamps: number
    reward_description: string
    business: {
      name: string
      description: string | null
    }
  }
  customer: {
    name: string
    email: string
  }
}

interface WalletStatus {
  apple: 'loading' | 'success' | 'error' | 'idle'
  google: 'loading' | 'success' | 'error' | 'idle'
  pwa: 'loading' | 'success' | 'error' | 'idle'
}

interface AppleWalletPayload {
  formatVersion: number
  passTypeIdentifier: string
  serialNumber: string
  teamIdentifier: string
  organizationName: string
  description: string
  storeCard: {
    headerFields: Array<{ key: string; label: string; value: string }>
    primaryFields: Array<{ key: string; label: string; value: string }>
    secondaryFields: Array<{ key: string; label: string; value: string }>
    auxiliaryFields: Array<{ key: string; label: string; value: string }>
  }
  barcode: {
    format: string
    message: string
    messageEncoding: string
  }
  backgroundColor: string
  foregroundColor: string
  labelColor: string
}

export default function WalletPreviewPage() {
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [walletStatus, setWalletStatus] = useState<Record<string, WalletStatus>>({})
  const [applePayloads, setApplePayloads] = useState<Record<string, AppleWalletPayload>>({})
  const [generatingScenarios, setGeneratingScenarios] = useState(false)
  const [expandedJsonViewer, setExpandedJsonViewer] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchTestCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all customer cards with related data
      const { data: cards, error } = await supabase
        .from('customer_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          wallet_pass_id,
          created_at,
          updated_at,
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
        setError('Failed to load customer cards: ' + error.message)
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
            updated_at: card.updated_at,
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
        setTestCards(formattedCards)
      } else {
        setTestCards([])
      }
    } catch (error) {
      console.error('Error fetching test cards:', error)
      setError('Failed to load test cards')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const generateAllScenarios = async () => {
    try {
      setGeneratingScenarios(true)
      setError(null)

      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ createAll: true }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate test scenarios')
      }

      // Refresh the cards list
      await fetchTestCards()
      
      // Show success message
      console.log('Generated test scenarios:', result)
      
    } catch (error) {
      console.error('Error generating scenarios:', error)
      setError('Failed to generate test scenarios: ' + (error as Error).message)
    } finally {
      setGeneratingScenarios(false)
    }
  }

  const cleanupTestData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cleanup: true }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to cleanup test data')
      }

      // Refresh the cards list
      await fetchTestCards()
      
    } catch (error) {
      console.error('Error cleaning up test data:', error)
      setError('Failed to cleanup test data: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const testWallet = async (cardId: string, walletType: 'apple' | 'google' | 'pwa') => {
    setWalletStatus(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        [walletType]: 'loading'
      }
    }))

    try {
      const debugParam = walletType === 'apple' ? '?debug=true' : ''
      const response = await fetch(`/api/wallet/${walletType}/${cardId}${debugParam}`)
      
      if (response.ok) {
        setWalletStatus(prev => ({
          ...prev,
          [cardId]: {
            ...prev[cardId],
            [walletType]: 'success'
          }
        }))

        // If it's Apple Wallet with debug mode, extract the JSON payload
        if (walletType === 'apple' && debugParam) {
          try {
            const debugData = await response.json()
            if (debugData.pass_json) {
              setApplePayloads(prev => ({
                ...prev,
                [cardId]: debugData.pass_json
              }))
            }
          } catch (e) {
            console.warn('Failed to parse Apple Wallet debug response')
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error(`Error testing ${walletType} wallet:`, error)
      setWalletStatus(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          [walletType]: 'error'
        }
      }))
    }
  }

  const downloadWallet = async (cardId: string, walletType: 'apple' | 'google' | 'pwa') => {
    try {
      const response = await fetch(`/api/wallet/${walletType}/${cardId}`)
      
      if (response.ok) {
        if (walletType === 'apple') {
          // Download PKPass file
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `wallet-${cardId}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        } else if (walletType === 'google') {
          // Redirect to Google Wallet
          const data = await response.json()
          if (data.saveUrl) {
            window.open(data.saveUrl, '_blank')
          }
        } else if (walletType === 'pwa') {
          // Open PWA wallet
          window.open(`/api/wallet/pwa/${cardId}`, '_blank')
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error(`Error downloading ${walletType} wallet:`, error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (status: 'loading' | 'success' | 'error' | 'idle') => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getCompletionBadge = (current: number, total: number) => {
    const percentage = Math.round((current / total) * 100)
    const variant = percentage === 100 ? 'default' : percentage >= 80 ? 'secondary' : 'outline'
    return (
      <Badge variant={variant} className="ml-2">
        {percentage}% ({current}/{total})
      </Badge>
    )
  }

  const getScenarioType = (current: number, total: number) => {
    const percentage = (current / total) * 100
    if (percentage === 0) return { type: 'Empty', color: 'bg-gray-100 text-gray-800' }
    if (percentage > 100) return { type: 'Over-Complete', color: 'bg-purple-100 text-purple-800' }
    if (percentage === 100) return { type: 'Completed', color: 'bg-green-100 text-green-800' }
    if (percentage >= 80) return { type: 'Almost Complete', color: 'bg-orange-100 text-orange-800' }
    if (percentage >= 50) return { type: 'Half Complete', color: 'bg-blue-100 text-blue-800' }
    if (total >= 50) return { type: 'Large Card', color: 'bg-indigo-100 text-indigo-800' }
    if (total <= 3) return { type: 'Small Card', color: 'bg-yellow-100 text-yellow-800' }
    return { type: 'In Progress', color: 'bg-gray-100 text-gray-800' }
  }

  const filteredCards = testCards.filter(card =>
    card.stamp_card.business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.stamp_card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetchTestCards()
  }, [fetchTestCards])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <TestTube className="mr-3 h-8 w-8 text-blue-600" />
                Wallet Test Preview
              </h1>
              <p className="mt-2 text-gray-600">
                Test Apple Wallet, Google Wallet, and PWA functionality with real customer cards
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={fetchTestCards}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={generateAllScenarios}
                disabled={generatingScenarios}
                variant="default"
                size="sm"
              >
                <Plus className={`mr-2 h-4 w-4 ${generatingScenarios ? 'animate-spin' : ''}`} />
                Generate Test Scenarios
              </Button>
              <Button
                onClick={cleanupTestData}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cleanup Test Data
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search cards by business, customer, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              <Database className="mr-1 h-3 w-3" />
              {filteredCards.length} cards
            </Badge>
            <Badge variant="outline" className="text-sm">
              <BarChart3 className="mr-1 h-3 w-3" />
              {testCards.filter(card => card.current_stamps >= card.stamp_card.total_stamps).length} completed
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && testCards.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Loading test cards...</h3>
            <p className="mt-2 text-gray-500">Fetching customer cards from Supabase</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCards.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No test cards found</h3>
            <p className="mt-2 text-gray-500">
              {testCards.length === 0 
                ? "Generate test scenarios to start testing wallet functionality" 
                : "No cards match your search criteria"
              }
            </p>
            {testCards.length === 0 && (
              <Button
                onClick={generateAllScenarios}
                disabled={generatingScenarios}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate Test Scenarios
              </Button>
            )}
          </div>
        )}

        {/* Test Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => {
            const scenario = getScenarioType(card.current_stamps, card.stamp_card.total_stamps)
            const cardStatus = walletStatus[card.id] || { apple: 'idle', google: 'idle', pwa: 'idle' }
            const applePayload = applePayloads[card.id]
            
            return (
              <Card key={card.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{card.stamp_card.business.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {card.stamp_card.name}
                      </CardDescription>
                    </div>
                    <Badge className={scenario.color} variant="secondary">
                      {scenario.type}
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{card.current_stamps} / {card.stamp_card.total_stamps} stamps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((card.current_stamps / card.stamp_card.total_stamps) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    {getCompletionBadge(card.current_stamps, card.stamp_card.total_stamps)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Customer:</span> {card.customer.name}</p>
                    <p><span className="font-medium">Email:</span> {card.customer.email}</p>
                    <p><span className="font-medium">Reward:</span> {card.stamp_card.reward_description}</p>
                  </div>

                  {/* Wallet Test Buttons */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">Wallet Testing</h4>
                    
                    {/* Apple Wallet */}
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Apple Wallet</span>
                        {getStatusIcon(cardStatus.apple)}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWallet(card.id, 'apple')}
                          disabled={cardStatus.apple === 'loading'}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadWallet(card.id, 'apple')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Google Wallet */}
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Google Wallet</span>
                        {getStatusIcon(cardStatus.google)}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWallet(card.id, 'google')}
                          disabled={cardStatus.google === 'loading'}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadWallet(card.id, 'google')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* PWA Wallet */}
                    <div className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">PWA Wallet</span>
                        {getStatusIcon(cardStatus.pwa)}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWallet(card.id, 'pwa')}
                          disabled={cardStatus.pwa === 'loading'}
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => downloadWallet(card.id, 'pwa')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* API Links */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">API Endpoints</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 px-2"
                        onClick={() => copyToClipboard(`/api/wallet/apple/${card.id}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Apple
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 px-2"
                        onClick={() => copyToClipboard(`/api/wallet/google/${card.id}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Google
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 px-2"
                        onClick={() => copyToClipboard(`/api/wallet/pwa/${card.id}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        PWA
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 px-2"
                        onClick={() => copyToClipboard(`/api/wallet/apple/${card.id}?debug=true`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Debug
                      </Button>
                    </div>
                  </div>

                  {/* Apple Wallet JSON Viewer */}
                  {applePayload && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-700">Apple Wallet Payload</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedJsonViewer(
                            expandedJsonViewer === card.id ? null : card.id
                          )}
                        >
                          {expandedJsonViewer === card.id ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <FileJson className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      {expandedJsonViewer === card.id && (
                        <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(applePayload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Metadata */}
                  <div className="pt-2 border-t text-xs text-gray-500">
                    <p>Card ID: {card.id}</p>
                    <p>Created: {new Date(card.created_at).toLocaleDateString()}</p>
                    {card.updated_at && (
                      <p>Updated: {new Date(card.updated_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Real-time wallet testing interface • Test all wallet types • 
            <Link href="/api/health" className="ml-1 text-blue-600 hover:underline">
              System Health
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 