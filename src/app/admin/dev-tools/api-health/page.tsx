'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Database, 
  Zap, 
  Settings, 
  CreditCard, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Code
} from 'lucide-react'

interface ApiEndpoint {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  category: 'health' | 'admin' | 'wallet' | 'test' | 'auth'
  description: string
  status?: 'loading' | 'success' | 'error' | 'timeout'
  responseTime?: number
  lastChecked?: Date
  response?: any
  error?: string
}

const apiEndpoints: ApiEndpoint[] = [
  // Health Endpoints
  {
    id: 'health-main',
    name: 'Main Health Check',
    url: '/api/health',
    method: 'GET',
    category: 'health',
    description: 'Overall system health and status'
  },
  {
    id: 'health-env',
    name: 'Environment Check',
    url: '/api/health/env',
    method: 'GET',
    category: 'health',
    description: 'Environment variables validation'
  },
  {
    id: 'health-wallet',
    name: 'Wallet Health',
    url: '/api/health/wallet',
    method: 'GET',
    category: 'health',
    description: 'Wallet services health check'
  },

  // Admin Endpoints
  {
    id: 'admin-auth-check',
    name: 'Admin Auth Check',
    url: '/api/admin/auth-check',
    method: 'GET',
    category: 'admin',
    description: 'Admin authentication status'
  },
  {
    id: 'admin-dashboard-stats',
    name: 'Dashboard Stats',
    url: '/api/admin/dashboard-stats',
    method: 'GET',
    category: 'admin',
    description: 'Admin dashboard statistics'
  },
  {
    id: 'admin-businesses',
    name: 'Businesses API',
    url: '/api/admin/businesses',
    method: 'GET',
    category: 'admin',
    description: 'Business management endpoints'
  },
  {
    id: 'admin-customers',
    name: 'Customers API',
    url: '/api/admin/customers',
    method: 'GET',
    category: 'admin',
    description: 'Customer management endpoints'
  },
  {
    id: 'admin-cards',
    name: 'Cards API',
    url: '/api/admin/cards',
    method: 'GET',
    category: 'admin',
    description: 'Card management endpoints'
  },

  // Wallet Endpoints
  {
    id: 'wallet-provision',
    name: 'Wallet Provisioning',
    url: '/api/admin/wallet-provision',
    method: 'GET',
    category: 'wallet',
    description: 'Wallet provisioning service'
  },
  {
    id: 'wallet-updates',
    name: 'Wallet Updates',
    url: '/api/wallet/process-updates',
    method: 'GET',
    category: 'wallet',
    description: 'Wallet update processing'
  },

  // Test Endpoints
  {
    id: 'test-centralized',
    name: 'Centralized Architecture',
    url: '/api/test/centralized-architecture',
    method: 'GET',
    category: 'test',
    description: 'Test centralized data architecture'
  },
  {
    id: 'test-simple',
    name: 'Simple Test',
    url: '/api/test/simple',
    method: 'GET',
    category: 'test',
    description: 'Basic API functionality test'
  },

  // Auth Endpoints
  {
    id: 'auth-status',
    name: 'Auth Status',
    url: '/api/auth/status',
    method: 'GET',
    category: 'auth',
    description: 'Authentication system status'
  }
]

