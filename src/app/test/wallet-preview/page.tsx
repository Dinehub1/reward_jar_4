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

// Type definitions based on Google Wallet best practices
interface TestCard {
  id: string
  name: string
  business_name: string
  current_stamps: number
  total_stamps: number
  reward_description: string
  created_at: string
  wallet_type?: string
}

interface WalletCardProps {
  card: TestCard
  onSelect: (cardId: string) => void
  isSelected: boolean
  passData?: Record<string, unknown>
}

interface TestResult {
  id: string
  card_id: string
  test_type: string
  status: 'success' | 'failed' | 'pending'
  duration_ms: number
  response_size_kb: number
  created_at: string
  error_message?: string
}

interface PerformanceMetrics {
  averageResponseTime: number
  successRate: number
  totalTests: number
  errorCount: number
  averageFileSize: number
}

interface EnvironmentStatus {
  status: string
  googleWallet: {
    configured: boolean
    privateKeyValid: boolean
    serviceAccountValid: boolean
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
  // State management
  const [testCards, setTestCards] = useState<TestCard[]>([])
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageResponseTime: 0,
    successRate: 0,
    totalTests: 0,
    errorCount: 0,
    averageFileSize: 0
  })
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus | null>(null)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Fetch test cards from dev-seed API
  const fetchTestCards = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dev-seed')
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Dev-seed API requires authentication in production. Set DEV_SEED_API_KEY environment variable.')
        }
        throw new Error(`Failed to fetch test cards: ${response.status}`)
      }
      
      const data = await response.json()
      setTestCards(data.cards || [])
    } catch (error) {
      console.error('Error fetching test cards:', error)
      setTestCards([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Generate test data
  const generateTestData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dev-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ createAll: true })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate test data: ${response.status}`)
      }
      
      await fetchTestCards()
    } catch (error) {
      console.error('Error generating test data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check environment status
  const checkEnvironmentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/health/env')
      if (response.ok) {
        const data = await response.json()
        setEnvironmentStatus(data)
      }
    } catch (error) {
      console.error('Error checking environment status:', error)
    }
  }, [])

  // Fetch test results
  const fetchTestResults = useCallback(async () => {
    try {
      const response = await fetch('/api/test/results')
      if (response.ok) {
        const data = await response.json()
        setTestResults(data.results || [])
        
        // Calculate performance metrics
        if (data.results && data.results.length > 0) {
          const results = data.results as TestResult[]
          const successCount = results.filter(r => r.status === 'success').length
          const totalTests = results.length
          const avgResponseTime = results.reduce((acc, r) => acc + r.duration_ms, 0) / totalTests
          const avgFileSize = results.reduce((acc, r) => acc + r.response_size_kb, 0) / totalTests
          const errorCount = results.filter(r => r.status === 'failed').length
          
          setPerformanceMetrics({
            averageResponseTime: Math.round(avgResponseTime),
            successRate: Math.round((successCount / totalTests) * 100),
            totalTests,
            errorCount,
            averageFileSize: Math.round(avgFileSize * 10) / 10
          })
        }
      }
    } catch (error) {
      console.error('Error fetching test results:', error)
    }
  }, [])

  // Test Google Wallet link generation
  const testGoogleWalletLink = async (cardId: string) => {
    const startTime = Date.now()
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/wallet/google/${cardId}`)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      let responseSize = 0
      let responseData = null
      
      if (response.ok) {
        try {
          const text = await response.text()
          responseSize = new Blob([text]).size / 1024 // KB
          responseData = text
        } catch {
          // Not JSON, that's fine
        }
        
        // Log successful test result
        await logTestResult(cardId, 'google_wallet', 'success', duration, responseSize)
        
        // Extract saveUrl from response for opening
        if (responseData && typeof responseData === 'string') {
          // Look for saveUrl in the response
          const saveUrlMatch = responseData.match(/https:\/\/pay\.google\.com\/gp\/v\/save\/[^"'\s<>]+/)
          if (saveUrlMatch) {
            const saveUrl = saveUrlMatch[0]
            window.open(saveUrl, '_blank')
          } else {
            // Fallback: try to open the API response directly if it's a redirect
            window.open(`/api/wallet/google/${cardId}`, '_blank')
          }
        }
      } else {
        const errorText = await response.text()
        await logTestResult(cardId, 'google_wallet', 'failed', duration, responseSize, errorText)
        throw new Error(`Google Wallet API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      await logTestResult(cardId, 'google_wallet', 'failed', duration, 0, (error as Error).message)
      console.error('Google Wallet test failed:', error)
      alert(`Google Wallet test failed: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
      await fetchTestResults()
    }
  }

  // Test Apple Wallet link generation
  const testAppleWalletLink = async (cardId: string) => {
    const startTime = Date.now()
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/wallet/apple/${cardId}`)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (response.ok) {
        const blob = await response.blob()
        const responseSize = blob.size / 1024 // KB
        
        await logTestResult(cardId, 'apple_wallet', 'success', duration, responseSize)
        
        // Create download link for PKPass
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `loyalty-card-${cardId}.pkpass`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorText = await response.text()
        await logTestResult(cardId, 'apple_wallet', 'failed', duration, 0, errorText)
        throw new Error(`Apple Wallet API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      await logTestResult(cardId, 'apple_wallet', 'failed', duration, 0, (error as Error).message)
      console.error('Apple Wallet test failed:', error)
      alert(`Apple Wallet test failed: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
      await fetchTestResults()
    }
  }

  // Test PWA Wallet link
  const testPWAWalletLink = async (cardId: string) => {
    const startTime = Date.now()
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/wallet/pwa/${cardId}`)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      if (response.ok) {
        const text = await response.text()
        const responseSize = new Blob([text]).size / 1024 // KB
        
        await logTestResult(cardId, 'pwa_wallet', 'success', duration, responseSize)
        window.open(`/api/wallet/pwa/${cardId}`, '_blank')
      } else {
        const errorText = await response.text()
        await logTestResult(cardId, 'pwa_wallet', 'failed', duration, 0, errorText)
        throw new Error(`PWA Wallet API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      await logTestResult(cardId, 'pwa_wallet', 'failed', duration, 0, (error as Error).message)
      console.error('PWA Wallet test failed:', error)
      alert(`PWA Wallet test failed: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
      await fetchTestResults()
    }
  }

  // Log test result
  const logTestResult = async (
    cardId: string, 
    testType: string, 
    status: 'success' | 'failed', 
    duration: number, 
    responseSize: number, 
    errorMessage?: string
  ) => {
    try {
      await fetch('/api/test/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: cardId,
          test_type: testType,
          status,
          duration_ms: duration,
          response_size_kb: responseSize,
          error_message: errorMessage
        })
      })
    } catch (error) {
      console.error('Error logging test result:', error)
    }
  }

  // Clear all test results
  const clearTestResults = async () => {
    try {
      const response = await fetch('/api/test/results', {
        method: 'DELETE'
      })
      if (response.ok) {
        setTestResults([])
        setPerformanceMetrics({
          averageResponseTime: 0,
          successRate: 0,
          totalTests: 0,
          errorCount: 0,
          averageFileSize: 0
        })
      }
    } catch (error) {
      console.error('Error clearing test results:', error)
    }
  }

  // Toggle auto-refresh
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
        fetchTestResults()
        checkEnvironmentStatus()
      }, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
      setIsAutoRefresh(true)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        alert('Copied to clipboard!')
      } catch {
        fallbackCopyToClipboard(text)
      }
    } else {
      fallbackCopyToClipboard(text)
    }
  }

  // Fallback copy method
  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      alert('Copied to clipboard!')
    } catch {
      alert('Copy to clipboard failed. Please copy manually.')
    }
    document.body.removeChild(textArea)
  }

  // Initial data load
  useEffect(() => {
    fetchTestCards()
    fetchTestResults()
    checkEnvironmentStatus()
  }, [fetchTestCards, fetchTestResults, checkEnvironmentStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  // Generate QR code URL for production domain
  const generateQRCodeUrl = (cardId: string) => {
    const joinUrl = `https://www.rewardjar.xyz/join/${cardId}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            🧪 Google Wallet Testing Interface
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive testing environment for Google Wallet integration with performance 
            metrics, QR code generation, and real-time error tracking. Based on the latest 
            Google Wallet testing best practices for 2025.
          </p>
        </div>

        {/* Environment Status Card */}
        {environmentStatus && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Environment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">🤖 Google Wallet</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {environmentStatus.googleWallet?.configured ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span>Service Account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {environmentStatus.googleWallet?.privateKeyValid ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span>Private Key Format</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-600">🍎 Apple Wallet</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {environmentStatus.appleWallet?.configured ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span>Certificates</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-600">📱 PWA Wallet</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Always Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {performanceMetrics.averageResponseTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceMetrics.successRate}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {performanceMetrics.totalTests}
                  </div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {performanceMetrics.errorCount}
                  </div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {performanceMetrics.averageFileSize}KB
                  </div>
                  <div className="text-sm text-gray-600">Avg File Size</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Test Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={generateTestData} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generate Test Data
              </Button>
              
              <Button variant="outline" onClick={fetchTestCards} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Cards
              </Button>
              
              <Button 
                variant={isAutoRefresh ? "destructive" : "outline"} 
                onClick={toggleAutoRefresh}
              >
                <Clock className="h-4 w-4 mr-2" />
                {isAutoRefresh ? 'Stop Auto-Refresh' : 'Start Auto-Refresh'}
              </Button>
              
              {testResults.length > 0 && (
                <Button variant="outline" onClick={clearTestResults}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Test Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                Available Test Cards ({testCards.length})
              </CardTitle>
              <CardDescription>
                Select a test card to generate Google Wallet links and QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testCards.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">No Test Cards Available</h3>
                    <p className="text-gray-600 mt-2">
                      Click &quot;Generate Test Data&quot; to create sample loyalty cards for testing.
                    </p>
                    
                    {process.env.NODE_ENV === 'production' && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Vercel Deployment Detected</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          If you&apos;re seeing this on Vercel, make sure you&apos;ve set up the required environment variables:
                        </p>
                        <ul className="text-blue-700 text-sm mt-2 list-disc list-inside">
                          <li>NEXT_PUBLIC_SUPABASE_URL</li>
                          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                          <li>SUPABASE_SERVICE_ROLE_KEY</li>
                          <li>GOOGLE_SERVICE_ACCOUNT_EMAIL</li>
                          <li>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</li>
                          <li>DEV_SEED_API_KEY (for test data generation)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testCards.map((card) => (
                    <WalletCard
                      key={card.id}
                      card={card}
                      onSelect={setSelectedCard}
                      isSelected={selectedCard === card.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Card Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                Wallet Testing Actions
              </CardTitle>
              <CardDescription>
                Test Google Wallet link generation and other wallet integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCard ? (
                <div className="space-y-6">
                  {/* Google Wallet - Primary Focus */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                      🤖 Google Wallet Testing (Primary)
                    </h3>
                    <Button 
                      onClick={() => testGoogleWalletLink(selectedCard)}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                    >
                      <Image
                        src="https://developers.google.com/static/wallet/images/branding/temp-wallet-primary.png"
                        alt="Add to Google Wallet"
                        width={120}
                        height={40}
                        className="mr-2"
                      />
                    </Button>
                    <p className="text-sm text-gray-600">
                      Tests JWT generation, saveUrl creation, and Google Wallet integration according to 
                      Google&apos;s latest 2025 testing guidelines.
                    </p>
                  </div>

                  {/* QR Code Preview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
                      📱 QR Code Preview
                    </h3>
                    <div className="flex flex-col items-center space-y-2">
                      <Image
                        src={generateQRCodeUrl(selectedCard)}
                        alt="QR Code for card join URL"
                        width={200}
                        height={200}
                        className="border rounded-lg"
                      />
                      <p className="text-sm text-gray-600 text-center">
                        Scan to join: https://www.rewardjar.xyz/join/{selectedCard}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`https://www.rewardjar.xyz/join/${selectedCard}`)}
                      >
                        Copy Join URL
                      </Button>
                    </div>
                  </div>

                  {/* Secondary Wallet Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-600">
                      Secondary Wallet Options
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => testAppleWalletLink(selectedCard)}
                        disabled={isLoading}
                        className="h-10"
                      >
                        🍎 Test Apple Wallet PKPass
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testPWAWalletLink(selectedCard)}
                        disabled={isLoading}
                        className="h-10"
                      >
                        📱 Test PWA Wallet
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-900 mt-4">Select a Test Card</h3>
                  <p className="text-gray-600 mt-2">
                    Choose a test card from the left panel to begin wallet testing.
                  </p>
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
                <Activity className="h-5 w-5 text-purple-600" />
                Recent Test Results ({testResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-semibold">
                          {result.test_type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Card: {result.card_id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.duration_ms}ms • {result.response_size_kb}KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4 border-t">
          <p>
            🚀 RewardJar 4.0 • Google Wallet Testing Interface • 
            Based on 2025 Google Wallet Best Practices • 
            <a href="/api/health/env" target="_blank" className="text-blue-600 hover:underline ml-1">
              <ExternalLink className="h-4 w-4 inline" />
              Check Environment Status
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Wallet Card Component
function WalletCard({ card, onSelect, isSelected }: WalletCardProps) {
  const progress = card.total_stamps > 0 ? (card.current_stamps / card.total_stamps) * 100 : 0
  const isCompleted = card.current_stamps >= card.total_stamps

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(card.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{card.name}</h3>
          <p className="text-sm text-gray-600">{card.business_name}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {card.current_stamps}/{card.total_stamps}</span>
              <Badge variant={isCompleted ? 'default' : 'outline'}>
                {Math.round(progress)}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {isSelected && (
          <div className="ml-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        )}
      </div>
    </div>
  )
}