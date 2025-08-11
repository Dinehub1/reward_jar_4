'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bug, 
  Monitor, 
  Smartphone, 
  Wifi, 
  Database, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Zap
} from 'lucide-react'

interface DebugInfo {
  userAgent: string
  platform: string
  language: string
  cookiesEnabled: boolean
  onlineStatus: boolean
  screenSize: string
  viewport: string
  localStorage: boolean
  sessionStorage: boolean
  geolocation: boolean
  notifications: boolean
  serviceWorker: boolean
  webGL: boolean
  touchSupport: boolean
  deviceMemory?: number
  connection?: any
}

interface NetworkInfo {
  type: string
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

interface PerformanceInfo {
  loadTime: number
  domContentLoaded: number
  firstPaint?: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
}

export default function ClientDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo | null>(null)
  const [consoleErrors, setConsoleErrors] = useState<string[]>([])
  const [refreshCount, setRefreshCount] = useState(0)

  const collectDebugInfo = () => {
    if (typeof window === 'undefined') return

    const info: DebugInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      screenSize: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      localStorage: typeof(Storage) !== "undefined",
      sessionStorage: typeof(Storage) !== "undefined",
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: !!document.createElement('canvas').getContext('webgl'),
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    }

    if ('deviceMemory' in navigator) {
      info.deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory
    }

    if ('connection' in navigator) {
      const conn = (navigator as unknown as { connection?: any }).connection
      info.connection = conn
      setNetworkInfo({
        type: conn?.type || 'unknown',
        effectiveType: conn?.effectiveType || 'unknown',
        downlink: conn?.downlink || 0,
        rtt: conn?.rtt || 0,
        saveData: conn?.saveData || false
      })
    }

    setDebugInfo(info)
  }

  const collectPerformanceInfo = () => {
    if (typeof window === 'undefined') return
    if (performance && performance.timing) {
      const timing = performance.timing
      const perf: PerformanceInfo = {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
      }

      // Get paint metrics if available
      if (performance.getEntriesByType) {
        const paintMetrics = performance.getEntriesByType('paint')
        paintMetrics.forEach((metric: any) => {
          if (metric.name === 'first-paint') {
            perf.firstPaint = metric.startTime
          } else if (metric.name === 'first-contentful-paint') {
            perf.firstContentfulPaint = metric.startTime
          }
        })

        // Get LCP if available
        const lcpMetrics = performance.getEntriesByType('largest-contentful-paint')
        if (lcpMetrics.length > 0) {
          perf.largestContentfulPaint = lcpMetrics[lcpMetrics.length - 1].startTime
        }
      }

      setPerformanceInfo(perf)
    }
  }

  useEffect(() => {
    collectDebugInfo()
    collectPerformanceInfo()

    // Capture console errors
    const originalError = console.error
      setConsoleErrors(prev => [...prev, args.join(' ')])
      originalError.apply(console, args)
    }

    return () => {
    }
  }, [])

  const refreshDebugInfo = () => {
    collectDebugInfo()
    collectPerformanceInfo()
    setRefreshCount(prev => prev + 1)
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getConnectionIcon = () => {
    if (typeof window === 'undefined') return <Clock className="h-4 w-4 text-gray-500" />
    if (!navigator.onLine) return <XCircle className="h-4 w-4 text-red-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bug className="h-8 w-8" />
              Client Debug Panel
            </h1>
            <p className="text-muted-foreground">
              Real-time client-side debugging and diagnostics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Refreshed {refreshCount} times
            </Badge>
            <Button onClick={refreshDebugInfo} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getConnectionIcon()}
                  <span className="font-medium">Network</span>
                </div>
                <Badge variant={typeof window !== 'undefined' && navigator.onLine ? "default" : "destructive"}>
                  {typeof window !== 'undefined' ? (navigator.onLine ? "Online" : "Offline") : "Loading..."}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo?.localStorage || false)}
                  <span className="font-medium">Storage</span>
                </div>
                <Badge variant="secondary">Available</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(debugInfo?.serviceWorker || false)}
                  <span className="font-medium">Service Worker</span>
                </div>
                <Badge variant={debugInfo?.serviceWorker ? "default" : "secondary"}>
                  {debugInfo?.serviceWorker ? "Supported" : "Not Supported"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Errors</span>
                </div>
                <Badge variant={consoleErrors.length > 0 ? "destructive" : "default"}>
                  {consoleErrors.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="device" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="device" className="flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              Device
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-1">
              <Wifi className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Errors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="device" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {debugInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Basic Info</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Platform:</strong> {debugInfo.platform}</div>
                        <div><strong>Language:</strong> {debugInfo.language}</div>
                        <div><strong>Screen:</strong> {debugInfo.screenSize}</div>
                        <div><strong>Viewport:</strong> {debugInfo.viewport}</div>
                        {debugInfo.deviceMemory && (
                          <div><strong>Device Memory:</strong> {debugInfo.deviceMemory} GB</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Capabilities</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugInfo.cookiesEnabled)}
                          <span>Cookies Enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugInfo.touchSupport)}
                          <span>Touch Support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugInfo.geolocation)}
                          <span>Geolocation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugInfo.notifications)}
                          <span>Notifications</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(debugInfo.webGL)}
                          <span>WebGL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Network Information</CardTitle>
              </CardHeader>
              <CardContent>
                {networkInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <div><strong>Connection Type:</strong> {networkInfo.type}</div>
                      <div><strong>Effective Type:</strong> {networkInfo.effectiveType}</div>
                      <div><strong>Downlink:</strong> {networkInfo.downlink} Mbps</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><strong>RTT:</strong> {networkInfo.rtt} ms</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(!networkInfo.saveData)}
                        <span>Data Saver: {networkInfo.saveData ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Network information not available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {performanceInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                      <div><strong>Load Time:</strong> {performanceInfo.loadTime} ms</div>
                      <div><strong>DOM Content Loaded:</strong> {performanceInfo.domContentLoaded} ms</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {performanceInfo.firstPaint && (
                        <div><strong>First Paint:</strong> {performanceInfo.firstPaint.toFixed(2)} ms</div>
                      )}
                      {performanceInfo.firstContentfulPaint && (
                        <div><strong>First Contentful Paint:</strong> {performanceInfo.firstContentfulPaint.toFixed(2)} ms</div>
                      )}
                      {performanceInfo.largestContentfulPaint && (
                        <div><strong>Largest Contentful Paint:</strong> {performanceInfo.largestContentfulPaint.toFixed(2)} ms</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Performance information not available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Storage APIs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(debugInfo?.localStorage || false)}
                        <span>Local Storage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(debugInfo?.sessionStorage || false)}
                        <span>Session Storage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(debugInfo?.serviceWorker || false)}
                        <span>Service Worker</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Usage</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Local Storage Items:</strong> {typeof window !== 'undefined' ? localStorage.length : 'N/A'}</div>
                      <div><strong>Session Storage Items:</strong> {typeof window !== 'undefined' ? sessionStorage.length : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Console Errors ({consoleErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consoleErrors.length > 0 ? (
                  <div className="space-y-2">
                    {consoleErrors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        {error}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No console errors detected</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Agent */}
        <Card>
          <CardHeader>
            <CardTitle>User Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              {debugInfo?.userAgent || 'Loading...'}
            </code>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutClient>
  )
}