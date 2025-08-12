'use client'

import { useState } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'
import {
  LogIn, 
  User, 
  Key, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react'

interface LoginTest {
  id: string
  name: string
  type: 'valid' | 'invalid' | 'edge-case'
  credentials: {
    email: string
    password: string
  }
  status: 'idle' | 'running' | 'passed' | 'failed'
  result?: any
  description: string
}

function LegacyTestLoginPage() {
  const [loginTests] = useState<LoginTest[]>([
    {
      id: 'valid-admin',
      name: 'Valid Admin Login',
      type: 'valid',
      credentials: {
        email: 'admin@rewardjar.com',
        password: '••••••••'
      },
      status: 'idle',
      description: 'Test login with valid admin credentials'
    },
    {
      id: 'invalid-password',
      name: 'Invalid Password',
      type: 'invalid',
      credentials: {
        email: 'admin@rewardjar.com',
        password: 'wrongpassword'
      },
      status: 'idle',
      description: 'Test login with invalid password'
    },
    {
      id: 'invalid-email',
      name: 'Invalid Email',
      type: 'invalid',
      credentials: {
        email: 'nonexistent@example.com',
        password: 'password123'
      },
      status: 'idle',
      description: 'Test login with non-existent email'
    },
    {
      id: 'empty-fields',
      name: 'Empty Fields',
      type: 'edge-case',
      credentials: {
        email: '',
        password: ''
      },
      status: 'idle',
      description: 'Test login with empty email and password fields'
    },
    {
      id: 'sql-injection',
      name: 'SQL Injection Attempt',
      type: 'edge-case',
      credentials: {
        email: "admin'; DROP TABLE users; --",
        password: 'password'
      },
      status: 'idle',
      description: 'Test security against SQL injection attempts'
    }
  ])

  const [customTest, setCustomTest] = useState({
    email: '',
    password: '',
    status: 'idle' as 'idle' | 'running' | 'passed' | 'failed',
    result: null as any
  })

  const [showPassword, setShowPassword] = useState(false)
  const [testResults, setTestResults] = useState<{ [key: string]: any }>({})
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())

  const runLoginTest = async (test: LoginTest) => {
    setRunningTests(prev => new Set([...prev, test.id]))
    setTestResults(prev => ({ ...prev, [test.id]: { status: 'running' } }))

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: test.credentials.email,
          password: test.credentials.password === '••••••••' ? 'admin123' : test.credentials.password
        }),
      })

      const result = await response.json()
      
      // Determine if test passed based on expected outcome
      let passed = false
      if (test.type === 'valid') {
        passed = response.ok && result.success
      } else if (test.type === 'invalid') {
        passed = !response.ok || !result.success
      } else { // edge-case
        passed = !response.ok || !result.success // Should fail for security
      }

      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: passed ? 'passed' : 'failed',
          response: {
            status: response.status,
            ok: response.ok,
            data: result
          }
        }
      }))
    } catch (error: unknown) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev)
        newSet.delete(test.id)
        return newSet
      })
    }
  }

  const runCustomTest = async () => {
    if (!customTest.email || !customTest.password) {
      alert('Please enter both email and password')
      return
    }

    setCustomTest(prev => ({ ...prev, status: 'running', result: null }))

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customTest.email,
          password: customTest.password
        }),
      })

      const result = await response.json()
      
      setCustomTest(prev => ({
        ...prev,
        status: response.ok && result.success ? 'passed' : 'failed',
        result: {
          status: response.status,
          ok: response.ok,
          data: result
        }
      }))
    } catch (error: unknown) {
      setCustomTest(prev => ({
        ...prev,
        status: 'failed',
        result: { error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  const runAllTests = async () => {
    for (const test of loginTests) {
      await runLoginTest(test)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
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
        return <Shield className="h-4 w-4 text-gray-500" />
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'valid':
        return 'bg-green-100 text-green-800'
      case 'invalid':
        return 'bg-red-100 text-red-800'
      case 'edge-case':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalTests: loginTests.length,
    passed: Object.values(testResults).filter(r => r.status === 'passed').length,
    failed: Object.values(testResults).filter(r => r.status === 'failed').length,
    running: runningTests.size
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🔑 Login Testing</h1>
            <p className="text-muted-foreground">
              Login flow testing and validation suite
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <LogIn className="h-3 w-3" />
              {stats.passed}/{stats.totalTests} Tests Passing
            </Badge>
            <Button onClick={runAllTests} disabled={runningTests.size > 0} size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Run All Tests
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                </div>
                <LogIn className="h-8 w-8 text-muted-foreground" />
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

        {/* Custom Login Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Custom Login Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="custom-email">Email</Label>
                <Input
                  id="custom-email"
                  type="email"
                  placeholder="Enter email address"
                  value={customTest.email}
                  onChange={(e) => setCustomTest(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="custom-password">Password</Label>
                <div className="relative">
                  <Input
                    id="custom-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={customTest.password}
                    onChange={(e) => setCustomTest(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                onClick={runCustomTest} 
                disabled={customTest.status === 'running'}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Test Login
              </Button>
              
              {customTest.status !== 'idle' && (
                <div className="flex items-center gap-2">
                  {getStatusIcon(customTest.status)}
                  <Badge className={getStatusColor(customTest.status)}>
                    {customTest.status}
                  </Badge>
                </div>
              )}
            </div>

            {customTest.result && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Test Result:</p>
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(customTest.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Predefined Login Tests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Predefined Test Cases</h2>
          {loginTests.map((test) => {
            const result = testResults[test.id]
            const isRunning = runningTests.has(test.id)
            
            return (
              <Card key={test.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge className={getTypeColor(test.type)} variant="outline">
                            {test.type.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result && (
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => runLoginTest(test)}
                        disabled={isRunning}
                      >
                        <LogIn className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Test Details */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Email:</span>
                          <code className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                            {test.credentials.email}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Password:</span>
                          <code className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                            {test.credentials.password}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Test Results */}
                    {result && (
                      <div>
                        <p className="text-sm font-medium mb-2">Test Result:</p>
                        <div className="bg-muted p-3 rounded-lg">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(isRunning ? 'running' : result?.status || 'idle')}
                      <span className="text-sm text-muted-foreground">
                        {isRunning ? 'Testing login credentials...' :
                         result?.status === 'passed' ? 'Login test completed successfully' :
                         result?.status === 'failed' ? 'Login test failed as expected' :
                         'Ready to test login flow'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/auth/login', '_blank')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Open Login Page
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/api/auth/login', '_blank')}
              >
                <Key className="h-4 w-4 mr-2" />
                Login API Endpoint
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open('/admin/test-auth-debug', '_blank')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Auth Debug Testing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Security Testing Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  These tests are designed to verify login security and proper error handling. 
                  Invalid login attempts should fail, and edge cases should be handled securely.
                  Never use real production credentials in testing environments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutClient>
  )
}
export default function TestLoginPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Test Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the login test</p>
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
        <LegacyTestLoginPage />
      </div>
    </ComponentErrorBoundary>
  )
}