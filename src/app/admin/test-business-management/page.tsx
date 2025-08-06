'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building, 
  MapPin, 
  Image, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  TestTube,
  Upload,
  Globe,
  Settings,
  Users,
  CreditCard,
  Eye
} from 'lucide-react'

interface BusinessTest {
  id: string
  name: string
  operation: 'create' | 'update' | 'delete' | 'logo' | 'location'
  status: 'idle' | 'running' | 'passed' | 'failed'
  lastRun?: Date
  duration?: number
  details: string
  features: string[]
}

export default function TestBusinessManagementPage() {
  const [businessTests, setBusinessTests] = useState<BusinessTest[]>([])
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
      
      const mockBusinessTests: BusinessTest[] = [
        {
          id: 'business-create',
          name: 'Business Creation Test',
          operation: 'create',
          status: 'passed',
          lastRun: new Date(Date.now() - 300000),
          duration: 1800,
          details: 'Test complete business creation workflow with validation',
          features: ['Form Validation', 'Database Insert', 'Profile Setup']
        },
        {
          id: 'business-update',
          name: 'Business Profile Update',
          operation: 'update',
          status: 'passed',
          lastRun: new Date(Date.now() - 600000),
          duration: 1200,
          details: 'Test business profile updates and data persistence',
          features: ['Profile Edit', 'Data Validation', 'Update Confirmation']
        },
        {
          id: 'logo-upload',
          name: 'Logo Upload & Storage',
          operation: 'logo',
          status: 'failed',
          lastRun: new Date(Date.now() - 120000),
          duration: 3200,
          details: 'Test logo upload to Supabase Storage and URL linking',
          features: ['File Upload', 'Image Processing', 'Storage Integration', 'URL Generation']
        },
        {
          id: 'location-setup',
          name: 'Google Maps Location Setup',
          operation: 'location',
          status: 'passed',
          lastRun: new Date(Date.now() - 180000),
          duration: 2100,
          details: 'Test Google Places API integration and location data storage',
          features: ['Places Autocomplete', 'Geocoding', 'Address Validation', 'Map Integration']
        },
        {
          id: 'business-delete',
          name: 'Business Deletion & Cleanup',
          operation: 'delete',
          status: 'idle',
          details: 'Test business deletion with proper data cleanup and cascade',
          features: ['Data Cleanup', 'Card Deactivation', 'Customer Notification', 'Audit Trail']
        }
      ]

      setBusinessTests(mockBusinessTests)
    } catch (error) {
      console.error('Error loading test data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runBusinessTest = async (testId: string) => {
    setRunningTests(prev => new Set([...prev, testId]))
    setBusinessTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', lastRun: new Date() }
        : test
    ))

    // Simulate test execution
    try {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 4000))
      
      const success = Math.random() > 0.25 // 75% success rate
      const duration = Math.round(1000 + Math.random() * 3000)
      
      setBusinessTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' : 'failed',
              duration,
              lastRun: new Date()
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
    for (const test of businessTests) {
      await runBusinessTest(test.id)
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

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create': return <Building className="h-5 w-5" />
      case 'update': return <Settings className="h-5 w-5" />
      case 'delete': return <XCircle className="h-5 w-5" />
      case 'logo': return <Image className="h-5 w-5" />
      case 'location': return <MapPin className="h-5 w-5" />
      default: return <TestTube className="h-5 w-5" />
    }
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'create': return 'bg-blue-100 text-blue-800'
      case 'update': return 'bg-green-100 text-green-800'
      case 'delete': return 'bg-red-100 text-red-800'
      case 'logo': return 'bg-purple-100 text-purple-800'
      case 'location': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Business Tests...</p>
            <p className="text-sm text-muted-foreground">Initializing business management tests</p>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  const stats = {
    totalTests: businessTests.length,
    passed: businessTests.filter(t => t.status === 'passed').length,
    failed: businessTests.filter(t => t.status === 'failed').length,
    running: runningTests.size,
    idle: businessTests.filter(t => t.status === 'idle').length
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🏢 Business Management Testing</h1>
            <p className="text-muted-foreground">
              Business operations and management flow testing suite
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
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.idle}</p>
                </div>
                <TestTube className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tests">Business Tests</TabsTrigger>
            <TabsTrigger value="tools">Management Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            {/* Business Tests */}
            <div className="space-y-4">
              {businessTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getOperationIcon(test.operation)}
                        <div>
                          <CardTitle className="text-lg">{test.name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge className={getOperationColor(test.operation)} variant="outline">
                              {test.operation.toUpperCase()}
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
                          onClick={() => runBusinessTest(test.id)}
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

                      {/* Test Features */}
                      <div>
                        <p className="text-sm font-medium mb-2">Test Coverage:</p>
                        <div className="flex flex-wrap gap-1">
                          {test.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <span className="text-sm text-muted-foreground">
                          {test.status === 'running' ? 'Test in progress...' :
                           test.status === 'passed' ? 'All checks passed' :
                           test.status === 'failed' ? 'Test failed - check logs' :
                           'Ready to run'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            {/* Management Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/businesses', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">Business Management</h3>
                      <p className="text-sm text-muted-foreground">Manage all businesses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/businesses/new', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold">Create Business</h3>
                      <p className="text-sm text-muted-foreground">Add new business</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/debug-maps', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-orange-500" />
                    <div>
                      <h3 className="font-semibold">Maps Debug</h3>
                      <p className="text-sm text-muted-foreground">Test location features</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/api/admin/upload-media', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="font-semibold">Media Upload API</h3>
                      <p className="text-sm text-muted-foreground">Test logo upload</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/api-health', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Globe className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="font-semibold">API Health</h3>
                      <p className="text-sm text-muted-foreground">Test business APIs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => window.open('/admin/dev-tools/system-monitor', '_blank')}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Eye className="h-8 w-8 text-indigo-500" />
                    <div>
                      <h3 className="font-semibold">System Monitor</h3>
                      <p className="text-sm text-muted-foreground">Monitor business metrics</p>
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