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
  Server, 
  Cpu, 
  HardDrive,
  Wifi,
  Users,
  CreditCard,
  Building,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import Link from 'next/link'

interface SystemMetric {
  id: string
  name: string
  value: string | number
  status: 'healthy' | 'warning' | 'error' | 'loading'
  trend?: 'up' | 'down' | 'stable'
  lastUpdated?: Date
  description?: string
}

interface ServiceStatus {
  id: string
  name: string
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  uptime?: string
  responseTime?: number
  lastCheck?: Date
  endpoint?: string
}

export default function SystemMonitorPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Initialize metrics
  useEffect(() => {
    const initialMetrics: SystemMetric[] = [
      {
        id: 'total-businesses',
        name: 'Total Businesses',
        value: 0,
        status: 'loading',
        description: 'Total registered businesses'
      },
      {
        id: 'total-customers',
        name: 'Total Customers',
        value: 0,
        status: 'loading',
        description: 'Total registered customers'
      },
      {
        id: 'total-cards',
        name: 'Total Cards',
        value: 0,
        status: 'loading',
        description: 'Total cards created'
      },
      {
        id: 'active-sessions',
        name: 'Active Sessions',
        value: 0,
        status: 'loading',
        description: 'Currently active user sessions'
      },
      {
        id: 'wallet-provisions',
        name: 'Wallet Provisions',
        value: 0,
        status: 'loading',
        description: 'Successful wallet provisions today'
      },
      {
        id: 'api-requests',
        name: 'API Requests/hr',
        value: 0,
        status: 'loading',
        description: 'API requests in the last hour'
      }
    ]

    const initialServices: ServiceStatus[] = [
      {
        id: 'supabase',
        name: 'Supabase Database',
        status: 'online',
        endpoint: '/api/health'
      },
      {
        id: 'google-maps',
        name: 'Google Maps API',
        status: 'online',
        endpoint: '/debug-maps'
      },
      {
        id: 'wallet-apple',
        name: 'Apple Wallet Service',
        status: 'online',
        endpoint: '/api/health/wallet'
      },
      {
        id: 'wallet-google',
        name: 'Google Wallet Service',
        status: 'online',
        endpoint: '/api/health/wallet'
      },
      {
        id: 'auth-service',
        name: 'Authentication Service',
        status: 'online',
        endpoint: '/api/auth/status'
      },
      {
        id: 'admin-api',
        name: 'Admin API',
        status: 'online',
        endpoint: '/api/admin/auth-check'
      }
    ]

    setMetrics(initialMetrics)
    setServices(initialServices)
    
    // Load real data
    loadSystemData()
  }, [])

  const loadSystemData = async () => {
    setIsLoading(true)
    
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard-stats')
      if (statsResponse.ok) {
        const response = await statsResponse.json()
        const stats = response.data?.stats || response // Handle both nested and flat structures
        
        setMetrics(prev => prev.map(metric => {
          switch (metric.id) {
            case 'total-businesses':
              return { ...metric, value: stats.totalBusinesses || 0, status: 'healthy' as const }
            case 'total-customers':
              return { ...metric, value: stats.totalCustomers || 0, status: 'healthy' as const }
            case 'total-cards':
              return { ...metric, value: stats.totalCards || 0, status: 'healthy' as const }
            case 'active-sessions':
              return { ...metric, value: stats.activeSessions || 0, status: 'healthy' as const }
            default:
              return metric
          }
        }))
      }

      // Check service health
      await checkServicesHealth()
      
    } catch (error) {
      console.error('Error loading system data:', error)
    } finally {
      setIsLoading(false)
      setLastRefresh(new Date())
    }
  }

  const checkServicesHealth = async () => {
    const healthChecks = services.map(async (service) => {
      if (!service.endpoint) return service

      const startTime = Date.now()
      try {
        const response = await fetch(service.endpoint, {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        const responseTime = Date.now() - startTime
        
        return {
          ...service,
          status: response.ok ? 'online' as const : 'degraded' as const,
          responseTime,
          lastCheck: new Date()
        }
      } catch (error) {
        return {
          ...service,
          status: 'offline' as const,
          responseTime: Date.now() - startTime,
          lastCheck: new Date()
        }
      }
    })

    const updatedServices = await Promise.all(healthChecks)
    setServices(updatedServices)
  }

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'total-businesses': return <Building className="h-5 w-5" />
      case 'total-customers': return <Users className="h-5 w-5" />
      case 'total-cards': return <CreditCard className="h-5 w-5" />
      case 'active-sessions': return <Activity className="h-5 w-5" />
      case 'wallet-provisions': return <CreditCard className="h-5 w-5" />
      case 'api-requests': return <Server className="h-5 w-5" />
      default: return <Database className="h-5 w-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'bg-green-100 text-green-800'
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
      case 'offline':
        return 'bg-red-100 text-red-800'
      case 'loading':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />
      case 'stable': return <Minus className="h-3 w-3 text-gray-500" />
      default: return null
    }
  }

  const overallHealth = {
    healthy: services.filter(s => s.status === 'online').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    offline: services.filter(s => s.status === 'offline').length,
    total: services.length
  }

  const healthPercentage = overallHealth.total > 0 
    ? Math.round((overallHealth.healthy / overallHealth.total) * 100)
    : 0

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">📊 System Monitor</h1>
            <p className="text-muted-foreground">
              Real-time system health and performance monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button 
              onClick={loadSystemData} 
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-green-600">{healthPercentage}%</div>
                <div className="text-sm text-muted-foreground">Overall System Health</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Services Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {overallHealth.healthy} Online
                  </span>
                  {overallHealth.degraded > 0 && (
                    <span className="flex items-center gap-1 text-sm">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      {overallHealth.degraded} Degraded
                    </span>
                  )}
                  {overallHealth.offline > 0 && (
                    <span className="flex items-center gap-1 text-sm">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {overallHealth.offline} Offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${healthPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">System Metrics</TabsTrigger>
            <TabsTrigger value="services">Service Status</TabsTrigger>
            <TabsTrigger value="tools">Quick Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
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
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                    {metric.description && (
                      <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            {/* Services Status */}
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {service.responseTime && (
                              <span>Response: {service.responseTime}ms</span>
                            )}
                            {service.lastCheck && (
                              <span>Last check: {service.lastCheck.toLocaleTimeString()}</span>
                            )}
                            {service.uptime && (
                              <span>Uptime: {service.uptime}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                        {service.endpoint && (
                          <Link href={service.endpoint}>
                            <Button size="sm" variant="outline">
                              Test
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            {/* Quick Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/admin/dev-tools/api-health">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">API Health Dashboard</h3>
                        <p className="text-sm text-muted-foreground">Test all API endpoints</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/debug-maps">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Google Maps Debug</h3>
                        <p className="text-sm text-muted-foreground">Debug Maps API integration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/sandbox">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Cpu className="h-8 w-8 text-purple-500" />
                      <div>
                        <h3 className="font-semibold">Testing Sandbox</h3>
                        <p className="text-sm text-muted-foreground">Card and wallet testing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/test-dashboard">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-8 w-8 text-orange-500" />
                      <div>
                        <h3 className="font-semibold">Test Dashboard</h3>
                        <p className="text-sm text-muted-foreground">Comprehensive testing interface</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/api/health">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Server className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="font-semibold">System Health API</h3>
                        <p className="text-sm text-muted-foreground">Raw health check data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/alerts">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h3 className="font-semibold">System Alerts</h3>
                        <p className="text-sm text-muted-foreground">Monitor system alerts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
}