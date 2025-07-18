'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { 
  RefreshCw, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Eye,
  ExternalLink,
  Activity
} from 'lucide-react'

// Type definitions based on Google Wallet best practices 2025
interface TestCard {
  id: string
  name: string
  business_name: string
  current_stamps: number
  total_stamps: number
  reward_description: string
  scenario: string
  created_at: string
}

interface TestResult {
  id: string
  card_id: string
  test_type: string
  status: 'success' | 'error' | 'timeout'
  duration_ms: number
  response_size_kb: number
  created_at: string
  error_message?: string
}

interface PerformanceMetrics {
  averageResponseTime: number
  successRate: number
  totalRequests: number
  errorCount: number
  averageFileSize: number
}

interface EnvironmentStatus {
  status: string
  googleWallet: {
    configured: boolean
    privateKeyValid: boolean
    serviceAccountValid: boolean
    classIdValid: boolean
  }
  appleWallet: {
    configured: boolean
    certificatesValid: boolean
  }
  pwaWallet: {
    available: boolean
  }
}

export default function WalletPreviewPage() {
  // State management with proper TypeScript types
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [selectedCard, setSelectedCard] = useState<TestCard | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    successRate: 0,
    totalRequests: 0,
    errorCount: 0,
    averageFileSize: 0
  })
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  // Fixed: Properly typed as NodeJS.Timeout | null instead of number | null
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // Enhanced error logging function
  const logWalletError = useCallback((operation: string, error: unknown, context?: Record<string, unknown>) => {
    const errorData = {
      operation,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      context
    }
    
    console.error('🚨 Wallet Error:', errorData)
    
    // Send to error tracking endpoint
    fetch('/api/errors/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(() => {
      // Silent fail for error logging
    })
  }, [])

  // Fetch test cards with enhanced error handling
  const fetchTestCards = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching existing test data...')
      const response = await fetch('/api/dev-seed')
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('⚠️ API key required for production environment')
          setError('API key required. Configure DEV_SEED_API_KEY environment variable for production testing.')
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📊 Found test cards:', data.cards?.length || 0)
      
      if (data.cards && Array.isArray(data.cards)) {
        setTestCards(data.cards)
        
        // Auto-select first card if none selected
        if (!selectedCard && data.cards.length > 0) {
          setSelectedCard(data.cards[0])
          generateQrCode(data.cards[0].id)
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching test cards:', error)
      logWalletError('fetch_test_cards', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch test cards')
    } finally {
      setLoading(false)
    }
  }, [selectedCard, logWalletError])

  // Fetch test results with error handling
  const fetchTestResults = useCallback(async () => {
    try {
      const response = await fetch('/api/test/results?limit=50&test_type=all')
      
      if (!response.ok) {
        console.warn('⚠️ Test results API unavailable')
        return
      }
      
      const data = await response.json()
      console.log('✅ Test results fetched:', { total: data.total, recent: data.recent, successRate: data.successRate })
      
      if (data.success && data.data) {
        setTestResults(data.data)
        calculatePerformanceMetrics(data.data)
      }
      
    } catch (error) {
      console.warn('⚠️ Could not fetch test results:', error)
      // Don't show error for missing test results - it's optional
    }
  }, [])

  // Calculate performance metrics based on 2025 Google Wallet testing standards
  const calculatePerformanceMetrics = useCallback((results: TestResult[]) => {
    if (results.length === 0) {
      setPerformanceMetrics({
        averageResponseTime: 0,
        successRate: 0,
        totalRequests: 0,
        errorCount: 0,
        averageFileSize: 0
      })
      return
    }

    const totalRequests = results.length
    const successfulRequests = results.filter(r => r.status === 'success')
    const errorCount = results.filter(r => r.status === 'error').length
    const successRate = (successfulRequests.length / totalRequests) * 100
    
    const averageResponseTime = results.reduce((sum, r) => sum + r.duration_ms, 0) / totalRequests
    const averageFileSize = results.reduce((sum, r) => sum + (r.response_size_kb || 0), 0) / totalRequests

    setPerformanceMetrics({
      averageResponseTime: Math.round(averageResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      totalRequests,
      errorCount,
      averageFileSize: Math.round(averageFileSize * 100) / 100
    })
  }, [])

  // Check environment status
  const checkEnvironmentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/env')
      
      if (!response.ok) {
        console.warn('⚠️ Environment health check failed')
        return
      }
      
      const data = await response.json()
      setEnvironmentStatus({
        status: data.status,
        googleWallet: data.googleWallet || { configured: false, privateKeyValid: false, serviceAccountValid: false, classIdValid: false },
        appleWallet: data.appleWallet || { configured: false, certificatesValid: false },
        pwaWallet: data.pwaWallet || { available: true }
      })
      
    } catch (error) {
      console.warn('⚠️ Could not check environment status:', error)
    }
  }, [])

  // Generate QR code for production domain
  const generateQrCode = useCallback((cardId: string) => {
    const joinUrl = `https://www.rewardjar.xyz/join/${cardId}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`
    setQrCodeUrl(qrUrl)
  }, [])

  // Test Google Wallet link generation with comprehensive metrics
  const testGoogleWalletLink = useCallback(async (card: TestCard) => {
    const startTime = Date.now()
    const testData = {
      card_id: card.id,
      test_type: 'google_wallet',
      status: 'pending' as const,
      duration_ms: 0,
      response_size_kb: 0
    }

    try {
      setLoading(true)
      console.log('🤖 Testing Google Wallet link for card:', card.id)
      
      const response = await fetch(`/api/wallet/google/${card.id}`)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const responseText = await response.text()
      const responseSize = new Blob([responseText]).size / 1024 // Convert to KB
      
      // Extract the JWT token or saveUrl from the response
      let saveUrl = ''
      if (responseText.includes('pay.google.com/gp/v/save/')) {
        const urlMatch = responseText.match(/https:\/\/pay\.google\.com\/gp\/v\/save\/[^"'\s>]+/)
        if (urlMatch) {
          saveUrl = urlMatch[0]
          console.log('✅ Google Wallet saveUrl generated:', saveUrl.substring(0, 100) + '...')
          
          // Open in new tab (browser testing requirement)
          window.open(saveUrl, '_blank', 'noopener,noreferrer')
        }
      }
      
      // Record successful test result
      const finalTestData = {
        ...testData,
        status: 'success' as const,
        duration_ms: duration,
        response_size_kb: responseSize
      }
      
      // Log to test results if available
      try {
        await fetch('/api/test/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalTestData)
        })
      } catch {
        // Silent fail for test logging
      }
      
      // Refresh results
      await fetchTestResults()
      
      console.log('✅ Google Wallet test completed successfully')
      
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.error('❌ Google Wallet test failed:', error)
      logWalletError('google_wallet_test', error, { card_id: card.id, duration })
      
      // Record failed test result
      const failedTestData = {
        ...testData,
        status: 'error' as const,
        duration_ms: duration,
        error_message: error instanceof Error ? error.message : String(error)
      }
      
      try {
        await fetch('/api/test/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(failedTestData)
        })
      } catch {
        // Silent fail for test logging
      }
      
      setError(`Google Wallet test failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [logWalletError, fetchTestResults])

  // Handle card selection
  const handleCardSelection = useCallback((card: TestCard) => {
    setSelectedCard(card)
    generateQrCode(card.id)
    setError(null)
  }, [generateQrCode])

  // Auto-refresh functionality
  const toggleAutoRefresh = useCallback(() => {
    if (isAutoRefresh && refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
      setIsAutoRefresh(false)
    } else {
      const interval = setInterval(() => {
        fetchTestCards()
        fetchTestResults()
        checkEnvironmentStatus()
      }, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      setIsAutoRefresh(true)
    }
  }, [isAutoRefresh, refreshInterval, fetchTestCards, fetchTestResults, checkEnvironmentStatus])

  // Initial data loading
  useEffect(() => {
    fetchTestCards()
    fetchTestResults()
    checkEnvironmentStatus()
    
    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, []) // Remove dependencies to avoid infinite loops

  // Performance status indicator
  const getPerformanceStatus = () => {
    if (performanceMetrics.totalRequests === 0) return 'unknown'
    if (performanceMetrics.successRate >= 95 && performanceMetrics.averageResponseTime < 2000) return 'excellent'
    if (performanceMetrics.successRate >= 85 && performanceMetrics.averageResponseTime < 5000) return 'good'
    return 'needs_improvement'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧪 Google Wallet Testing Interface
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Comprehensive testing platform based on Google Wallet 2025 best practices
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => { fetchTestCards(); fetchTestResults(); checkEnvironmentStatus(); }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button 
              onClick={toggleAutoRefresh}
              variant={isAutoRefresh ? "destructive" : "outline"}
            >
              <Activity className="w-4 h-4 mr-2" />
              {isAutoRefresh ? 'Stop' : 'Start'} Auto-Refresh
            </Button>
          </div>
        </div>

        {/* Environment Status */}
        {environmentStatus && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Environment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                    environmentStatus.googleWallet.configured && 
                    environmentStatus.googleWallet.privateKeyValid ? 
                    'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <h4 className="font-semibold">Google Wallet</h4>
                  <p className="text-sm text-gray-600">
                    {environmentStatus.googleWallet.configured ? 'Configured' : 'Not Configured'}
                  </p>
                </div>
                <div className="text-center">
                  <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                    environmentStatus.appleWallet.configured ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <h4 className="font-semibold">Apple Wallet</h4>
                  <p className="text-sm text-gray-600">
                    {environmentStatus.appleWallet.configured ? 'Configured' : 'Needs Certificates'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-4 h-4 rounded-full mx-auto mb-2 bg-green-500"></div>
                  <h4 className="font-semibold">PWA Wallet</h4>
                  <p className="text-sm text-gray-600">Always Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold">{performanceMetrics.averageResponseTime}ms</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">{performanceMetrics.successRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold">{performanceMetrics.totalRequests}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Performance</p>
                  <Badge variant={getPerformanceStatus() === 'excellent' ? 'default' : 
                               getPerformanceStatus() === 'good' ? 'secondary' : 'destructive'}>
                    {getPerformanceStatus()}
                  </Badge>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Testing Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Card Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Test Cards ({testCards.length} available)
              </CardTitle>
              <CardDescription>
                Select a test card to generate Google Wallet links and QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testCards.length === 0 ? (
                <div className="text-center py-8">
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <p>Loading test cards...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-500">No test cards available</p>
                      <Button 
                        onClick={async () => {
                          try {
                            setLoading(true)
                            const response = await fetch('/api/dev-seed', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ createAll: true })
                            })
                            if (response.ok) {
                              await fetchTestCards()
                            }
                          } catch (error) {
                            console.error('Error generating test data:', error)
                            setError('Failed to generate test data')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Test Cards
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {testCards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCard?.id === card.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCardSelection(card)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{card.name}</h4>
                          <p className="text-sm text-gray-600">{card.business_name}</p>
                          <p className="text-sm">
                            {card.current_stamps}/{card.total_stamps} stamps
                          </p>
                        </div>
                        <Badge variant="outline">
                          {card.scenario}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Wallet Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Google Wallet Testing
              </CardTitle>
              <CardDescription>
                Test Google Wallet link generation and button functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCard ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Selected Card</h4>
                    <p className="text-sm">
                      <strong>Name:</strong> {selectedCard.name}
                    </p>
                    <p className="text-sm">
                      <strong>Business:</strong> {selectedCard.business_name}
                    </p>
                    <p className="text-sm">
                      <strong>Progress:</strong> {selectedCard.current_stamps}/{selectedCard.total_stamps} stamps
                    </p>
                    <p className="text-sm">
                      <strong>Reward:</strong> {selectedCard.reward_description}
                    </p>
                  </div>

                  {/* Google Wallet Button - Following Google's brand guidelines */}
                  <div className="text-center">
                    <Button
                      onClick={() => testGoogleWalletLink(selectedCard)}
                      disabled={loading}
                      className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <Image
                        src="https://developers.google.com/static/wallet/images/add_to_google_wallet_badge.svg"
                        alt="Add to Google Wallet"
                        width={20}
                        height={20}
                        className="invert"
                      />
                      {loading ? 'Testing...' : 'Add to Google Wallet'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Follows Google Wallet brand guidelines 2025
                    </p>
                  </div>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="text-center">
                      <h4 className="font-semibold mb-2">QR Code</h4>
                      <div className="inline-block p-4 bg-white rounded-lg border">
                        <Image
                          src={qrCodeUrl}
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Scan to join: https://www.rewardjar.xyz/join/{selectedCard.id}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a test card to begin testing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Test Results
              </CardTitle>
              <CardDescription>
                Latest wallet integration test results and performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{result.test_type}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(result.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{result.duration_ms}ms</p>
                      {result.response_size_kb && (
                        <p className="text-xs text-gray-600">{result.response_size_kb}KB</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testing Guidelines */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Google Wallet Testing Guidelines 2025
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Browser Testing Requirements</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>✅ Chrome browser compatibility</li>
                  <li>✅ Firefox browser compatibility</li>
                  <li>✅ Safari browser compatibility</li>
                  <li>✅ Button rendering at different zoom levels</li>
                  <li>✅ Single button renders in &lt;1 second</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Performance Benchmarks</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>✅ Response time &lt;2 seconds target</li>
                  <li>✅ Success rate &gt;95% target</li>
                  <li>✅ JWT validation and encryption</li>
                  <li>✅ Brand guidelines compliance</li>
                  <li>✅ Real-time error tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}