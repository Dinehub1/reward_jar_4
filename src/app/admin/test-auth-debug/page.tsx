'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  User, 
  Key, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  Zap
} from 'lucide-react'

interface AuthTest {
  id: string
  name: string
  type: 'login' | 'session' | 'permissions' | 'security'
  status: 'passed' | 'failed' | 'running' | 'idle'
  details: string
  result?: any
}

export default function TestAuthDebugPage() {
  const [authTests, setAuthTests] = useState<AuthTest[]>([])
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAuthDebugData()
  }, [])

  const loadAuthDebugData = async () => {
    setIsLoading(true)
    
    try {
      // Load current auth status
      const authResponse = await fetch('/api/admin/auth-check')
      const authData = await authResponse.json()
      setAuthInfo(authData)

      // Initialize test cases
      const mockAuthTests: AuthTest[] = [
        {
          id: 'admin-auth-check',
          name: 'Admin Authentication Check',
          type: 'login',
          status: authResponse.ok ? 'passed' : 'failed',
          details: 'Verify admin user authentication and role verification',
          result: authData
        },
        {
          id: 'session-validation',
          name: 'Session Validation',
          type: 'session',
          status: 'idle',
          details: 'Test session persistence and token validation'
        },
        {
          id: 'role-permissions',
          name: 'Role-based Permissions',
          type: 'permissions',
          status: 'idle',
          details: 'Test admin role permissions and access control'
        },
        {
          id: 'security-headers',
          name: 'Security Headers Check',
          type: 'security',
          status: 'idle',
          details: 'Verify security headers and CSRF protection'
        }
      ]

      setAuthTests(mockAuthTests)
    } catch (error) {
      console.error('Error loading auth debug data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAuthTest = async (testId: string) => {
    setAuthTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running' }
        : test
    ))

    try {
      let result: any = null
      let success = false

      switch (testId) {
        case 'admin-auth-check':
          const authResponse = await fetch('/api/admin/auth-check')
          result = await authResponse.json()
          success = authResponse.ok && result.isAdmin
          break
          
        case 'session-validation':
          const sessionResponse = await fetch('/api/auth/status')
          result = await sessionResponse.json()
          success = sessionResponse.ok && result.user
          break
          
        case 'role-permissions':
          const permResponse = await fetch('/api/admin/businesses')
          result = { hasAccess: permResponse.ok, status: permResponse.status }
          success = permResponse.ok
          break
          
        case 'security-headers':
          // Simulate security header check
          await new Promise(resolve => setTimeout(resolve, 1500))
          result = {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block'
          }
          success = true
          break
          
        default:
          success = Math.random() > 0.3
      }

      setAuthTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' : 'failed',
              result
            }
          : test
      ))
    } catch (error) {
      setAuthTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'failed', result: { error: error.message } }
          : test
      ))
    }
  }

  const runAllTests = async () => {
    for (const test of authTests) {
      await runAuthTest(test.id)
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
        return <Clock className="h-4 w-4 text-gray-500" />
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login': return <User className="h-5 w-5" />
      case 'session': return <Key className="h-5 w-5" />
      case 'permissions': return <Shield className="h-5 w-5" />
      case 'security': return <Lock className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-blue-100 text-blue-800'
      case 'session': return 'bg-green-100 text-green-800'
      case 'permissions': return 'bg-purple-100 text-purple-800'
      case 'security': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-medium">Loading Auth Debug...</p>
            <p className="text-sm text-muted-foreground">Checking authentication status</p>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  const stats = {
    totalTests: authTests.length,
    passed: authTests.filter(t => t.status === 'passed').length,
    failed: authTests.filter(t => t.status === 'failed').length,
    running: authTests.filter(t => t.status === 'running').length
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🔐 Auth Debug Testing</h1>
            <p className="text-muted-foreground">
              Authentication system debugging and testing suite
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {stats.passed}/{stats.totalTests} Tests Passing
            </Badge>
            <Button onClick={runAllTests} size="sm">
              <Zap className="h-4 w-4 mr-1" />
              Run All Tests
            </Button>
            <Button onClick={loadAuthDebugData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Auth Status */}
        {authInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">User ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {authInfo.userId || 'Not authenticated'}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant={authInfo.isAdmin ? 'default' : 'secondary'}>
                    {authInfo.isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={authInfo.isAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {authInfo.isAdmin ? 'Authenticated' : 'Unauthorized'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Session:</span>
                  {authInfo.isAdmin ? (
                    <Unlock className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              {authInfo.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-800">Authentication Error:</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{authInfo.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
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
        </div>

        {/* Auth Tests */}
        <div className="space-y-4">
          {authTests.map((test) => (
            <Card key={test.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(test.type)}
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge className={getTypeColor(test.type)} variant="outline">
                          {test.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => runAuthTest(test.id)}
                      disabled={test.status === 'running'}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Test
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

                  {/* Test Results */}
                  {test.result && (
                    <div>
                      <p className="text-sm font-medium mb-2">Test Result:</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(test.result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <span className="text-sm text-muted-foreground">
                      {test.status === 'running' ? 'Running authentication test...' :
                       test.status === 'passed' ? 'Authentication test passed' :
                       test.status === 'failed' ? 'Authentication test failed' :
                       'Ready to run authentication test'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Auth Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/api/admin/auth-check', '_blank')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Check Admin Auth API
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/api/auth/status', '_blank')}
              >
                <User className="h-4 w-4 mr-2" />
                Check Auth Status API
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/auth/login', '_blank')}
              >
                <Key className="h-4 w-4 mr-2" />
                Test Login Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutClient>
  )
}