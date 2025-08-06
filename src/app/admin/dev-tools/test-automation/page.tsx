'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TestTube, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  ExternalLink,
  FileText,
  Users,
  CreditCard,
  Building,
  Zap,
  AlertTriangle,
  Monitor,
  Code,
  PlayCircle,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface TestSuite {
  id: string
  name: string
  description: string
  category: 'unit' | 'integration' | 'e2e' | 'manual'
  status: 'idle' | 'running' | 'passed' | 'failed' | 'skipped'
  path?: string
  command?: string
  lastRun?: Date
  duration?: number
  coverage?: number
  tests?: {
    total: number
    passed: number
    failed: number
    skipped: number
  }
}

interface TestPage {
  id: string
  name: string
  description: string
  path: string
  category: 'admin' | 'customer' | 'business' | 'system'
  status: 'active' | 'deprecated' | 'beta'
  features: string[]
}

const testSuites: TestSuite[] = [
  {
    id: 'admin-card-creation',
    name: 'Admin Card Creation',
    description: 'Test admin card creation workflow and validation',
    category: 'unit',
    status: 'idle',
    command: 'npm run test:admin',
    tests: { total: 15, passed: 12, failed: 2, skipped: 1 }
  },
  {
    id: 'admin-dashboard-flow',
    name: 'Admin Dashboard Flow',
    description: 'Test admin dashboard functionality and data flow',
    category: 'integration',
    status: 'idle',
    command: 'npm run test',
    tests: { total: 8, passed: 7, failed: 1, skipped: 0 }
  },
  {
    id: 'admin-data-consistency',
    name: 'Admin Data Consistency',
    description: 'Test data consistency across admin operations',
    category: 'integration',
    status: 'idle',
    command: 'npm run test',
    tests: { total: 12, passed: 10, failed: 2, skipped: 0 }
  },
  {
    id: 'admin-card-management-e2e',
    name: 'Admin Card Management E2E',
    description: 'End-to-end testing of admin card management',
    category: 'e2e',
    status: 'idle',
    command: 'npm run test:admin-e2e',
    tests: { total: 6, passed: 5, failed: 1, skipped: 0 }
  },
  {
    id: 'card-join-flow-e2e',
    name: 'Card Join Flow E2E',
    description: 'End-to-end testing of customer card joining flow',
    category: 'e2e',
    status: 'idle',
    command: 'npm run test:join-e2e',
    tests: { total: 4, passed: 4, failed: 0, skipped: 0 }
  }
]

const testPages: TestPage[] = [
  {
    id: 'test-dashboard',
    name: 'Test Dashboard',
    description: 'Comprehensive testing interface for admin operations',
    path: '/admin/test-dashboard',
    category: 'admin',
    status: 'active',
    features: ['Dashboard metrics', 'User management', 'System health']
  },
  {
    id: 'test-cards',
    name: 'Card Testing',
    description: 'Card functionality and wallet integration testing',
    path: '/admin/test-cards',
    category: 'admin',
    status: 'active',
    features: ['Card creation', 'Wallet provisioning', 'QR generation']
  },
  {
    id: 'test-business-management',
    name: 'Business Management Testing',
    description: 'Business operations and management flow testing',
    path: '/admin/test-business-management',
    category: 'business',
    status: 'active',
    features: ['Business CRUD', 'Logo upload', 'Location settings']
  },
  {
    id: 'test-customer-monitoring',
    name: 'Customer Monitoring Testing',
    description: 'Customer analytics and monitoring system testing',
    path: '/admin/test-customer-monitoring',
    category: 'customer',
    status: 'active',
    features: ['Customer analytics', 'Activity tracking', 'Engagement metrics']
  },
  {
    id: 'test-auth-debug',
    name: 'Auth Debug Testing',
    description: 'Authentication system debugging and testing',
    path: '/admin/test-auth-debug',
    category: 'system',
    status: 'active',
    features: ['Auth flows', 'Session management', 'Permission testing']
  },
  {
    id: 'test-login',
    name: 'Login Testing',
    description: 'Login flow testing and validation',
    path: '/admin/test-login',
    category: 'system',
    status: 'active',
    features: ['Login validation', 'Error handling', 'Redirect flows']
  },
  {
    id: 'debug-client',
    name: 'Client Debug',
    description: 'Client-side debugging and diagnostics',
    path: '/admin/debug-client',
    category: 'system',
    status: 'beta',
    features: ['Client diagnostics', 'Performance monitoring', 'Error tracking']
  },
  {
    id: 'sandbox',
    name: 'Testing Sandbox',
    description: 'Global preview mode for cards, wallets, and system flows',
    path: '/admin/sandbox',
    category: 'system',
    status: 'active',
    features: ['Card preview', 'Wallet testing', 'Flow simulation']
  },
  {
    id: 'demo-card-creation',
    name: 'Card Creation Demo',
    description: 'Interactive demo of card creation workflow',
    path: '/admin/demo/card-creation',
    category: 'admin',
    status: 'active',
    features: ['Interactive demo', 'Workflow visualization', 'Step-by-step guide']
  }
]

