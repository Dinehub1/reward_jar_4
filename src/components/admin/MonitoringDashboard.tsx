'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Download
} from 'lucide-react'

interface AnalyticsData {
  events: Array<{
    id: string
    event_name: string
    properties: Record<string, any>
    session_id: string
    timestamp: string
    created_at: string
  }>
  total: number
}

interface DashboardMetrics {
  totalCardCreations: number
  completionRate: number
  averageCompletionTime: number
  mostUsedTemplate: string
  errorRate: number
  activeUsers: number
  topErrors: Array<{ error: string, count: number }>
  performanceMetrics: Array<{ metric: string, value: number, unit: string }>
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24)
          break
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
      }

      const response = await fetch(
        `/api/analytics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&limit=1000`
      )
      
      if (response.ok) {
        const analyticsData: AnalyticsData = await response.json()
        setData(analyticsData)
        calculateMetrics(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (data: AnalyticsData) => {
    const events = data.events

    // Calculate metrics
    const cardCreationStarted = events.filter(e => e.event_name === 'card_creation_started').length
    const cardCreationCompleted = events.filter(e => e.event_name === 'card_creation_completed').length
    const cardCreationAbandoned = events.filter(e => e.event_name === 'card_creation_abandoned').length
    
    const completionRate = cardCreationStarted > 0 
      ? Math.round((cardCreationCompleted / cardCreationStarted) * 100) 
      : 0

    // Calculate average completion time
    const completedEvents = events.filter(e => e.event_name === 'card_creation_completed')
    const avgCompletionTime = completedEvents.length > 0
      ? Math.round(
          completedEvents.reduce((sum, event) => sum + (event.properties.totalTime || 0), 0) / completedEvents.length
        )
      : 0

    // Most used template
    const templateUsage: Record<string, number> = {}
    events
      .filter(e => e.event_name === 'card_creation_started')
      .forEach(event => {
        const template = event.properties.templateUsed || 'custom'
        templateUsage[template] = (templateUsage[template] || 0) + 1
      })
    
    const mostUsedTemplate = Object.entries(templateUsage)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

    // Error analysis
    const errorEvents = events.filter(e => e.event_name === 'error_occurred')
    const errorRate = events.length > 0 
      ? Math.round((errorEvents.length / events.length) * 100) 
      : 0

    const errorCounts: Record<string, number> = {}
    errorEvents.forEach(event => {
      const errorMsg = event.properties.error?.message || 'Unknown error'
      errorCounts[errorMsg] = (errorCounts[errorMsg] || 0) + 1
    })

    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))

    // Active users (unique sessions)
    const uniqueSessions = new Set(events.map(e => e.session_id)).size

    // Performance metrics
    const performanceEvents = events.filter(e => e.event_name === 'performance_metric')
    const performanceMetrics = ['LCP', 'FID', 'CLS'].map(metric => {
      const metricEvents = performanceEvents.filter(e => e.properties.name === metric)
      const avgValue = metricEvents.length > 0
        ? metricEvents.reduce((sum, e) => sum + e.properties.value, 0) / metricEvents.length
        : 0
      
      return {
        metric,
        value: Math.round(avgValue * 100) / 100,
        unit: metricEvents[0]?.properties.unit || 'ms'
      }
    })

    setMetrics({
      totalCardCreations: cardCreationCompleted,
      completionRate,
      averageCompletionTime: Math.round(avgCompletionTime / 1000), // Convert to seconds
      mostUsedTemplate,
      errorRate,
      activeUsers: uniqueSessions,
      topErrors,
      performanceMetrics
    })
  }

  const exportData = () => {
    if (!data) return

    const csvContent = [
      ['Event', 'Timestamp', 'Session ID', 'Properties'],
      ...data.events.map(event => [
        event.event_name,
        event.timestamp,
        event.session_id,
        JSON.stringify(event.properties)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Card Creation Analytics</h2>
          <p className="text-gray-600">Monitor performance and user behavior</p>
        </div>
        
        <div className="flex gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['24h', '7d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  timeRange === range 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cards Created</p>
                <p className="text-2xl font-bold">{metrics?.totalCardCreations || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{metrics?.completionRate || 0}%</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${
                (metrics?.completionRate || 0) > 70 ? 'text-green-500' : 'text-yellow-500'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold">{metrics?.averageCompletionTime || 0}s</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{metrics?.activeUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Core Web Vitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.performanceMetrics.map(metric => (
                <div key={metric.metric} className="flex justify-between items-center">
                  <span className="font-medium">{metric.metric}</span>
                  <Badge variant={
                    metric.metric === 'LCP' && metric.value < 2500 ? 'default' :
                    metric.metric === 'FID' && metric.value < 100 ? 'default' :
                    metric.metric === 'CLS' && metric.value < 0.1 ? 'default' :
                    'destructive'
                  }>
                    {metric.value} {metric.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Top Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topErrors.length ? (
                metrics.topErrors.map((error, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 flex-1 mr-2">
                      {error.error.substring(0, 50)}...
                    </span>
                    <Badge variant="destructive">{error.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No errors recorded</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Most Used Template</p>
              <p className="font-semibold">{metrics?.mostUsedTemplate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="font-semibold text-red-600">{metrics?.errorRate || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="font-semibold">{data?.total || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}