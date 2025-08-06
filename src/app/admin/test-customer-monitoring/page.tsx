'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Activity, 
  BarChart, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  TestTube,
  TrendingUp,
  Clock,
  Eye,
  Target,
  Zap
} from 'lucide-react'

interface CustomerTest {
  id: string
  name: string
  category: 'analytics' | 'engagement' | 'behavior' | 'retention'
  status: 'idle' | 'running' | 'passed' | 'failed'
  lastRun?: Date
  duration?: number
  details: string
  metrics: {
    name: string
    value: string | number
    status: 'good' | 'warning' | 'critical'
  }[]
}

export default function TestCustomerMonitoringPage() {
  const [customerTests, setCustomerTests] = useState<CustomerTest[]>([])
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
      
      const mockCustomerTests: CustomerTest[] = [
        {
          id: 'customer-analytics',
          name: 'Customer Analytics Dashboard',
          category: 'analytics',
          status: 'passed',
          lastRun: new Date(Date.now() - 300000),
          duration: 2100,
          details: 'Test customer analytics data aggregation and dashboard display',
          metrics: [
            { name: 'Total Customers', value: 162, status: 'good' },
            { name: 'Active This Month', value: 89, status: 'good' },
            { name: 'Avg Session Duration', value: '4.2min', status: 'good' },
            { name: 'Conversion Rate', value: '12.5%', status: 'warning' }
          ]
        },
        {
          id: 'engagement-tracking',
          name: 'Customer Engagement Tracking',
          category: 'engagement',
          status: 'passed',
          lastRun: new Date(Date.now() - 600000),
          duration: 1800,
          details: 'Test customer engagement metrics and activity tracking',
          metrics: [
            { name: 'Daily Active Users', value: 45, status: 'good' },
            { name: 'Card Interactions', value: 234, status: 'good' },
            { name: 'Stamp Redemptions', value: 67, status: 'good' },
            { name: 'App Opens', value: 156, status: 'warning' }
          ]
        },
        {
          id: 'behavior-analysis',
          name: 'Customer Behavior Analysis',
          category: 'behavior',
          status: 'failed',
          lastRun: new Date(Date.now() - 120000),
          duration: 3200,
          details: 'Test customer behavior pattern analysis and insights',
          metrics: [
            { name: 'Purchase Patterns', value: 'Analyzed', status: 'critical' },
            { name: 'Visit Frequency', value: '2.3x/week', status: 'good' },
            { name: 'Peak Hours', value: '6-8 PM', status: 'good' },
            { name: 'Churn Risk', value: '8.2%', status: 'warning' }
          ]
        },
        {
          id: 'retention-metrics',
          name: 'Customer Retention Metrics',
          category: 'retention',
          status: 'passed',
          lastRun: new Date(Date.now() - 180000),
          duration: 2400,
          details: 'Test customer retention analysis and lifecycle tracking',
          metrics: [
            { name: '30-Day Retention', value: '78%', status: 'good' },
            { name: '90-Day Retention', value: '45%', status: 'warning' },
            { name: 'Lifetime Value', value: '$125', status: 'good' },
            { name: 'Churn Rate', value: '5.2%', status: 'good' }
          ]
        },
        {
          id: 'real-time-monitoring',
          name: 'Real-time Activity Monitoring',
          category: 'analytics',
          status: 'idle',
          details: 'Test real-time customer activity monitoring and alerts',
          metrics: [
            { name: 'Live Sessions', value: 12, status: 'good' },
            { name: 'Real-time Events', value: 45, status: 'good' },
            { name: 'Alert Triggers', value: 3, status: 'warning' },
            { name: 'Response Time', value: '120ms', status: 'good' }
          ]
        }
      ]

      setCustomerTests(mockCustomerTests)
    } catch (error) {
      console.error('Error loading test data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runCustomerTest = async (testId: string) => {
    setRunningTests(prev => new Set([...prev, testId]))
    setCustomerTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', lastRun: new Date() }
        : test
    ))

    // Simulate test execution
    try {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 4000))
      
      const success = Math.random() > 0.2 // 80% success rate
      const duration = Math.round(1500 + Math.random() * 3000)
      
      // Update metrics with random values
      const updatedMetrics = customerTests.find(t => t.id === testId)?.metrics.map(metric => ({
        ...metric,
        value: typeof metric.value === 'number' 
          ? Math.round(metric.value * (0.8 + Math.random() * 0.4))
          : metric.value,
        status: success ? 
          (Math.random() > 0.7 ? 'warning' : 'good') as const :
          'critical' as const
      })) || []
      
      setCustomerTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' : 'failed',
              duration,
              lastRun: new Date(),
              metrics: updatedMetrics
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

  const runAllTests = async () => {
    for (const test of customerTests) {
      await runCustomerTest(test.id)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics': return <BarChart className="h-5 w-5" />
      case 'engagement': return <Activity className="h-5 w-5" />
      case 'behavior': return <Eye className="h-5 w-5" />
      case 'retention': return <Target className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics': return 'bg-blue-100 text-blue-800'
      case 'engagement': return 'bg-green-100 text-green-800'
      case 'behavior': return 'bg-purple-100 text-purple-800'
      case 'retention': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Customer Monitoring Tests...</p>
            <p className="text-sm text-muted-foreground">Initializing analytics and monitoring tests</p>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  const stats = {
    totalTests: customerTests.length,
    passed: customerTests.filter(t => t.status === 'passed').length,
    failed: customerTests.filter(t => t.status === 'failed').length,
    running: runningTests.size,
    totalMetrics: customerTests.reduce((acc, test) => acc + test.metrics.length, 0),
    healthyMetrics: customerTests.reduce((acc, test) => 
      acc + test.metrics.filter(m => m.status === 'good').length, 0)
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">👥 Customer Monitoring Testing</h1>
            <p className="text-muted-foreground">
              Customer analytics and monitoring system testing suite
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              {stats.passed}/{stats.totalTests} Tests Passing
            </Badge>
            <Button onClick={runAllTests} disabled={runningTests.size > 0} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Run All Tests
            </Button>
            <Button onClick={loadTestData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                  <p className="text-sm font-medium text-muted-foreground">Metrics</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalMetrics}</p>
                </div>
                <BarChart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.healthyMetrics}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tests">Monitoring Tests</TabsTrigger>
            <TabsTrigger value="tools">Analytics Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            {/* Customer Tests */}
            <div className="space-y-4">
              {customerTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(test.category)}
                        <div>
                          <CardTitle className="text-lg">{test.name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge className={getCategoryColor(test.category)} variant="outline">
                              {test.category.toUpperCase()}
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
                          onClick={() => runCustomerTest(test.id)}
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
                      {/* Test Details */}
                      <div>
                        <p className="text-sm text-muted-foreground">{test.details}</p>
                      </div>

                      {/* Metrics Grid */}
                      <div>
                        <p className="text-sm font-medium mb-3">Current Metrics:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {test.metrics.map((metric, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">{metric.name}</span>
                                <Badge className={getMetricStatusColor(metric.status)} variant="outline">
                                  {metric.status}
                                </Badge>
                              </div>
                              <div className="text-lg font-semibold">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <span className="text-sm text-muted-foreground">
                          {test.status === 'running' ? 'Collecting analytics data...' :
                           test.status === 'passed' ? 'All metrics within normal ranges' :
                           test.status === 'failed' ? 'Some metrics require attention' :
                           'Ready to analyze customer data'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            {/* Analytics Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/customers', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">Customer Management</h3>
                      <p className="text-sm text-muted-foreground">View all customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/system-monitor', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Activity className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold">System Monitor</h3>
                      <p className="text-sm text-muted-foreground">Real-time monitoring</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/api-health', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <BarChart className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold">API Analytics</h3>
                      <p className="text-sm text-muted-foreground">Test analytics APIs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/api/admin/customers', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Zap className="h-8 w-8 text-orange-500" />
                    <div>
                      <h3 className="font-semibold">Customer API</h3>
                      <p className="text-sm text-muted-foreground">Raw customer data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/alerts', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="font-semibold">System Alerts</h3>
                      <p className="text-sm text-muted-foreground">Monitor alerts</p>
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