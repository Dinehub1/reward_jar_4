'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database, 
  Wifi, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'

interface WalletChainHealthProps {
  className?: string
}

interface HealthData {
  overall: 'healthy' | 'warning' | 'critical'
  timestamp: string
  components: {
    supabase: {
      status: 'healthy' | 'warning' | 'critical'
      connectivity: boolean
      responseTime: number
      tables: {
        stamp_cards: number
        membership_cards: number
        customer_cards: number
        wallet_update_queue: number
      }
    }
    queue: {
      status: 'healthy' | 'warning' | 'critical'
      pending: number
      processing: number
      completed: number
      failed: number
      successRate: number
      averageProcessingTime: number
    }
    environment: {
      status: 'healthy' | 'warning' | 'critical'
      featureFlags: any
      missingVariables: string[]
      warnings: string[]
    }
    platforms: {
      apple: {
        status: 'healthy' | 'warning' | 'disabled'
        configured: boolean
        lastGenerated?: string
      }
      google: {
        status: 'healthy' | 'warning' | 'disabled'
        configured: boolean
        lastGenerated?: string
      }
      pwa: {
        status: 'healthy' | 'warning' | 'disabled'
        configured: boolean
        lastGenerated?: string
      }
    }
  }
  recentActivity: {
    lastHour: number
    last24Hours: number
    last7Days: number
    recentErrors: Array<{
      timestamp: string
      error: string
      component: string
    }>
  }
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch health data')
  }
  return response.json()
}

export function WalletChainHealthDashboard({ className = '' }: WalletChainHealthProps) {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: HealthData }>(
    '/api/admin/wallet-chain/health',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  )

  const handleRefresh = () => {
    mutate()
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Wallet Chain Health</h2>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Wallet Chain Health</h2>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load health data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const healthData = data?.data
  if (!healthData) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wallet Chain Health</h2>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring of the unified wallet system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={healthData.overall === 'healthy' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {getStatusIcon(healthData.overall)}
            <span className="ml-1 capitalize">{healthData.overall}</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supabase Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            {getStatusIcon(healthData.components.supabase.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.components.supabase.responseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Response time • {healthData.components.supabase.connectivity ? 'Connected' : 'Disconnected'}
            </p>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue</CardTitle>
            {getStatusIcon(healthData.components.queue.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.components.queue.pending + healthData.components.queue.processing}
            </div>
            <p className="text-xs text-muted-foreground">
              Active items • {healthData.components.queue.successRate.toFixed(1)}% success
            </p>
          </CardContent>
        </Card>

        {/* Environment Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            {getStatusIcon(healthData.components.environment.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.components.environment.missingVariables.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Missing variables • {healthData.components.environment.warnings.length} warnings
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.recentActivity.lastHour}
            </div>
            <p className="text-xs text-muted-foreground">
              Last hour • {healthData.recentActivity.last24Hours} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wifi className="h-5 w-5 mr-2" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(healthData.components.platforms).map(([platform, status]) => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status.status)}`} />
                  <span className="font-medium capitalize">{platform} Wallet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={status.configured ? 'default' : 'secondary'} className="text-xs">
                    {status.configured ? 'Configured' : 'Not Configured'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {status.status === 'disabled' ? 'Disabled' : status.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Queue Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Queue Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span>{healthData.components.queue.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={healthData.components.queue.successRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Pending</div>
                <div className="text-2xl font-bold text-blue-600">
                  {healthData.components.queue.pending}
                </div>
              </div>
              <div>
                <div className="font-medium">Processing</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {healthData.components.queue.processing}
                </div>
              </div>
              <div>
                <div className="font-medium">Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {healthData.components.queue.completed}
                </div>
              </div>
              <div>
                <div className="font-medium">Failed</div>
                <div className="text-2xl font-bold text-red-600">
                  {healthData.components.queue.failed}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                Avg. processing: {healthData.components.queue.averageProcessingTime}ms
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      {healthData.recentActivity.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.recentActivity.recentErrors.slice(0, 5).map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{error.component}</div>
                        <div className="text-sm">{error.error}</div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-4">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Issues */}
      {healthData.components.environment.missingVariables.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Missing Environment Variables:</div>
            <div className="text-sm">
              {healthData.components.environment.missingVariables.join(', ')}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(healthData.timestamp).toLocaleString()}
      </div>
    </div>
  )
}