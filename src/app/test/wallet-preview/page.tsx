'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG as QRCode } from 'qrcode.react'
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
  Activity,
  QrCode,
  Wallet
} from 'lucide-react'

// Type definitions based on Google Wallet best practices 2025
interface TestCard {
  id: string
  name: string
  business_name: string
  current_stamps: number
  total_stamps: number
  reward_description: string
  progress: number
  status: 'empty' | 'in_progress' | 'almost_complete' | 'completed' | 'over_complete'
  test_scenario: string
}

interface TestResult {
  card_id: string
  test_type: 'google_wallet' | 'apple_wallet' | 'pwa_wallet' | 'qr_code'
  status: 'success' | 'error' | 'pending'
  duration_ms: number
  response_size_kb: number
  error_message?: string
  timestamp: string
}

interface EnvironmentStatus {
  google_wallet: boolean
  apple_wallet: boolean
  pwa_wallet: boolean
  qr_generation: boolean
  overall_health: boolean
}

interface PerformanceMetrics {
  google_wallet: {
    avg_response_time: number
    success_rate: number
    total_requests: number
    avg_file_size: number
    jwt_generation_time?: number
  }
  qr_generation: {
    avg_response_time: number
    success_rate: number
    total_generated: number
    avg_size: number
  }
  api_response: {
    avg_response_time: number
    success_rate: number
    total_requests: number
  }
}

// Define interface for card data transformation
interface RawCardData {
  id: string
  name?: string
  business_name?: string
  current_stamps?: number
  total_stamps?: number
  reward_description?: string
  test_scenario?: string
}