export default function ApiHealthPage() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(apiEndpoints)
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Auto-run health checks on page load
  useEffect(() => {
    handleCheckAll()
  }, [])

  const checkEndpoint = async (endpoint: ApiEndpoint): Promise<ApiEndpoint> => {
    const startTime = Date.now()
    
    try {
      setEndpoints(prev => prev.map(ep => 
        ep.id === endpoint.id 
          ? { ...ep, status: 'loading', lastChecked: new Date() }
          : ep
      ))

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      // Clone the response before consuming it
      const responseClone = response.clone()
      
      let responseData
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }
      } catch (parseError) {
        // If parsing fails, use the cloned response to try text
        try {
          responseData = await responseClone.text()
        } catch {
          responseData = 'Unable to parse response'
        }
      }

      const updatedEndpoint: ApiEndpoint = {
        ...endpoint,
        status: response.ok ? 'success' : 'error',
        responseTime,
        lastChecked: new Date(),
        response: responseData,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }

      return updatedEndpoint

    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      let status: 'error' | 'timeout' = 'error'
      let errorMessage = error.message

      if (error.name === 'AbortError') {
        status = 'timeout'
        errorMessage = 'Request timeout (10s)'
      }

      return {
        ...endpoint,
        status,
        responseTime,
        lastChecked: new Date(),
        error: errorMessage
      }
    }
  }

  const handleCheckEndpoint = async (endpoint: ApiEndpoint) => {
    const updatedEndpoint = await checkEndpoint(endpoint)
    setEndpoints(prev => prev.map(ep => 
      ep.id === endpoint.id ? updatedEndpoint : ep
    ))
  }

  const handleCheckAll = async () => {
    setIsRunningAll(true)
    
    try {
      const promises = endpoints.map(checkEndpoint)
      const results = await Promise.all(promises)
      setEndpoints(results)
    } catch (error) {
      console.error('Error running all checks:', error)
    } finally {
      setIsRunningAll(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'timeout': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'loading': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case 'error': return <Badge variant="destructive">Error</Badge>
      case 'timeout': return <Badge className="bg-yellow-100 text-yellow-800">Timeout</Badge>
      case 'loading': return <Badge variant="outline">Checking...</Badge>
      default: return <Badge variant="secondary">Not Checked</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return <Activity className="h-4 w-4" />
      case 'admin': return <Settings className="h-4 w-4" />
      case 'wallet': return <CreditCard className="h-4 w-4" />
      case 'test': return <Code className="h-4 w-4" />
      case 'auth': return <Zap className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const categories = [
    { id: 'all', label: 'All Endpoints', count: endpoints.length },
    { id: 'health', label: 'Health', count: endpoints.filter(e => e.category === 'health').length },
    { id: 'admin', label: 'Admin', count: endpoints.filter(e => e.category === 'admin').length },
    { id: 'wallet', label: 'Wallet', count: endpoints.filter(e => e.category === 'wallet').length },
    { id: 'test', label: 'Test', count: endpoints.filter(e => e.category === 'test').length },
    { id: 'auth', label: 'Auth', count: endpoints.filter(e => e.category === 'auth').length }
  ]

  const filteredEndpoints = activeCategory === 'all' 
    ? endpoints 
    : endpoints.filter(e => e.category === activeCategory)

  const stats = {
    total: endpoints.length,
    healthy: endpoints.filter(e => e.status === 'success').length,
    errors: endpoints.filter(e => e.status === 'error').length,
    timeouts: endpoints.filter(e => e.status === 'timeout').length,
    unchecked: endpoints.filter(e => !e.status || e.status === 'loading').length
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🔍 API Health Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and test all API endpoints and services
            </p>
          </div>
          <Button 
            onClick={handleCheckAll} 
            disabled={isRunningAll}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunningAll ? 'animate-spin' : ''}`} />
            {isRunningAll ? 'Checking All...' : 'Check All Endpoints'}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timeouts</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.timeouts}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unchecked</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.unchecked}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
              className="flex items-center gap-1"
            >
              {category.id !== 'all' && getCategoryIcon(category.id)}
              {category.label}
              <Badge variant="secondary" className="ml-1 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Endpoints List */}
        <div className="space-y-4">
          {filteredEndpoints.map((endpoint) => (
            <Card key={endpoint.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(endpoint.category)}
                    <div>
                      <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(endpoint.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCheckEndpoint(endpoint)}
                      disabled={endpoint.status === 'loading'}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${endpoint.status === 'loading' ? 'animate-spin' : ''}`} />
                      Test
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(endpoint.status)}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {endpoint.method} {endpoint.url}
                      </code>
                    </span>
                    {endpoint.responseTime && (
                      <span className="text-muted-foreground">
                        {endpoint.responseTime}ms
                      </span>
                    )}
                    {endpoint.lastChecked && (
                      <span className="text-muted-foreground">
                        Last checked: {endpoint.lastChecked.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <a 
                    href={endpoint.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </a>
                </div>
                
                {endpoint.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    <strong>Error:</strong> {endpoint.error}
                  </div>
                )}
                
                {endpoint.response && endpoint.status === 'success' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View Response
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayoutClient>
  )
}