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
  BarChart3,
  Shield,
  Bug,
  QrCode,
  Wifi,
  WifiOff,
  Server,
  Activity,
  Target,
  Users,
  Settings,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Timer,
  Gauge
} from 'lucide-react'

// Types
interface TestCard {
  id: string
  current_stamps: number
  total_stamps: number
  completion_percentage: number
  stamp_card_name: string
  business_name: string
  customer_name: string
  customer_email: string
  created_at: string
  updated_at: string
  test_urls: {
    apple: string
    google: string
    pwa: string
    debug: string
  }
}

interface EnvironmentStatus {
  apple_wallet: 'available' | 'missing_certificates' | 'error'
  google_wallet: 'available' | 'missing_config' | 'error'
  pwa_wallet: 'available' | 'error'
  certificates: {
    apple_cert: boolean
    apple_key: boolean
    apple_wwdr: boolean
    google_service_account: boolean
  }
  database: 'connected' | 'error'
  overall_status: 'operational' | 'degraded' | 'error'
}

interface TestResult {
  id: string
  url: string
  status: 'success' | 'error' | 'pending'
  responseTime: number
  fileSize: number
  contentType: string
  errorMessage?: string
  timestamp: string
  passData?: any
}

interface PerformanceMetrics {
  averageResponseTime: number
  successRate: number
  totalRequests: number
  errorCount: number
  averageFileSize: number
}