export default function WalletPreviewPage() {
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [selectedCard, setSelectedCard] = useState<string>('')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>({
    google_wallet: false,
    apple_wallet: false,
    pwa_wallet: false,
    qr_generation: false,
    overall_health: false
  })
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    google_wallet: { avg_response_time: 0, success_rate: 0, total_requests: 0, avg_file_size: 0 },
    qr_generation: { avg_response_time: 0, success_rate: 0, total_generated: 0, avg_size: 0 },
    api_response: { avg_response_time: 0, success_rate: 0, total_requests: 0 }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)

  // Production domain constants
  const PRODUCTION_DOMAIN = 'https://www.rewardjar.xyz'
  const [baseUrl, setBaseUrl] = useState(PRODUCTION_DOMAIN)
  
  useEffect(() => {
    // Set baseUrl on client side to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  // Log test results to API
  const logTestResult = useCallback(async (
    testType: TestResult['test_type'],
    status: TestResult['status'],
    durationMs: number,
    responseSizeKb: number,
    errorMessage?: string
  ) => {
    try {
      await fetch('/api/test/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: selectedCard || 'test',
          test_type: testType,
          status,
          duration_ms: durationMs,
          response_size_kb: responseSizeKb,
          error_message: errorMessage
        })
      })
    } catch (error) {
      console.error('Failed to log test result:', error)
    }
  }, [selectedCard])

  // Get card status based on progress
  const getCardStatus = useCallback((current: number, total: number): TestCard['status'] => {
    const progress = (current / total) * 100
    if (current === 0) return 'empty'
    if (current >= total) return current > total ? 'over_complete' : 'completed'
    if (progress >= 90) return 'almost_complete'
    return 'in_progress'
  }, [])

  // Load test cards
  const loadTestCards = useCallback(async () => {
    try {
      setIsLoading(true)
      const startTime = Date.now()
      
      const response = await fetch('/api/dev-seed')
      const duration = Date.now() - startTime
      
      if (!response.ok) {
        throw new Error(`Failed to load test cards: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform the data into test cards with proper typing
      const cards: TestCard[] = (data.cards || []).map((card: RawCardData) => {
        const currentStamps = card.current_stamps || 0
        const totalStamps = card.total_stamps || 10
        
        return {
          id: card.id,
          name: card.name || 'Test Card',
          business_name: card.business_name || 'Test Business',
          current_stamps: currentStamps,
          total_stamps: totalStamps,
          reward_description: card.reward_description || 'Test Reward',
          progress: Math.min((currentStamps / totalStamps) * 100, 100),
          status: getCardStatus(currentStamps, totalStamps),
          test_scenario: card.test_scenario || 'default'
        }
      })
      
      setTestCards(cards)
      
      // Auto-select first card if none selected
      if (!selectedCard && cards.length > 0) {
        setSelectedCard(cards[0].id)
      }
      
      // Log performance metrics (using qr_code as fallback type)
      await logTestResult('qr_code', 'success', duration, JSON.stringify(data).length)
      
    } catch (error) {
      console.error('Failed to load test cards:', error)
      await logTestResult('qr_code', 'error', 0, 0, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [getCardStatus, logTestResult, selectedCard])

  // Generate QR code URL for join link
  const getJoinUrl = useCallback((stampCardId: string) => {
    return `${PRODUCTION_DOMAIN}/join/${stampCardId}`
  }, [])

  // Test Google Wallet functionality
  const testGoogleWallet = useCallback(async (cardId: string) => {
    try {
      setIsLoading(true)
      const startTime = Date.now()
      
      const response = await fetch(`/api/wallet/google/${cardId}`)
      const duration = Date.now() - startTime
      const contentLength = parseInt(response.headers.get('content-length') || '0')
      
      if (response.ok) {
        await logTestResult('google_wallet', 'success', duration, Math.round(contentLength / 1024))
        
        // Open Google Wallet in new tab
        window.open(`/api/wallet/google/${cardId}`, '_blank')
      } else {
        const errorData = await response.text()
        await logTestResult('google_wallet', 'error', duration, Math.round(contentLength / 1024), errorData)
      }
      
    } catch (error) {
      console.error('Google Wallet test failed:', error)
      await logTestResult('google_wallet', 'error', 0, 0, error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [logTestResult])

  // Test QR code generation
  const testQRCodeGeneration = useCallback(async (stampCardId: string) => {
    try {
      const startTime = Date.now()
      const joinUrl = getJoinUrl(stampCardId)
      
      // Test client-side QR generation (this component)
      const qrElement = document.querySelector(`#qr-${stampCardId}`)
      const duration = Date.now() - startTime
      
      if (qrElement) {
        await logTestResult('qr_code', 'success', duration, joinUrl.length)
        
        // Test that URL is accessible
        try {
          const response = await fetch(joinUrl, { method: 'HEAD' })
          if (response.ok) {
            console.log('✅ QR code URL is accessible:', joinUrl)
          } else {
            console.warn('⚠️ QR code URL returned:', response.status, joinUrl)
          }
        } catch (urlError) {
          console.warn('⚠️ Could not test QR code URL:', urlError)
        }
      } else {
        await logTestResult('qr_code', 'error', duration, 0, 'QR code element not found')
      }
      
    } catch (error) {
      console.error('QR code test failed:', error)
      await logTestResult('qr_code', 'error', 0, 0, error instanceof Error ? error.message : 'Unknown error')
    }
  }, [getJoinUrl, logTestResult])

  // Check environment status
  const checkEnvironmentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/env')
      const data = await response.json()
      
      setEnvironmentStatus({
        google_wallet: data.googleWallet?.configured || false,
        apple_wallet: data.appleWallet?.configured || false,
        pwa_wallet: true, // Always available
        qr_generation: true, // Client-side generation always available
        overall_health: response.ok
      })
      
    } catch (error) {
      console.error('Failed to check environment status:', error)
      setEnvironmentStatus({
        google_wallet: false,
        apple_wallet: false,
        pwa_wallet: true,
        qr_generation: true,
        overall_health: false
      })
    }
  }, [])

  // Load performance metrics
  const loadPerformanceMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/test/results')
      if (response.ok) {
        const data = await response.json()
        const results: TestResult[] = data.data || []
        
        // Calculate Google Wallet metrics
        const googleWalletResults = results.filter(r => r.test_type === 'google_wallet')
        const successfulGoogle = googleWalletResults.filter(r => r.status === 'success')
        
        // Calculate QR code metrics
        const qrResults = results.filter(r => r.test_type === 'qr_code')
        const successfulQR = qrResults.filter(r => r.status === 'success')
        
        // Calculate overall API response metrics
        const allAPIResults = results
        const successfulAPI = allAPIResults.filter(r => r.status === 'success')
        
        setPerformanceMetrics({
          google_wallet: {
            avg_response_time: successfulGoogle.length > 0 
              ? Math.round(successfulGoogle.reduce((sum, r) => sum + r.duration_ms, 0) / successfulGoogle.length)
              : 0,
            success_rate: googleWalletResults.length > 0 
              ? Math.round((successfulGoogle.length / googleWalletResults.length) * 100)
              : 0,
            total_requests: googleWalletResults.length,
            avg_file_size: successfulGoogle.length > 0
              ? Math.round(successfulGoogle.reduce((sum, r) => sum + r.response_size_kb, 0) / successfulGoogle.length)
              : 0
          },
          qr_generation: {
            avg_response_time: successfulQR.length > 0
              ? Math.round(successfulQR.reduce((sum, r) => sum + r.duration_ms, 0) / successfulQR.length)
              : 0,
            success_rate: qrResults.length > 0
              ? Math.round((successfulQR.length / qrResults.length) * 100)
              : 0,
            total_generated: qrResults.length,
            avg_size: successfulQR.length > 0
              ? Math.round(successfulQR.reduce((sum, r) => sum + r.response_size_kb, 0) / successfulQR.length)
              : 0
          },
          api_response: {
            avg_response_time: successfulAPI.length > 0
              ? Math.round(successfulAPI.reduce((sum, r) => sum + r.duration_ms, 0) / successfulAPI.length)
              : 0,
            success_rate: allAPIResults.length > 0
              ? Math.round((successfulAPI.length / allAPIResults.length) * 100)
              : 0,
            total_requests: allAPIResults.length
          }
        })
        
        setTestResults(results.slice(-10)) // Show last 10 results
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    }
  }, [])

  // Auto-refresh functionality
  const toggleAutoRefresh = useCallback(() => {
    if (isAutoRefresh && refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
      setIsAutoRefresh(false)
    } else {
      const interval = setInterval(() => {
        loadTestCards()
        checkEnvironmentStatus()
        loadPerformanceMetrics()
      }, 10000) // Refresh every 10 seconds
      setRefreshInterval(interval)
      setIsAutoRefresh(true)
    }
  }, [isAutoRefresh, refreshInterval, loadTestCards, checkEnvironmentStatus, loadPerformanceMetrics])

  // Initial load
  useEffect(() => {
    loadTestCards()
    checkEnvironmentStatus()
    loadPerformanceMetrics()
  }, [loadTestCards, checkEnvironmentStatus, loadPerformanceMetrics])
    
    // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  const selectedCardData = testCards.find(card => card.id === selectedCard)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Google Wallet Testing Interface
                </CardTitle>
                <CardDescription>
                  Comprehensive testing for Google Wallet integration with QR code generation and performance monitoring
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isAutoRefresh ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleAutoRefresh}
                  className="flex items-center gap-2"
                >
                  {isAutoRefresh ? <XCircle className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                  {isAutoRefresh ? 'Stop Auto-Refresh' : 'Auto-Refresh'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadTestCards()
                    checkEnvironmentStatus()
                    loadPerformanceMetrics()
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Environment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  environmentStatus.google_wallet ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <p className="text-sm font-medium">Google Wallet</p>
                <p className="text-xs text-gray-500">
                  {environmentStatus.google_wallet ? 'Configured' : 'Not Configured'}
                </p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  environmentStatus.apple_wallet ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <p className="text-sm font-medium">Apple Wallet</p>
                <p className="text-xs text-gray-500">
                  {environmentStatus.apple_wallet ? 'Configured' : 'Optional'}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  {!environmentStatus.apple_wallet && 'Not required for Google Wallet'}
                </p>
                <p className="text-xs text-gray-400">
                  {!environmentStatus.apple_wallet && 'Google Wallet + PWA provide full coverage'}
                </p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  environmentStatus.pwa_wallet ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <p className="text-sm font-medium">PWA Wallet</p>
                <p className="text-xs text-gray-500">Always Available</p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  environmentStatus.qr_generation ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <p className="text-sm font-medium">QR Generation</p>
                <p className="text-xs text-gray-500">Client-side Ready</p>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                  environmentStatus.overall_health ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <p className="text-sm font-medium">Overall Health</p>
                <p className="text-xs text-gray-500">
                  {environmentStatus.overall_health ? 'Healthy' : 'Issues Detected'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Card Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Test Card Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Test Card</label>
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Choose a test card...</option>
                  {testCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} ({card.test_scenario}) - {card.current_stamps}/{card.total_stamps}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Generate New Test Data</label>
                <Button
                  onClick={() => fetch('/api/dev-seed', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ createAll: true })
                  }).then(() => loadTestCards())}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create 8 Test Scenarios
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Selected Card Status</label>
                {selectedCardData ? (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={selectedCardData.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedCardData.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm font-medium">{Math.round(selectedCardData.progress)}%</span>
                    </div>
                    <p className="text-xs text-gray-600">{selectedCardData.business_name}</p>
                    <p className="text-xs text-gray-500">{selectedCardData.current_stamps}/{selectedCardData.total_stamps} stamps</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                    No card selected
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Wallet Testing */}
        {selectedCardData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Google Wallet Testing - {selectedCardData.name}
              </CardTitle>
              <CardDescription>
                Test Google Wallet pass generation and QR code functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Google Wallet Button */}
                <div className="text-center space-y-3">
                  <h4 className="font-semibold flex items-center justify-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Google Wallet Pass
                  </h4>
                  <Button
                    onClick={() => testGoogleWallet(selectedCardData.id)}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 font-medium py-3"
                    style={{ backgroundColor: '#4285f4' }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                    </svg>
                    Add to Google Wallet
                  </Button>
                  <p className="text-xs text-gray-600 mb-2">
                    Opens Google Wallet pass in new tab
                  </p>
                  <div className="text-xs text-blue-600 font-medium">
                    ✓ Level L QR codes • ✓ 256x256px optimized • ✓ 4-module padding
                  </div>
                </div>

                {/* QR Code Preview */}
                <div className="text-center space-y-3">
                  <h4 className="font-semibold flex items-center justify-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Join QR Code
                  </h4>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <QRCode
                      id={`qr-${selectedCardData.id}`}
                      value={getJoinUrl(selectedCardData.id)}
                      size={128}
                      level="L"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-xs text-gray-600 max-w-xs break-all">
                    {getJoinUrl(selectedCardData.id)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testQRCodeGeneration(selectedCardData.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Test QR Code
                  </Button>
                </div>

                {/* Card Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Card Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business:</span>
                      <span className="font-medium">{selectedCardData.business_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{selectedCardData.current_stamps}/{selectedCardData.total_stamps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reward:</span>
                      <span className="font-medium text-xs">{selectedCardData.reward_description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Test Scenario:</span>
                      <Badge variant="outline">{selectedCardData.test_scenario}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Wallet Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Google Wallet API Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <Badge variant={performanceMetrics.google_wallet.avg_response_time < 2000 ? 'default' : 'destructive'}>
                    {performanceMetrics.google_wallet.avg_response_time}ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <Badge variant={performanceMetrics.google_wallet.success_rate >= 95 ? 'default' : 'destructive'}>
                    {performanceMetrics.google_wallet.success_rate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="font-medium">{performanceMetrics.google_wallet.total_requests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg File Size</span>
                  <span className="font-medium">{performanceMetrics.google_wallet.avg_file_size}KB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Generation Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Generation Time</span>
                  <Badge variant={performanceMetrics.qr_generation.avg_response_time < 100 ? 'default' : 'destructive'}>
                    {performanceMetrics.qr_generation.avg_response_time}ms
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <Badge variant={performanceMetrics.qr_generation.success_rate >= 95 ? 'default' : 'destructive'}>
                    {performanceMetrics.qr_generation.success_rate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Generated</span>
                  <span className="font-medium">{performanceMetrics.qr_generation.total_generated}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Size (bytes)</span>
                  <span className="font-medium">{performanceMetrics.qr_generation.avg_size}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Duration</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Badge variant="outline">{result.test_type}</Badge>
                      </td>
                      <td className="p-2">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </td>
                      <td className="p-2">{result.duration_ms}ms</td>
                      <td className="p-2">{result.response_size_kb}KB</td>
                      <td className="p-2">{new Date(result.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {testResults.length === 0 && (
                <p className="text-center text-gray-500 py-4">No test results yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">System Status</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Base URL:</strong> {baseUrl}</p>
                  <p><strong>Production Domain:</strong> {PRODUCTION_DOMAIN}</p>
                  <p><strong>Auto Refresh:</strong> {isAutoRefresh ? 'Active' : 'Inactive'}</p>
                  <p><strong>Test Cards:</strong> {testCards.length}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Selected Card</h4>
                {selectedCardData ? (
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>ID:</strong> {selectedCardData.id.substring(0, 8)}...</p>
                    <p><strong>Status:</strong> {selectedCardData.status}</p>
                    <p><strong>Progress:</strong> {Math.round(selectedCardData.progress)}%</p>
                    <p><strong>Join URL:</strong> {getJoinUrl(selectedCardData.id).substring(0, 40)}...</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No card selected</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" onClick={() => window.open('/api/health/env', '_blank')}>
                    View Environment Status
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open('/api/debug/env', '_blank')}>
                    Debug Private Key
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open('/api/test/results', '_blank')}>
                    View All Test Results
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}