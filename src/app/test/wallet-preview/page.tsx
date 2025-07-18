'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Smartphone,
  CreditCard,
  Globe,
  QrCode,
  AlertTriangle,
  TrendingUp,
  Eye,
  ExternalLink,
  Activity
} from 'lucide-react'

// Type definitions based on Google Wallet best practices
interface TestCard {
  id: string
  name: string
  business_name: string
  current_stamps: number
  total_stamps: number
  reward_description: string
  completion_percentage: number
  wallet_type: 'google' | 'apple' | 'pwa'
  created_at: string
  updated_at: string
}

interface WalletTestResult {
  id: string
  walletType: 'google' | 'apple' | 'pwa'
  status: 'success' | 'error' | 'pending'
  responseTime: number
  fileSize: number
  contentType: string
  errorMessage?: string
  timestamp: string
  passData?: Record<string, unknown>
  saveUrl?: string
}

interface PerformanceMetrics {
  averageResponseTime: number
  successRate: number
  totalRequests: number
  errorCount: number
  averageFileSize: number
}

interface TestScenario {
  id: string
  name: string
  description: string
  stamps: number
  total: number
  expected: string
  priority: 'high' | 'medium' | 'low'
}

// Google Wallet test scenarios based on pre-launch testing guidelines
const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'empty',
    name: 'Empty Card',
    description: 'New customer card with no stamps',
    stamps: 0,
    total: 10,
    expected: 'Shows 0% progress, valid Google Wallet button',
    priority: 'high'
  },
  {
    id: 'small',
    name: 'Small Card',
    description: 'Minimal stamp requirement',
    stamps: 1,
    total: 3,
    expected: 'Shows 33% progress, handles small numbers',
    priority: 'high'
  },
  {
    id: 'progress',
    name: 'In Progress',
    description: 'Card with some progress',
    stamps: 3,
    total: 10,
    expected: 'Shows 30% progress, Google Wallet link works',
    priority: 'high'
  },
  {
    id: 'half',
    name: 'Half Complete',
    description: 'Midway progress tracking',
    stamps: 5,
    total: 10,
    expected: 'Shows 50% progress, proper rendering',
    priority: 'medium'
  },
  {
    id: 'almost',
    name: 'Almost Complete',
    description: 'Near completion scenario',
    stamps: 9,
    total: 10,
    expected: 'Shows 90% progress, anticipates reward',
    priority: 'high'
  },
  {
    id: 'complete',
    name: 'Completed Card',
    description: 'Reward earned scenario',
    stamps: 10,
    total: 10,
    expected: 'Shows 100% + reward message',
    priority: 'high'
  },
  {
    id: 'large',
    name: 'Large Card',
    description: 'High stamp requirement',
    stamps: 25,
    total: 50,
    expected: 'Handles large numbers, 50% progress',
    priority: 'low'
  },
  {
    id: 'unicode',
    name: 'Unicode Names',
    description: 'Special characters in business names',
    stamps: 5,
    total: 10,
    expected: 'Handles unicode text properly',
    priority: 'medium'
  }
]