export default function WalletPreviewTest() {
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    successRate: 0,
    totalRequests: 0,
    errorCount: 0,
    averageFileSize: 0
  })
  const [loading, setLoading] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState('createAll')
  const [customCardId, setCustomCardId] = useState('')
  const [showQRCodes, setShowQRCodes] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)

  // Browser detection and fallback
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroid = userAgent.includes('android')
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
    const isDesktop = !isAndroid && !isIOS
    
    return { isAndroid, isIOS, isSafari, isDesktop }
  }

  // Show browser-specific instructions
  const showBrowserFallback = (walletType: string) => {
    const { isAndroid, isIOS, isSafari, isDesktop } = detectBrowser()
    
    if (walletType === 'apple' && isAndroid) {
      return {
        message: "Apple Wallet is not available on Android devices.",
        instructions: [
          "1. Try Google Pay wallet instead",
          "2. Use our Progressive Web App (PWA)",
          "3. Save card details to your phone's gallery"
        ],
        alternatives: [
          { name: "Google Pay", action: "Try Google Wallet" },
          { name: "PWA Wallet", action: "Open Web Wallet" }
        ]
      }
    }
    
    if (walletType === 'apple' && isDesktop) {
      return {
        message: "Apple Wallet is designed for mobile devices.",
        instructions: [
          "1. Open this link on your iPhone",
          "2. Use the QR code to transfer to mobile",
          "3. Email the link to yourself"
        ]
      }
    }
    
    if (walletType === 'apple' && isIOS && !isSafari) {
      return {
        message: "Apple Wallet works best with Safari on iOS.",
        instructions: [
          "1. Copy the link and open in Safari",
          "2. Or use the 'Open in Safari' option",
          "3. Safari will open Apple Wallet automatically"
        ]
      }
    }
    
    return null
  }

  // Fetch environment status
  const fetchEnvironmentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/wallet')
      const data = await response.json()
      setEnvironmentStatus(data)
    } catch (error) {
      console.error('Error fetching environment status:', error)
    }
  }, [])

  // Fetch existing test cards
  const fetchTestCards = useCallback(async () => {
    try {
      const response = await fetch('/api/dev-seed', { method: 'GET' })
      const data = await response.json()
      
      if (data.success) {
        setTestCards(data.cards || [])
      }
    } catch (error) {
      console.error('Error fetching test cards:', error)
    }
  }, [])

  // Generate test data
  const generateTestData = async () => {
    setLoading(true)
    try {
      const payload = selectedScenario === 'createAll' 
        ? { createAll: true }
        : { scenario: selectedScenario, count: 1 }

      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchTestCards()
        console.log('✅ Test data generated successfully:', data)
      } else {
        console.error('❌ Failed to generate test data:', data)
      }
    } catch (error) {
      console.error('❌ Error generating test data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clean up test data
  const cleanupTestData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanup: true })
      })

      const data = await response.json()
      
      if (data.success) {
        setTestCards([])
        setTestResults([])
        console.log('✅ Test data cleaned up successfully')
      }
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Test wallet pass generation
  const testWalletPass = async (cardId: string, walletType: 'apple' | 'google' | 'pwa', debug = false) => {
    const testId = `${cardId}-${walletType}${debug ? '-debug' : ''}`
    const url = debug 
      ? `/api/wallet/${walletType}/${cardId}?debug=true`
      : `/api/wallet/${walletType}/${cardId}`

    // Add pending result
    const pendingResult: TestResult = {
      id: testId,
      url,
      status: 'pending',
      responseTime: 0,
      fileSize: 0,
      contentType: '',
      timestamp: new Date().toISOString()
    }

    setTestResults(prev => [pendingResult, ...prev.filter(r => r.id !== testId)])

    try {
      const startTime = Date.now()
      const response = await fetch(url)
      const responseTime = Date.now() - startTime
      
      const contentType = response.headers.get('content-type') || ''
      const contentLength = response.headers.get('content-length')
      const fileSize = contentLength ? parseInt(contentLength) : 0

      let passData = null
      if (debug || contentType.includes('application/json')) {
        try {
          passData = await response.json()
        } catch (e) {
          // Not JSON, that's fine
        }
      }

      const result: TestResult = {
        id: testId,
        url,
        status: response.ok ? 'success' : 'error',
        responseTime,
        fileSize,
        contentType,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        passData
      }

      setTestResults(prev => [result, ...prev.filter(r => r.id !== testId)])
      updatePerformanceMetrics(result)

    } catch (error) {
      const result: TestResult = {
        id: testId,
        url,
        status: 'error',
        responseTime: 0,
        fileSize: 0,
        contentType: '',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }

      setTestResults(prev => [result, ...prev.filter(r => r.id !== testId)])
      updatePerformanceMetrics(result)
    }
  }

  // Update performance metrics
  const updatePerformanceMetrics = (result: TestResult) => {
    setPerformanceMetrics(prev => {
      const newTotalRequests = prev.totalRequests + 1
      const newErrorCount = prev.errorCount + (result.status === 'error' ? 1 : 0)
      const newSuccessRate = ((newTotalRequests - newErrorCount) / newTotalRequests) * 100

      return {
        averageResponseTime: (prev.averageResponseTime * prev.totalRequests + result.responseTime) / newTotalRequests,
        successRate: newSuccessRate,
        totalRequests: newTotalRequests,
        errorCount: newErrorCount,
        averageFileSize: result.fileSize > 0 
          ? (prev.averageFileSize * prev.totalRequests + result.fileSize) / newTotalRequests
          : prev.averageFileSize
      }
    })
  }

  // Generate QR code URL
  const generateQRCodeURL = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'available':
      case 'operational':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Timer className="h-4 w-4 text-yellow-600" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  // Get completion status badge
  const getCompletionBadge = (percentage: number) => {
    if (percentage === 0) return <Badge variant="secondary">Empty</Badge>
    if (percentage < 50) return <Badge variant="outline">In Progress</Badge>
    if (percentage < 100) return <Badge variant="default">Almost Complete</Badge>
    if (percentage === 100) return <Badge className="bg-green-600">Completed</Badge>
    return <Badge className="bg-purple-600">Over-Complete</Badge>
  }

  // Initialize data
  useEffect(() => {
    fetchEnvironmentStatus()
    fetchTestCards()
  }, [fetchEnvironmentStatus, fetchTestCards])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchTestCards()
        fetchEnvironmentStatus()
      }, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchTestCards, fetchEnvironmentStatus])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TestTube className="h-8 w-8 text-blue-600" />
                Apple Wallet Test Suite
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive testing and debugging for Apple Wallet integration
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                Auto-refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchTestCards()
                  fetchEnvironmentStatus()
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Environment Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(environmentStatus?.overall_status || 'error')}
                <span className="text-sm capitalize">
                  {environmentStatus?.overall_status || 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Apple Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(environmentStatus?.apple_wallet || 'error')}
                <span className="text-sm capitalize">
                  {environmentStatus?.apple_wallet?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Google Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(environmentStatus?.google_wallet || 'error')}
                <span className="text-sm capitalize">
                  {environmentStatus?.google_wallet?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                PWA Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getStatusIcon(environmentStatus?.pwa_wallet || 'available')}
                <span className="text-sm capitalize">
                  {environmentStatus?.pwa_wallet || 'Available'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {performanceMetrics.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {performanceMetrics.totalRequests} total requests
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {performanceMetrics.averageResponseTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-500">
                Average response time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Avg File Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(performanceMetrics.averageFileSize / 1024).toFixed(1)}KB
              </div>
              <div className="text-xs text-gray-500">
                Average PKPass size
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Error Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {performanceMetrics.errorCount}
              </div>
              <div className="text-xs text-gray-500">
                Total errors
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Test Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {testCards.length}
              </div>
              <div className="text-xs text-gray-500">
                Available test cards
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>
              Generate test data and configure testing scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="scenario">Test Scenario</Label>
                <select
                  id="scenario"
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="createAll">All Scenarios (8 cards)</option>
                  <option value="empty">Empty Card (0 stamps)</option>
                  <option value="half_complete">Half Complete (5/10)</option>
                  <option value="almost_complete">Almost Complete (9/10)</option>
                  <option value="completed">Completed (10/10)</option>
                  <option value="over_complete">Over-Complete (12/10)</option>
                  <option value="large_card">Large Card (15/50)</option>
                  <option value="small_card">Small Card (2/3)</option>
                  <option value="long_names">Long Names Test</option>
                </select>
              </div>

              <div>
                <Label htmlFor="customCard">Custom Card ID</Label>
                <Input
                  id="customCard"
                  value={customCardId}
                  onChange={(e) => setCustomCardId(e.target.value)}
                  placeholder="Enter existing card ID"
                />
              </div>

              <div>
                <Label htmlFor="refreshInterval">Auto-refresh (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  min="10"
                  max="300"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generateTestData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Generate Test Data
              </Button>

              <Button
                onClick={cleanupTestData}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clean Up Test Data
              </Button>

              <Button
                onClick={() => setShowQRCodes(!showQRCodes)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                {showQRCodes ? 'Hide' : 'Show'} QR Codes
              </Button>

              <Button
                onClick={() => setTestResults([])}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Test Cards ({testCards.length})
            </CardTitle>
            <CardDescription>
              Available test cards for wallet testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No test cards available. Generate some test data to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {testCards.map((card) => (
                  <div key={card.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{card.stamp_card_name}</h3>
                        <p className="text-xs text-gray-600">{card.business_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCompletionBadge(card.completion_percentage)}
                        <span className="text-sm font-mono">
                          {card.current_stamps}/{card.total_stamps}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <div>Customer: {card.customer_name}</div>
                      <div>Created: {new Date(card.created_at).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2">
                        ID: {card.id}
                        <button
                          onClick={() => copyToClipboard(card.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* QR Code Preview */}
                    {showQRCodes && (
                      <div className="flex justify-center">
                        <img
                          src={generateQRCodeURL(card.id)}
                          alt={`QR Code for ${card.id}`}
                          className="w-20 h-20 border rounded"
                        />
                      </div>
                    )}

                    {/* Browser Compatibility Check */}
                    {(() => {
                      const fallback = showBrowserFallback('apple')
                      if (fallback) {
                        return (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-yellow-800">{fallback.message}</span>
                            </div>
                            <ul className="text-yellow-700 space-y-1 mb-2">
                              {fallback.instructions.map((instruction, idx) => (
                                <li key={idx} className="text-xs">{instruction}</li>
                              ))}
                            </ul>
                            {fallback.alternatives && (
                              <div className="flex gap-2">
                                {fallback.alternatives.map((alt, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => testWalletPass(card.id, alt.name.toLowerCase().includes('google') ? 'google' : 'pwa')}
                                    className="text-xs"
                                  >
                                    {alt.action}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Test Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => testWalletPass(card.id, 'apple')}
                        className="flex items-center gap-1"
                      >
                        <Smartphone className="h-3 w-3" />
                        Apple
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => testWalletPass(card.id, 'google')}
                        className="flex items-center gap-1"
                      >
                        <CreditCard className="h-3 w-3" />
                        Google
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => testWalletPass(card.id, 'pwa')}
                        className="flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        PWA
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testWalletPass(card.id, 'apple', true)}
                        className="flex items-center gap-1"
                      >
                        <Bug className="h-3 w-3" />
                        Debug
                      </Button>
                    </div>

                    {/* Direct Links */}
                    <div className="flex flex-wrap gap-1 text-xs">
                      <a
                        href={card.test_urls.apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Apple
                      </a>
                      <a
                        href={card.test_urls.google}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google
                      </a>
                      <a
                        href={card.test_urls.pwa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        PWA
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Results ({testResults.length})
            </CardTitle>
            <CardDescription>
              Real-time test results and performance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No test results yet. Run some tests to see results here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.slice(0, 10).map((result) => (
                  <div key={result.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="text-sm font-mono">{result.url}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {result.responseTime > 0 && (
                          <span>{result.responseTime}ms</span>
                        )}
                        {result.fileSize > 0 && (
                          <span>{(result.fileSize / 1024).toFixed(1)}KB</span>
                        )}
                        <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {result.errorMessage && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        {result.errorMessage}
                      </div>
                    )}
                    
                    {result.passData && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          View Pass Data
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.passData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            RewardJar 4.0 Apple Wallet Test Suite - 
            <Link href="/doc/test-wallet-preview.md" className="text-blue-600 hover:text-blue-800 ml-1">
              Documentation
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}