export default function TestAutomationPage() {
  const [suites, setSuites] = useState<TestSuite[]>(testSuites)
  const [activeTab, setActiveTab] = useState('suites')
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())

  const runTestSuite = async (suite: TestSuite) => {
    if (!suite.command) return

    setRunningTests(prev => new Set([...prev, suite.id]))
    setSuites(prev => prev.map(s => 
      s.id === suite.id 
        ? { ...s, status: 'running', lastRun: new Date() }
        : s
    ))

    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000))
      
      // Simulate test results
      const success = Math.random() > 0.3 // 70% success rate
      const duration = Math.round(1000 + Math.random() * 4000)
      
      setSuites(prev => prev.map(s => 
        s.id === suite.id 
          ? { 
              ...s, 
              status: success ? 'passed' : 'failed',
              duration,
              lastRun: new Date()
            }
          : s
      ))
    } catch (error) {
      setSuites(prev => prev.map(s => 
        s.id === suite.id 
          ? { ...s, status: 'failed', lastRun: new Date() }
          : s
      ))
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(suite.id)
        return newSet
      })
    }
  }

  const runAllTests = async () => {
    for (const suite of suites) {
      if (suite.command) {
        await runTestSuite(suite)
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'skipped': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Square className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'skipped': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'unit': return <Code className="h-4 w-4" />
      case 'integration': return <Zap className="h-4 w-4" />
      case 'e2e': return <Monitor className="h-4 w-4" />
      case 'manual': return <Users className="h-4 w-4" />
      case 'admin': return <Settings className="h-4 w-4" />
      case 'customer': return <Users className="h-4 w-4" />
      case 'business': return <Building className="h-4 w-4" />
      case 'system': return <Monitor className="h-4 w-4" />
      default: return <TestTube className="h-4 w-4" />
    }
  }

  const testStats = {
    total: suites.length,
    passed: suites.filter(s => s.status === 'passed').length,
    failed: suites.filter(s => s.status === 'failed').length,
    running: runningTests.size,
    coverage: Math.round(Math.random() * 30 + 70) // Simulated coverage
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🧪 Test Automation</h1>
            <p className="text-muted-foreground">
              Automated testing and manual test page management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              {testStats.total} Test Suites
            </Badge>
            <Button 
              onClick={runAllTests} 
              disabled={runningTests.size > 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests
            </Button>
          </div>
        </div>

        {/* Test Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Suites</p>
                  <p className="text-2xl font-bold">{testStats.total}</p>
                </div>
                <TestTube className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{testStats.passed}</p>
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
                  <p className="text-2xl font-bold text-red-600">{testStats.failed}</p>
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
                  <p className="text-2xl font-bold text-blue-600">{testStats.running}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                  <p className="text-2xl font-bold text-purple-600">{testStats.coverage}%</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="suites">Test Suites</TabsTrigger>
            <TabsTrigger value="pages">Test Pages</TabsTrigger>
            <TabsTrigger value="commands">Quick Commands</TabsTrigger>
          </TabsList>

          <TabsContent value="suites" className="space-y-6">
            {/* Test Suites */}
            <div className="space-y-4">
              {suites.map((suite) => (
                <Card key={suite.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(suite.category)}
                        <div>
                          <CardTitle className="text-lg">{suite.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{suite.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(suite.status)}>
                          {suite.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {suite.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          {getStatusIcon(suite.status)}
                          {suite.tests && (
                            <span>
                              {suite.tests.passed}/{suite.tests.total} tests passed
                            </span>
                          )}
                        </span>
                        {suite.duration && (
                          <span className="text-muted-foreground">
                            {suite.duration}ms
                          </span>
                        )}
                        {suite.lastRun && (
                          <span className="text-muted-foreground">
                            Last run: {suite.lastRun.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {suite.command && (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {suite.command}
                          </code>
                        )}
                        <Button
                          size="sm"
                          onClick={() => runTestSuite(suite)}
                          disabled={runningTests.has(suite.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                    
                    {suite.tests && (
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {suite.tests.passed} passed
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {suite.tests.failed} failed
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-yellow-500" />
                          {suite.tests.skipped} skipped
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            {/* Test Pages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testPages.map((page) => (
                <Card key={page.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(page.category)}
                        <CardTitle className="text-lg">{page.name}</CardTitle>
                      </div>
                      <Badge 
                        variant={page.status === 'active' ? 'default' : page.status === 'beta' ? 'secondary' : 'outline'}
                      >
                        {page.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      {page.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {page.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getCategoryIcon(page.category)}
                        <span className="capitalize">{page.category}</span>
                      </div>
                      <Link href={page.path}>
                        <Button size="sm" className="flex items-center gap-1">
                          Open Page
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commands" className="space-y-6">
            {/* Quick Commands */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    NPM Test Commands
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <code className="text-sm">npm run test</code>
                    <Button size="sm" variant="outline">Run</Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <code className="text-sm">npm run test:watch</code>
                    <Button size="sm" variant="outline">Run</Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <code className="text-sm">npm run test:admin</code>
                    <Button size="sm" variant="outline">Run</Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <code className="text-sm">npm run test:e2e</code>
                    <Button size="sm" variant="outline">Run</Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <code className="text-sm">npm run test:all</code>
                    <Button size="sm" variant="outline">Run</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Test Utilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/admin/sandbox">
                    <Button variant="outline" className="w-full justify-start">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Open Testing Sandbox
                    </Button>
                  </Link>
                  <Link href="/debug-maps">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Debug Google Maps
                    </Button>
                  </Link>
                  <Link href="/admin/test-dashboard">
                    <Button variant="outline" className="w-full justify-start">
                      <Monitor className="h-4 w-4 mr-2" />
                      Test Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/dev-tools/api-health">
                    <Button variant="outline" className="w-full justify-start">
                      <TestTube className="h-4 w-4 mr-2" />
                      API Health Tests
                    </Button>
                  </Link>
                  <Link href="/admin/dev-tools/system-monitor">
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      System Monitor
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
}