'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { shouldEnableAutoRefresh, getPollingInterval } from '@/lib/utils/dev-mode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'
import {
  Activity, 
  Database, 
  Users, 
  CreditCard, 
  Building, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  Pause,
  Square,
  AlertTriangle,
  TrendingUp,
  Clock,
  Monitor,
  TestTube,
  Zap
} from 'lucide-react'

interface SystemMetric {
  id: string
  name: string
  value: number | string
  status: 'healthy' | 'warning' | 'error'
  change?: number
  unit?: string
}

interface TestResult {
  id: string
  name: string
  status: 'running' | 'passed' | 'failed' | 'pending'
  duration?: number
  message?: string
  timestamp: Date
}

function LegacyTestDashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadDashboardData()
    
    // Use development mode utilities for auto-refresh
    const autoRefreshEnabled = shouldEnableAutoRefresh('test-dashboard')
    
    if (autoRefreshEnabled) {
      // Simulate real-time updates with environment-appropriate interval
      const interval = setInterval(() => {
        updateMetrics()
      }, getPollingInterval(30000))

      return () => clearInterval(interval)
    }
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    
    try {
      // Simulate loading dashboard stats with shorter delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockMetrics: SystemMetric[] = [
        {
          id: 'total-businesses',
          name: 'Total Businesses',
          value: 16,
          status: 'healthy',
          change: 2,
          unit: 'businesses'
        },
        {
          id: 'total-customers',
          name: 'Total Customers',
          value: 162,
          status: 'healthy',
          change: 8,
          unit: 'customers'
        },
        {
          id: 'total-cards',
          name: 'Total Cards',
          value: 82,
          status: 'healthy',
          change: 5,
          unit: 'cards'
        },
        {
          id: 'api-response-time',
          name: 'Avg API Response',
          value: '245ms',
          status: 'healthy',
          change: -12,
          unit: 'response time'
        },
        {
          id: 'error-rate',
          name: 'Error Rate',
          value: '0.2%',
          status: 'healthy',
          change: -0.1,
          unit: 'error rate'
        },
        {
          id: 'uptime',
          name: 'System Uptime',
          value: '99.9%',
          status: 'healthy',
          change: 0,
          unit: 'uptime'
        }
      ]

      const mockTestResults: TestResult[] = [
        {
          id: 'auth-test',
          name: 'Authentication Flow Test',
          status: 'passed',
          duration: 1250,
          message: 'All auth flows working correctly',
          timestamp: new Date(Date.now() - 300000)
        },
        {
          id: 'card-creation-test',
          name: 'Card Creation Test',
          status: 'passed',
          duration: 2100,
          message: 'Card creation and wallet provisioning successful',
          timestamp: new Date(Date.now() - 600000)
        },
        {
          id: 'api-health-test',
          name: 'API Health Check',
          status: 'failed',
          duration: 5000,
          message: 'Business stats API returning 500 error',
          timestamp: new Date(Date.now() - 120000)
        },
        {
          id: 'wallet-test',
          name: 'Wallet Integration Test',
          status: 'passed',
          duration: 3200,
          message: 'Apple and Google wallet services responding',
          timestamp: new Date(Date.now() - 900000)
        }
      ]

      setMetrics(mockMetrics)
      setTestResults(mockTestResults)
    } catch (error) {
        console.error("Error:", error)
      } finally {
      setIsLoading(false)
    }
  }

  const updateMetrics = () => {
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: typeof metric.value === 'number' 
        ? metric.value + Math.floor(Math.random() * 3) - 1
        : metric.value,
      change: (metric.change || 0) + (Math.random() - 0.5) * 2
    })))
  }

  const runTest = async (testId: string) => {
    setRunningTests(prev => new Set([...prev, testId]))
    setTestResults(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', timestamp: new Date() }
        : test
    ))

    // Simulate test execution
    try {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      const success = Math.random() > 0.3 // 70% success rate
      const duration = Math.round(1000 + Math.random() * 4000)
      
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' : 'failed',
              duration,
              message: success 
                ? 'Test completed successfully' 
                : 'Test failed - check logs for details',
              timestamp: new Date()
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
      case 'healthy':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'passed':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'total-businesses': return <Building className="h-5 w-5" />
      case 'total-customers': return <Users className="h-5 w-5" />
      case 'total-cards': return <CreditCard className="h-5 w-5" />
      case 'api-response-time': return <Zap className="h-5 w-5" />
      case 'error-rate': return <AlertTriangle className="h-5 w-5" />
      case 'uptime': return <Activity className="h-5 w-5" />
      default: return <Database className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Test Dashboard...</p>
            <p className="text-sm text-muted-foreground">Fetching system metrics and test results</p>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🧪 Test Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive testing interface for admin operations and system monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              {testResults.filter(t => t.status === 'passed').length}/{testResults.length} Tests Passing
            </Badge>
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <Card key={metric.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMetricIcon(metric.id)}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusIcon(metric.status)}
                    {metric.change !== undefined && (
                      <div className={`flex items-center gap-1 text-xs ${
                        metric.change > 0 ? 'text-green-600' : 
                        metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <TrendingUp className={`h-3 w-3 ${metric.change < 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(metric.change).toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
            <TabsTrigger value="tools">Quick Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            {/* Test Results */}
            <div className="space-y-4">
              {testResults.map((test) => (
                <Card key={test.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <h3 className="font-semibold">{test.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {test.duration && (
                              <span>Duration: {test.duration}ms</span>
                            )}
                            <span>Last run: {test.timestamp.toLocaleTimeString()}</span>
                          </div>
                          {test.message && (
                            <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => runTest(test.id)}
                          disabled={runningTests.has(test.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run Test
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Real-time Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>API Response Time</span>
                      <span className="font-mono">245ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Connections</span>
                      <span className="font-mono">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Memory Usage</span>
                      <span className="font-mono">68%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CPU Usage</span>
                      <span className="font-mono">23%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Connection Pool</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Query Performance</span>
                      <Badge className="bg-green-100 text-green-800">Optimal</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Storage Usage</span>
                      <span className="font-mono">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Backup Status</span>
                      <Badge className="bg-green-100 text-green-800">Current</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/api-health', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">API Health Check</h3>
                      <p className="text-sm text-muted-foreground">Test all API endpoints</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/debug-maps', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold">Maps Debug</h3>
                      <p className="text-sm text-muted-foreground">Debug Google Maps integration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/sandbox', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <TestTube className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold">Testing Sandbox</h3>
                      <p className="text-sm text-muted-foreground">Card and wallet testing</p>
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
export default function TestDashboardPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Test Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the dashboard test</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyTestDashboardPage />
      </div>
    </ComponentErrorBoundary>
  )
}