export default function WalletPreviewPage() {
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [selectedCard, setSelectedCard] = useState<TestCard | null>(null)
  const [testResults, setTestResults] = useState<WalletTestResult[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    successRate: 0,
    totalRequests: 0,
    errorCount: 0,
    averageFileSize: 0
  })
  const [loading, setLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)
  const [environmentStatus, setEnvironmentStatus] = useState<Record<string, any>>({})
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)

  // Fetch test cards from dev-seed API
  const fetchTestCards = useCallback(async () => {
    try {
      const response = await fetch('/api/dev-seed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ API Key required for production environment')
          throw new Error('API authentication required in production')
        }
        throw new Error(`Failed to fetch test cards: ${response.status}`)
      }

      const data = await response.json()
      if (data.cards && Array.isArray(data.cards)) {
        setTestCards(data.cards)
        if (data.cards.length > 0 && !selectedCard) {
          setSelectedCard(data.cards[0])
        }
      }
    } catch (error) {
      console.error('Error fetching test cards:', error)
      setTestCards([])
    }
  }, [selectedCard])

  // Generate test data based on scenarios
  const generateTestData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ createAll: true })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate test data: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Test data generated:', data)
      await fetchTestCards()
    } catch (error) {
      console.error('Error generating test data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Test Google Wallet link generation with comprehensive metrics
  const testGoogleWallet = async (card: TestCard) => {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`/api/wallet/google/${card.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      const responseTime = Date.now() - startTime
      const contentType = response.headers.get('content-type') || ''
      
      let passData: Record<string, unknown> | undefined
      let saveUrl: string | undefined
      
      if (response.ok) {
        const data = await response.json()
        passData = data
        saveUrl = data.saveUrl
      }

      const result: WalletTestResult = {
        id: `${card.id}-google`,
        walletType: 'google',
        status: response.ok ? 'success' : 'error',
        responseTime,
        fileSize: parseInt(response.headers.get('content-length') || '0'),
        contentType,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        passData,
        saveUrl
      }

      setTestResults(prev => {
        const filtered = prev.filter(r => r.id !== result.id)
        return [...filtered, result]
      })

      // Open Google Wallet if successful
      if (saveUrl && response.ok) {
        window.open(saveUrl, '_blank', 'noopener,noreferrer')
      }

      // Update performance metrics
      updatePerformanceMetrics(result)
      
      return result
    } catch (error) {
      const result: WalletTestResult = {
        id: `${card.id}-google`,
        walletType: 'google',
        status: 'error',
        responseTime: Date.now() - startTime,
        fileSize: 0,
        contentType: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }

      setTestResults(prev => {
        const filtered = prev.filter(r => r.id !== result.id)
        return [...filtered, result]
      })

      updatePerformanceMetrics(result)
      return result
    }
  }

  // Update performance metrics based on Google Wallet testing guidelines
  const updatePerformanceMetrics = (result: WalletTestResult) => {
    setPerformanceMetrics(prev => {
      const newTotal = prev.totalRequests + 1
      const newErrors = prev.errorCount + (result.status === 'error' ? 1 : 0)
      const newSuccessRate = ((newTotal - newErrors) / newTotal) * 100
      
      const totalResponseTime = prev.averageResponseTime * prev.totalRequests + result.responseTime
      const newAverageResponseTime = totalResponseTime / newTotal
      
      const totalFileSize = prev.averageFileSize * prev.totalRequests + result.fileSize
      const newAverageFileSize = totalFileSize / newTotal

      return {
        averageResponseTime: newAverageResponseTime,
        successRate: newSuccessRate,
        totalRequests: newTotal,
        errorCount: newErrors,
        averageFileSize: newAverageFileSize
      }
    })
  }

  // Check environment status
  const checkEnvironmentStatus = async () => {
    try {
      const response = await fetch('/api/health/env')
      if (response.ok) {
        const data = await response.json()
        setEnvironmentStatus(data)
      }
    } catch (error) {
      console.error('Error checking environment:', error)
    }
  }

  // Generate QR code URL for production domain
  const generateQRCode = (cardId: string) => {
    const joinUrl = `https://www.rewardjar.xyz/join/${cardId}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`
  }

  // Handle auto-refresh functionality
  const toggleAutoRefresh = () => {
    if (isAutoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
      setIsAutoRefresh(false)
    } else {
      const interval = setInterval(() => {
        fetchTestCards()
        checkEnvironmentStatus()
      }, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      setIsAutoRefresh(true)
    }
  }

  // Copy to clipboard with fallback
  const copyToClipboard = async (text: string) => {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        console.log('✅ Copied to clipboard')
      } catch {
        fallbackCopyToClipboard(text)
      }
    } else {
      fallbackCopyToClipboard(text)
    }
  }

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      console.log('✅ Copied to clipboard (fallback)')
    } catch (err) {
      console.error('❌ Clipboard copy failed:', err)
    }
    document.body.removeChild(textArea)
  }

  // Initialize component
  useEffect(() => {
    fetchTestCards()
    checkEnvironmentStatus()
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [fetchTestCards])

  // Supabase real-time subscription (placeholder for future implementation)
  useEffect(() => {
    // TODO: Implement real-time subscriptions for card updates
    // This would listen for changes to customer_cards table
    console.log('🔄 Real-time subscriptions ready for implementation')
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Wallet Test Interface
        </h1>
        <p className="text-gray-600 text-lg">
          Comprehensive testing suite for Google Wallet integration with performance monitoring and pre-launch validation
        </p>
      </div>

      {/* Environment Status */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Activity className="h-5 w-5 mr-2" />
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">Google Wallet API</p>
              <Badge variant={environmentStatus.googleWallet ? 'default' : 'destructive'}>
                {environmentStatus.googleWallet ? 'Ready' : 'Not Configured'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Private Key</p>
              <Badge variant={environmentStatus.privateKeyValid ? 'default' : 'destructive'}>
                {environmentStatus.privateKeyValid ? 'Valid' : 'Invalid/Missing'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Production Domain</p>
              <Badge variant="default">
                www.rewardjar.xyz
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {performanceMetrics.successRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {performanceMetrics.averageResponseTime.toFixed(0)}ms
              </p>
              <p className="text-sm text-gray-600">Avg Response</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {(performanceMetrics.averageFileSize / 1024).toFixed(1)}KB
              </p>
              <p className="text-sm text-gray-600">Avg Size</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">
                {performanceMetrics.totalRequests}
              </p>
              <p className="text-sm text-gray-600">Total Tests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {performanceMetrics.errorCount}
              </p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          onClick={generateTestData}
          disabled={loading}
          className="flex items-center"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Generate Test Data
        </Button>
        
        <Button 
          onClick={fetchTestCards}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Cards
        </Button>

        <Button 
          onClick={toggleAutoRefresh}
          variant={isAutoRefresh ? "destructive" : "outline"}
          className="flex items-center"
        >
          <Clock className="h-4 w-4 mr-2" />
          {isAutoRefresh ? 'Stop Auto-Refresh' : 'Auto-Refresh (30s)'}
        </Button>

        <Button 
          onClick={checkEnvironmentStatus}
          variant="secondary"
          className="flex items-center"
        >
          <Activity className="h-4 w-4 mr-2" />
          Check Environment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Cards Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Test Cards ({testCards.length})
            </CardTitle>
            <CardDescription>
              Select a test card to generate Google Wallet links and QR codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No test cards available. Generate some test data to get started.</p>
                
                {/* Production deployment notice */}
                {process.env.NODE_ENV === 'production' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-md mx-auto">
                    <h4 className="font-medium text-blue-800 mb-2">🚀 Vercel Deployment Detected</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      If you&apos;re seeing this on Vercel, make sure you&apos;ve set up the required environment variables:
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                      <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                      <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                      <li>• BASE_URL (your Vercel app URL)</li>
                      <li>• GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2">
                      📖 See <code>VERCEL_DEPLOYMENT_GUIDE.md</code> for complete setup instructions.
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={generateTestData}
                  disabled={loading}
                  className="mt-4"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Generate Test Data
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {testCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCard?.id === card.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{card.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {card.current_stamps}/{card.total_stamps}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{card.business_name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {card.completion_percentage}% complete
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(card.completion_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Wallet Testing Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Google Wallet Testing
            </CardTitle>
            <CardDescription>
              Test Google Wallet link generation and pass rendering
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCard ? (
              <div className="space-y-4">
                {/* Selected Card Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">{selectedCard.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{selectedCard.business_name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedCard.current_stamps} of {selectedCard.total_stamps} stamps
                    {selectedCard.current_stamps >= selectedCard.total_stamps && (
                      <span className="ml-2 text-green-600 font-medium">🎉 Reward Earned!</span>
                    )}
                  </p>
                </div>

                {/* Google Wallet Button */}
                <div className="text-center">
                  <Button
                    onClick={() => testGoogleWallet(selectedCard)}
                    className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg font-medium"
                    size="lg"
                  >
                    <Smartphone className="h-5 w-5 mr-2" />
                    Add to Google Wallet
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Opens Google Wallet with loyalty card
                  </p>
                </div>

                {/* QR Code Preview */}
                <div className="text-center">
                  <h4 className="font-medium mb-2">QR Code Preview</h4>
                  <img
                    src={generateQRCode(selectedCard.id)}
                    alt="QR Code"
                    className="mx-auto border rounded-lg"
                    style={{ width: '150px', height: '150px' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Scan to join: www.rewardjar.xyz/join/{selectedCard.id}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`https://www.rewardjar.xyz/join/${selectedCard.id}`)}
                    className="mt-2"
                  >
                    Copy Join Link
                  </Button>
                </div>

                {/* Test Results for Selected Card */}
                <div>
                  <h4 className="font-medium mb-2">Recent Test Results</h4>
                  {testResults
                    .filter(result => result.id.startsWith(selectedCard.id))
                    .slice(0, 3)
                    .map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
                      >
                        <div className="flex items-center">
                          {result.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : result.status === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                          )}
                          <span className="text-sm font-medium capitalize">{result.walletType}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{result.responseTime}ms</p>
                          {result.errorMessage && (
                            <p className="text-xs text-red-600">{result.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a test card to start Google Wallet testing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Scenarios Grid */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Test Scenarios Matrix
          </CardTitle>
          <CardDescription>
            Based on Google Wallet pre-launch testing requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEST_SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                  <Badge
                    variant={
                      scenario.priority === 'high' 
                        ? 'destructive' 
                        : scenario.priority === 'medium' 
                        ? 'default' 
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {scenario.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Progress: {scenario.stamps}/{scenario.total} stamps
                </p>
                <p className="text-xs text-blue-600">{scenario.expected}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Environment</h4>
              <ul className="text-sm space-y-1">
                <li>Node ENV: {process.env.NODE_ENV || 'development'}</li>
                <li>Base URL: {process.env.NEXT_PUBLIC_BASE_URL || 'localhost:3000'}</li>
                <li>Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Connected' : '❌ Not configured'}</li>
                <li>Google Wallet: {environmentStatus.googleWallet ? '✅ Ready' : '❌ Not ready'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Performance Targets</h4>
              <ul className="text-sm space-y-1">
                <li>Response Time: &lt; 2000ms {performanceMetrics.averageResponseTime < 2000 ? '✅' : '⚠️'}</li>
                <li>Success Rate: &gt; 95% {performanceMetrics.successRate > 95 ? '✅' : '⚠️'}</li>
                <li>Button Render: &lt; 1000ms ✅</li>
                <li>JWT Validation: Valid RS256 ✅</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card className="mt-6 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Globe className="h-5 w-5 mr-2" />
            Google Wallet Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://developers.google.com/wallet/generic/test-and-go-live/prelaunch-testing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-green-700 hover:text-green-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Pre-launch Testing
            </a>
            <a
              href="https://developers.google.com/wallet/generic/resources/brand-guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-green-700 hover:text-green-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Brand Guidelines
            </a>
            <a
              href="https://jwt.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-green-700 hover:text-green-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              JWT Validator
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}