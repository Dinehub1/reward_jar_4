'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Wallet, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  TestTube,
  Smartphone,
  Apple,
  Globe,
  Download,
  Eye,
  Settings,
  Zap
} from 'lucide-react'

interface CardTest {
  id: string
  name: string
  type: 'stamp' | 'membership'
  status: 'idle' | 'running' | 'passed' | 'failed'
  lastRun?: Date
  duration?: number
  walletStatus: {
    apple: 'success' | 'failed' | 'pending'
    google: 'success' | 'failed' | 'pending'
    pwa: 'success' | 'failed' | 'pending'
  }
  qrGenerated: boolean
  features: string[]
}

interface WalletTest {
  id: string
  platform: 'apple' | 'google' | 'pwa'
  name: string
  status: 'idle' | 'running' | 'passed' | 'failed'
  endpoint: string
  lastTest?: Date
  responseTime?: number
}

export default function TestCardsPage() {
  const [cardTests, setCardTests] = useState<CardTest[]>([])
  const [walletTests, setWalletTests] = useState<WalletTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTestData()
  }, [])

  const loadTestData = async () => {
    setIsLoading(true)
    
    try {
      // Simulate loading test data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockCardTests: CardTest[] = [
        {
          id: 'stamp-card-basic',
          name: 'Basic Stamp Card Creation',
          type: 'stamp',
          status: 'passed',
          lastRun: new Date(Date.now() - 300000),
          duration: 2100,
          walletStatus: {
            apple: 'success',
            google: 'success',
            pwa: 'success'
          },
          qrGenerated: true,
          features: ['QR Generation', 'Wallet Provisioning', 'Customer Join']
        },
        {
          id: 'membership-card-basic',
          name: 'Basic Membership Card Creation',
          type: 'membership',
          status: 'passed',
          lastRun: new Date(Date.now() - 600000),
          duration: 1800,
          walletStatus: {
            apple: 'success',
            google: 'failed',
            pwa: 'success'
          },
          qrGenerated: true,
          features: ['Session Tracking', 'Payment Integration', 'Expiry Management']
        },
        {
          id: 'stamp-card-advanced',
          name: 'Advanced Stamp Card with Rewards',
          type: 'stamp',
          status: 'failed',
          lastRun: new Date(Date.now() - 120000),
          duration: 3200,
          walletStatus: {
            apple: 'success',
            google: 'pending',
            pwa: 'failed'
          },
          qrGenerated: false,
          features: ['Multi-tier Rewards', 'Custom Stamps', 'Expiry Rules']
        },
        {
          id: 'membership-card-premium',
          name: 'Premium Membership with Analytics',
          type: 'membership',
          status: 'idle',
          walletStatus: {
            apple: 'pending',
            google: 'pending',
            pwa: 'pending'
          },
          qrGenerated: false,
          features: ['Analytics Dashboard', 'Usage Tracking', 'Auto-renewal']
        }
      ]

      const mockWalletTests: WalletTest[] = [
        {
          id: 'apple-wallet-test',
          platform: 'apple',
          name: 'Apple Wallet Service',
          status: 'passed',
          endpoint: '/api/wallet/apple/test',
          lastTest: new Date(Date.now() - 180000),
          responseTime: 245
        },
        {
          id: 'google-wallet-test',
          platform: 'google',
          name: 'Google Wallet Service',
          status: 'failed',
          endpoint: '/api/wallet/google/test',
          lastTest: new Date(Date.now() - 240000),
          responseTime: 5000
        },
        {
          id: 'pwa-wallet-test',
          platform: 'pwa',
          name: 'PWA Wallet Service',
          status: 'passed',
          endpoint: '/api/wallet/pwa/test',
          lastTest: new Date(Date.now() - 360000),
          responseTime: 150
        }
      ]

      setCardTests(mockCardTests)
      setWalletTests(mockWalletTests)
    } catch (error) {
      console.error('Error loading test data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runCardTest = async (testId: string) => {
    setRunningTests(prev => new Set([...prev, testId]))
    setCardTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', lastRun: new Date() }
        : test
    ))

    // Simulate test execution
    try {
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 4000))
      
      const success = Math.random() > 0.3 // 70% success rate
      const duration = Math.round(1500 + Math.random() * 3000)
      
      setCardTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' : 'failed',
              duration,
              lastRun: new Date(),
              qrGenerated: success,
              walletStatus: {
                apple: success && Math.random() > 0.2 ? 'success' : 'failed',
                google: success && Math.random() > 0.3 ? 'success' : 'failed',
                pwa: success && Math.random() > 0.1 ? 'success' : 'failed'
              }
            }
          : test
      ))
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(testId)
        return newSet
      })
    }
  }

  const runWalletTest = async (testId: string) => {
    setRunningTests(prev => new Set([...prev, testId]))
    setWalletTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', lastTest: new Date() }
        : test
    ))

    try {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      const success = Math.random() > 0.25 // 75% success rate
      const responseTime = Math.round(100 + Math.random() * 2000)
      
      setWalletTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' : 'failed',
              responseTime,
              lastTest: new Date()
            }
          : test
      ))
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(testId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-gray-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'apple': return <Apple className="h-4 w-4" />
      case 'google': return <Smartphone className="h-4 w-4" />
      case 'pwa': return <Globe className="h-4 w-4" />
      default: return <Wallet className="h-4 w-4" />
    }
  }

  const getCardTypeIcon = (type: string) => {
    return type === 'stamp' ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" />
  }

  if (isLoading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Card Tests...</p>
            <p className="text-sm text-muted-foreground">Initializing test environment</p>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  const stats = {
    totalTests: cardTests.length,
    passed: cardTests.filter(t => t.status === 'passed').length,
    failed: cardTests.filter(t => t.status === 'failed').length,
    running: runningTests.size,
    walletSuccess: walletTests.filter(t => t.status === 'passed').length
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🎴 Card Testing</h1>
            <p className="text-muted-foreground">
              Card functionality and wallet integration testing suite
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              {stats.passed}/{stats.totalTests} Tests Passing
            </Badge>
            <Button onClick={loadTestData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                </div>
                <TestTube className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Passing</p>
                  <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Running</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Wallet Services</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.walletSuccess}/3</p>
                </div>
                <Wallet className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards">Card Tests</TabsTrigger>
            <TabsTrigger value="wallets">Wallet Services</TabsTrigger>
            <TabsTrigger value="tools">Testing Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4">
            {/* Card Tests */}
            <div className="space-y-4">
              {cardTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCardTypeIcon(test.type)}
                        <div>
                          <CardTitle className="text-lg">{test.name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {test.type} Card
                            </Badge>
                            {test.duration && (
                              <span>Duration: {test.duration}ms</span>
                            )}
                            {test.lastRun && (
                              <span>Last run: {test.lastRun.toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => runCardTest(test.id)}
                          disabled={runningTests.has(test.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run Test
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Wallet Status */}
                      <div>
                        <p className="text-sm font-medium mb-2">Wallet Integration Status:</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Apple className="h-4 w-4" />
                            <span className="text-sm">Apple</span>
                            {getStatusIcon(test.walletStatus.apple)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-4 w-4" />
                            <span className="text-sm">Google</span>
                            {getStatusIcon(test.walletStatus.google)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm">PWA</span>
                            {getStatusIcon(test.walletStatus.pwa)}
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <p className="text-sm font-medium mb-2">Test Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {test.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <QrCode className="h-4 w-4" />
                          <span>QR Generated: {test.qrGenerated ? 'Yes' : 'No'}</span>
                          {getStatusIcon(test.qrGenerated ? 'success' : 'failed')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            {/* Wallet Tests */}
            <div className="space-y-4">
              {walletTests.map((test) => (
                <Card key={test.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(test.platform)}
                        <div>
                          <h3 className="font-semibold">{test.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {test.endpoint}
                            </code>
                            {test.responseTime && (
                              <span>Response: {test.responseTime}ms</span>
                            )}
                            {test.lastTest && (
                              <span>Last test: {test.lastTest.toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => runWalletTest(test.id)}
                          disabled={runningTests.has(test.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            {/* Testing Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/cards/new', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">Create Test Card</h3>
                      <p className="text-sm text-muted-foreground">Create new cards for testing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/sandbox', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold">Card Preview</h3>
                      <p className="text-sm text-muted-foreground">Preview cards in sandbox</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/api-health', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold">API Health</h3>
                      <p className="text-sm text-muted-foreground">Test wallet API endpoints</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/cards', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8 text-orange-500" />
                    <div>
                      <h3 className="font-semibold">Card Management</h3>
                      <p className="text-sm text-muted-foreground">Manage existing cards</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/api/health/wallet', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Download className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="font-semibold">Wallet Health API</h3>
                      <p className="text-sm text-muted-foreground">Raw wallet service data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/test-automation', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <TestTube className="h-8 w-8 text-indigo-500" />
                    <div>
                      <h3 className="font-semibold">Test Automation</h3>
                      <p className="text-sm text-muted-foreground">Automated test suite</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
}