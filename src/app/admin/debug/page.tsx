'use client'

import { useState, useEffect } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bug, 
  Monitor, 
  Shield, 
  Zap, 
  Database, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  User,
  QrCode,
  CreditCard,
  Download,
  Play,
  Settings,
  Eye,
  FileText,
  Smartphone,
  Target,
  Activity,
  Bell,
  Lock
} from 'lucide-react'
import { 
  adminAuditService, 
  type RouteTestResult, 
  type SessionInfo, 
  type SystemHealth, 
  type SimulationResult, 
  type AuditLog,
  type AuditReport,
  type AuditEvent,
  type Alert,
  AUDIT_ROUTES
} from '@/lib/admin-audit'
import { realtimeAuditMonitor } from '@/lib/realtime-audit-monitor'
import { alertingService } from '@/lib/alerting-service'
import { scheduledAuditService } from '@/lib/scheduled-audit-service'

export default function AdminDebugAuditDashboard() {
  // State management
  const [routeTests, setRouteTests] = useState<RouteTestResult[]>([])
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    supabase: 'testing',
    database: 'testing',
    storage: 'testing',
    walletServices: 'testing',
    apiEndpoints: 0
  })
  const [simulations, setSimulations] = useState<SimulationResult[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  // Real-time monitoring state
  const [realtimeEvents, setRealtimeEvents] = useState<AuditEvent[]>([])
  const [currentAlerts, setCurrentAlerts] = useState<Alert[]>([])
  const [wsConnectionStatus, setWsConnectionStatus] = useState<{ connected: boolean; attempts: number }>({ connected: false, attempts: 0 })
  const [scheduledAuditStatus, setScheduledAuditStatus] = useState<any>(null)
  const [auditHistory, setAuditHistory] = useState<any[]>([])
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false)
  
  // Simulation parameters
  const [simulationParams, setSimulationParams] = useState({
    cardId: '',
    customerCardId: '',
    billAmount: 0,
    customerId: ''
  })

  // Use routes from audit service
  const routesToTest = AUDIT_ROUTES

  // Initialize dashboard
  useEffect(() => {
    initializeAuditDashboard()
    
    // Cleanup on unmount
    return () => {
      if (isLiveMonitoring) {
        stopLiveMonitoring()
      }
    }
  }, [])

  // Update WebSocket connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      setWsConnectionStatus(realtimeAuditMonitor.getConnectionStatus())
    }
    
    const interval = setInterval(updateConnectionStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const initializeAuditDashboard = async () => {
    console.log('🔍 Initializing Admin Audit Dashboard...')
    
    // Initialize route tests
    const initialTests = routesToTest.map(route => ({
      route: route.route,
      method: route.method,
      status: 'pending' as const
    }))
    setRouteTests(initialTests)
    
    // Load session info
    await loadSessionInfo()
    
    // Check system health
    await checkSystemHealth()
    
    // Load recent audit logs
    await loadAuditLogs()
    
    // Load audit history
    await loadAuditHistory()
    
    // Get scheduled audit status
    await loadScheduledAuditStatus()
  }

  const loadSessionInfo = async () => {
    try {
      console.log('🔐 Loading session information...')
      const sessionInfo = await adminAuditService.getSessionInfo()
      setSessionInfo(sessionInfo)
      console.log('✅ Session info loaded:', sessionInfo)
    } catch (error) {
      console.error('❌ Error loading session info:', error)
      setSessionInfo({
        isAuthenticated: false,
        error: `Session error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  const checkSystemHealth = async () => {
    try {
      console.log('🏥 Checking system health...')
      const health = await adminAuditService.checkSystemHealth()
      setSystemHealth(health)
      console.log('✅ System health check completed:', health)
    } catch (error) {
      console.error('❌ System health check failed:', error)
      setSystemHealth(prev => ({
        ...prev,
        supabase: 'error',
        timestamp: new Date().toISOString()
      }))
    }
  }

  const testRoute = async (route: string, method: string) => {
    console.log(`🧪 Testing route: ${method} ${route}`)
    
    // Update status to testing
    setRouteTests(prev => prev.map(test => 
      test.route === route && test.method === method 
        ? { ...test, status: 'testing' }
        : test
    ))
    
    try {
      const result = await adminAuditService.testRoute(route, method)
      
      // Update with results
      setRouteTests(prev => prev.map(test => 
        test.route === route && test.method === method ? result : test
      ))
      
      console.log(`✅ Route test completed: ${route} - ${result.statusCode} (${result.responseTime}ms)`)
    } catch (error) {
      console.error(`❌ Route test failed: ${route}`, error)
    }
  }

  const testAllRoutes = async () => {
    console.log('🧪 Testing all routes...')
    
    try {
      const results = await adminAuditService.testAllRoutes()
      setRouteTests(results)
      console.log('✅ All route tests completed')
    } catch (error) {
      console.error('❌ Route testing failed:', error)
    }
  }

  const simulateQRScan = async () => {
    if (!simulationParams.cardId) {
      alert('Please enter a Card ID for QR scan simulation')
      return
    }
    
    console.log('📱 Simulating QR scan for card:', simulationParams.cardId)
    
    setSimulations(prev => [...prev, {
      type: 'qr_scan',
      status: 'testing',
      timestamp: new Date().toISOString()
    }])
    
    try {
      const result = await adminAuditService.simulateQRScan(simulationParams.cardId)
      
      setSimulations(prev => prev.map((sim, index) => 
        index === prev.length - 1 ? result : sim
      ))
      
      console.log('✅ QR scan simulation completed:', result)
    } catch (error) {
      setSimulations(prev => prev.map((sim, index) => 
        index === prev.length - 1 ? {
          ...sim,
          status: 'error',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        } : sim
      ))
      
      console.error('❌ QR scan simulation failed:', error)
    }
  }

  const simulateStampEarning = async () => {
    if (!simulationParams.customerCardId) {
      alert('Please enter a Customer Card ID for stamp simulation')
      return
    }
    
    console.log('⭐ Simulating stamp earning for card:', simulationParams.customerCardId)
    
    setSimulations(prev => [...prev, {
      type: 'stamp_add',
      status: 'testing',
      timestamp: new Date().toISOString()
    }])
    
    try {
      const result = await adminAuditService.simulateStampEarning(
        simulationParams.customerCardId, 
        simulationParams.billAmount || undefined
      )
      
      setSimulations(prev => prev.map((sim, index) => 
        index === prev.length - 1 ? result : sim
      ))
      
      console.log('✅ Stamp earning simulation completed:', result)
    } catch (error) {
      setSimulations(prev => prev.map((sim, index) => 
        index === prev.length - 1 ? {
          ...sim,
          status: 'error',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        } : sim
      ))
      
      console.error('❌ Stamp earning simulation failed:', error)
    }
  }

  const simulateWalletGeneration = async () => {
    if (!simulationParams.customerCardId) {
      alert('Please enter a Customer Card ID for wallet generation')
      return
    }
    
    console.log('📲 Simulating wallet generation for card:', simulationParams.customerCardId)
    
    setSimulations(prev => [...prev, {
      type: 'wallet_generate',
      status: 'testing',
      timestamp: new Date().toISOString()
    }])
    
    try {
      const result = await adminAuditService.simulateWalletGeneration(simulationParams.customerCardId)
      
      setSimulations(prev => prev.map((sim, index) => 
        index === prev.length - 1 ? result : sim
      ))
      
      console.log('✅ Wallet generation simulation completed:', result)
    } catch (error) {
      setSimulations(prev => prev.map((sim, index) => 
        index === prev.length - 1 ? {
          ...sim,
          status: 'error',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        } : sim
      ))
      
      console.error('❌ Wallet generation simulation failed:', error)
    }
  }

  const loadAuditLogs = async () => {
    try {
      console.log('📋 Loading audit logs...')
      const logs = await adminAuditService.getAuditLogs(50)
      setAuditLogs(logs)
      console.log('✅ Audit logs loaded:', logs.length, 'entries')
    } catch (error) {
      console.error('❌ Failed to load audit logs:', error)
      setAuditLogs([])
    }
  }

  const loadAuditHistory = async () => {
    try {
      console.log('📊 Loading audit history...')
      const response = await fetch('/api/admin/audit-history?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setAuditHistory(data.data)
        console.log('✅ Audit history loaded:', data.data.length, 'entries')
      }
    } catch (error) {
      console.error('❌ Failed to load audit history:', error)
      setAuditHistory([])
    }
  }

  const loadScheduledAuditStatus = async () => {
    try {
      const status = scheduledAuditService.getStatus()
      setScheduledAuditStatus(status)
      console.log('✅ Scheduled audit status loaded:', status)
    } catch (error) {
      console.error('❌ Failed to load scheduled audit status:', error)
    }
  }

  const startLiveMonitoring = async () => {
    try {
      console.log('🔴 Starting live monitoring...')
      setIsLiveMonitoring(true)
      
      // Start WebSocket monitoring
      const connected = await realtimeAuditMonitor.startRealTimeMonitoring()
      
      if (connected) {
        // Set up event listeners
        realtimeAuditMonitor.addEventListener('*', (event: AuditEvent) => {
          setRealtimeEvents(prev => [event, ...prev.slice(0, 49)]) // Keep last 50 events
        })

        realtimeAuditMonitor.addEventListener('system_alert', (event: AuditEvent) => {
          if (event.severity === 'critical' || event.severity === 'error') {
            setCurrentAlerts(prev => [...prev, {
              id: event.id,
              level: event.severity as Alert['level'],
              message: `Real-time alert: ${event.data?.message || 'System event'}`,
              action: 'investigate_realtime_event',
              timestamp: event.timestamp,
              metadata: event.data
            }])
          }
        })
        
        // Start scheduled audits if not running
        if (!scheduledAuditStatus?.running) {
          await scheduledAuditService.start()
          await loadScheduledAuditStatus()
        }
        
        console.log('✅ Live monitoring started successfully')
      } else {
        console.warn('⚠️ WebSocket connection failed, continuing without real-time updates')
      }
    } catch (error) {
      console.error('❌ Failed to start live monitoring:', error)
      setIsLiveMonitoring(false)
    }
  }

  const stopLiveMonitoring = () => {
    console.log('⏹️ Stopping live monitoring...')
    setIsLiveMonitoring(false)
    realtimeAuditMonitor.stopRealTimeMonitoring()
    console.log('✅ Live monitoring stopped')
  }

  const checkCurrentAlerts = async () => {
    try {
      console.log('🚨 Checking current system alerts...')
      const alertStatus = await alertingService.checkSystemHealth()
      setCurrentAlerts(alertStatus.alerts)
      
      // Send alerts if any critical issues
      if (alertStatus.alerts.length > 0) {
        console.log(`⚠️ Found ${alertStatus.alerts.length} current alerts`)
        
        for (const alert of alertStatus.alerts) {
          if (alertingService.isUrgentAlert(alert)) {
            await alertingService.sendAlert(alert)
          }
        }
      }
      
      return alertStatus
    } catch (error) {
      console.error('❌ Failed to check current alerts:', error)
      return { alerts: [], status: 'error' as const, lastCheck: new Date().toISOString() }
    }
  }

  const forceRunScheduledAudit = async (auditName: string) => {
    try {
      console.log(`🚀 Force running scheduled audit: ${auditName}`)
      const success = await scheduledAuditService.forceRunAudit(auditName)
      
      if (success) {
        console.log(`✅ Successfully ran audit: ${auditName}`)
        // Refresh data
        await loadAuditHistory()
        await loadScheduledAuditStatus()
      } else {
        console.error(`❌ Failed to run audit: ${auditName}`)
      }
      
      return success
    } catch (error) {
      console.error(`❌ Error running audit ${auditName}:`, error)
      return false
    }
  }

  const exportAuditReport = async () => {
    setIsGeneratingReport(true)
    console.log('📄 Generating audit report...')
    
    try {
      const auditData: Partial<AuditReport> = {
        timestamp: new Date().toISOString(),
        sessionInfo: sessionInfo || undefined,
        systemHealth,
        routeTests,
        simulations,
        auditLogs: auditLogs.slice(0, 20) // Last 20 logs
      }
      
      // Generate summary
      if (sessionInfo) {
        auditData.summary = adminAuditService.generateAuditSummary(
          routeTests,
          systemHealth,
          sessionInfo
        )
      }
      
      const report = adminAuditService.generateMarkdownReport(auditData)
      
      // Download the report
      const blob = new Blob([report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ADMIN_SYSTEM_AUDIT_REPORT_${new Date().toISOString().split('T')[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
      
      console.log('✅ Audit report exported successfully')
      alert('Audit report exported successfully! Check your downloads folder.')
    } catch (error) {
      console.error('❌ Failed to export audit report:', error)
      alert('Failed to export audit report. Check console for details.')
    } finally {
      setIsGeneratingReport(false)
    }
  }



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Admin System Audit Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive system testing, monitoring, and security validation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={isLiveMonitoring ? stopLiveMonitoring : startLiveMonitoring}
              size="sm" 
              variant={isLiveMonitoring ? "destructive" : "default"}
            >
              {isLiveMonitoring ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  Stop Live
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Start Live
                </>
              )}
            </Button>
            <Button onClick={testAllRoutes} size="sm" variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Test All Routes
            </Button>
            <Button onClick={exportAuditReport} size="sm" disabled={isGeneratingReport}>
              {isGeneratingReport ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Report
            </Button>
            <Button onClick={initializeAuditDashboard} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Authentication</span>
                </div>
                {getStatusBadge(sessionInfo?.isAuthenticated && sessionInfo?.userRole === 1 ? 'success' : 'error')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span className="font-medium">System Health</span>
                </div>
                {getStatusBadge(Object.values(systemHealth).filter(v => v === 'connected').length >= 3 ? 'success' : 'error')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Route Tests</span>
                </div>
                <Badge variant="outline">
                  {routeTests.filter(r => r.status === 'success').length}/{routeTests.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={`h-4 w-4 ${wsConnectionStatus.connected ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                  <span className="font-medium">Live Monitor</span>
                </div>
                {getStatusBadge(isLiveMonitoring && wsConnectionStatus.connected ? 'success' : 'error')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className={`h-4 w-4 ${currentAlerts.length > 0 ? 'text-red-500 animate-bounce' : 'text-green-500'}`} />
                  <span className="font-medium">Alerts</span>
                </div>
                <Badge variant={currentAlerts.length > 0 ? "destructive" : "default"}>
                  {currentAlerts.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Scheduled</span>
                </div>
                <Badge variant={scheduledAuditStatus?.running ? "default" : "outline"}>
                  {scheduledAuditStatus?.running ? 'Running' : 'Stopped'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="routes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="routes" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Auth Status
            </TabsTrigger>
            <TabsTrigger value="simulation" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Simulation
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1">
              <Monitor className="h-4 w-4" />
              Health
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Route Testing Tab */}
          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Access Testing</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test all admin, business, and customer routes for proper authentication and authorization
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {routeTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="font-medium">{test.method} {test.route}</div>
                          <div className="text-sm text-muted-foreground">
                            {test.description} 
                            {test.requiredRole && (
                              <span className="ml-2 text-xs">
                                (Role: {test.requiredRole === 1 ? 'Admin' : test.requiredRole === 2 ? 'Business' : 'Customer'})
                              </span>
                            )}
                          </div>
                          {test.error && (
                            <div className="text-sm text-red-500">{test.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.responseTime && (
                          <Badge variant="outline">{test.responseTime}ms</Badge>
                        )}
                        {test.statusCode && (
                          <Badge variant={test.statusCode < 400 ? "default" : "destructive"}>
                            {test.statusCode}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testRoute(test.route, test.method)}
                          disabled={test.status === 'testing'}
                        >
                          {test.status === 'testing' ? 'Testing...' : 'Test'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication Status Tab */}
          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session & Authentication Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessionInfo ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Authentication Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(sessionInfo.isAuthenticated ? 'success' : 'error')}
                          <span>{sessionInfo.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">User Role</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(sessionInfo.userRole === 1 ? 'success' : 'error')}
                          <span>
                            {sessionInfo.userRole === 1 ? 'Admin' : 
                             sessionInfo.userRole === 2 ? 'Business' : 
                             sessionInfo.userRole === 3 ? 'Customer' : 'Unknown'}
                            {sessionInfo.userRole && ` (Role ID: ${sessionInfo.userRole})`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">User Details</Label>
                        <div className="mt-1 space-y-1 text-sm">
                          <div><strong>User ID:</strong> {sessionInfo.userId || 'N/A'}</div>
                          <div><strong>Email:</strong> {sessionInfo.email || 'N/A'}</div>
                          <div><strong>Session Valid:</strong> {sessionInfo.sessionValid ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Loading session information...</p>
                  </div>
                )}
                
                {sessionInfo?.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-red-800 font-medium">Authentication Error</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">{sessionInfo.error}</p>
                  </div>
                )}
                
                <Button onClick={loadSessionInfo} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Session Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simulation Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardId">Card ID (for QR scan)</Label>
                    <Input
                      id="cardId"
                      value={simulationParams.cardId}
                      onChange={(e) => setSimulationParams(prev => ({...prev, cardId: e.target.value}))}
                      placeholder="Enter card ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customerCardId">Customer Card ID (for stamps/wallet)</Label>
                    <Input
                      id="customerCardId"
                      value={simulationParams.customerCardId}
                      onChange={(e) => setSimulationParams(prev => ({...prev, customerCardId: e.target.value}))}
                      placeholder="Enter customer card ID"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="billAmount">Bill Amount (optional)</Label>
                    <Input
                      id="billAmount"
                      type="number"
                      step="0.01"
                      value={simulationParams.billAmount}
                      onChange={(e) => setSimulationParams(prev => ({...prev, billAmount: parseFloat(e.target.value) || 0}))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Button onClick={simulateQRScan} className="w-full">
                      <QrCode className="h-4 w-4 mr-2" />
                      Simulate QR Scan
                    </Button>
                    <Button onClick={simulateStampEarning} className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Simulate Stamp Earning
                    </Button>
                    <Button onClick={simulateWalletGeneration} className="w-full">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Simulate Wallet Generation
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Simulation Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {simulations.length > 0 ? (
                    <div className="space-y-3">
                      {simulations.slice(-5).reverse().map((sim, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(sim.status)}
                              <span className="font-medium">
                                {sim.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            {getStatusBadge(sim.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {sim.timestamp && new Date(sim.timestamp).toLocaleString()}
                          </div>
                          {sim.details && (
                            <details className="mt-2">
                              <summary className="text-sm font-medium cursor-pointer">Details</summary>
                              <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-auto">
                                {JSON.stringify(sim.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No simulations run yet</p>
                      <p className="text-sm">Use the controls on the left to run simulations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health Monitoring</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring of all system components and services
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>Supabase Connection</span>
                      </div>
                      {getStatusBadge(systemHealth.supabase)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>Database Queries</span>
                      </div>
                      {getStatusBadge(systemHealth.database)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Wallet Services</span>
                      </div>
                      {getStatusBadge(systemHealth.walletServices)}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">API Endpoints</div>
                      <div className="text-sm text-muted-foreground">
                        {systemHealth.apiEndpoints} total endpoints monitored
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">Last Health Check</div>
                      <div className="text-sm text-muted-foreground">
                        {systemHealth.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    
                    <Button onClick={checkSystemHealth} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Health Check
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Monitoring Tab */}
          <TabsContent value="realtime" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* WebSocket Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className={`h-5 w-5 ${wsConnectionStatus.connected ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                    WebSocket Connection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge variant={wsConnectionStatus.connected ? "default" : "destructive"}>
                      {wsConnectionStatus.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reconnection Attempts</span>
                    <Badge variant="outline">{wsConnectionStatus.attempts}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Live Monitoring</span>
                    <Badge variant={isLiveMonitoring ? "default" : "outline"}>
                      {isLiveMonitoring ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={isLiveMonitoring ? stopLiveMonitoring : startLiveMonitoring}
                      className="w-full"
                      variant={isLiveMonitoring ? "destructive" : "default"}
                    >
                      {isLiveMonitoring ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-pulse" />
                          Stop Live Monitoring
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 mr-2" />
                          Start Live Monitoring
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Audits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Scheduled Audits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scheduledAuditStatus ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Service Status</span>
                        <Badge variant={scheduledAuditStatus.running ? "default" : "destructive"}>
                          {scheduledAuditStatus.running ? 'Running' : 'Stopped'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Active Schedules</span>
                        <Badge variant="outline">{scheduledAuditStatus.scheduledAudits?.length || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Audits Run</span>
                        <Badge variant="outline">{scheduledAuditStatus.totalAuditsRun || 0}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Force Run Audit</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => forceRunScheduledAudit('health-check')}
                          >
                            Health Check
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => forceRunScheduledAudit('route-testing')}
                          >
                            Route Tests
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => forceRunScheduledAudit('comprehensive-audit')}
                          >
                            Full Audit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => forceRunScheduledAudit('daily-report')}
                          >
                            Daily Report
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Loading scheduled audit status...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Real-time Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Events ({realtimeEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {realtimeEvents.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {realtimeEvents.map((event, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(event.severity)}
                            <span className="font-medium">{event.type.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <Badge variant={event.severity === 'critical' ? 'destructive' : event.severity === 'error' ? 'destructive' : event.severity === 'warning' ? 'secondary' : 'outline'}>
                            {event.severity}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                        {event.data && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium cursor-pointer">Event Data</summary>
                            <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No real-time events yet</p>
                    <p className="text-sm">Start live monitoring to see events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Current System Alerts ({currentAlerts.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={checkCurrentAlerts} size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Alerts
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {currentAlerts.map((alert, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${
                        alert.level === 'critical' ? 'border-red-500 bg-red-50' :
                        alert.level === 'error' ? 'border-orange-500 bg-orange-50' :
                        alert.level === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {alert.level === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {alert.level === 'error' && <XCircle className="h-4 w-4 text-orange-500" />}
                            {alert.level === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            {alert.level === 'info' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            <span className="font-medium">{alert.level.toUpperCase()}</span>
                          </div>
                          <Badge variant={alert.level === 'critical' ? 'destructive' : alert.level === 'error' ? 'destructive' : 'secondary'}>
                            {alertingService.getAlertSeverity(alert)}% severity
                          </Badge>
                        </div>
                        <p className="font-medium mb-2">{alert.message}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Action:</strong> {alert.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}
                        </p>
                        {alert.metadata && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium cursor-pointer">Alert Details</summary>
                            <pre className="text-xs mt-1 p-2 bg-white rounded overflow-auto">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-green-600 font-medium">No Current Alerts</p>
                    <p className="text-sm">System is healthy - all checks passing</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alert History from Audit History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Historical audit results and trend analysis
                </p>
              </CardHeader>
              <CardContent>
                {auditHistory.length > 0 ? (
                  <div className="space-y-2">
                    {auditHistory.map((audit, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{audit.audit_type.replace('-', ' ').toUpperCase()}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(audit.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Status: {audit.results?.status || 'Unknown'}
                          {audit.results?.alertCount !== undefined && (
                            <span className="ml-2">• Alerts: {audit.results.alertCount}</span>
                          )}
                        </div>
                        <details className="mt-2">
                          <summary className="text-sm font-medium cursor-pointer">Audit Results</summary>
                          <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-auto">
                            {JSON.stringify(audit.results, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent System Events</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Last 50 authentication, stamp, and reward events
                </p>
              </CardHeader>
              <CardContent>
                {auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{log.event_type.replace('_', ' ').toUpperCase()}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          User: {log.user_id || 'System'}
                        </div>
                        <details className="mt-2">
                          <summary className="text-sm font-medium cursor-pointer">Event Details</summary>
                          <pre className="text-xs mt-1 p-2 bg-gray-50 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit logs available</p>
                  </div>
                )}
                
                <Button onClick={loadAuditLogs} variant="outline" className="w-full mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Logs
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Audit Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate comprehensive audit report in Markdown format
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Report Contents</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Authentication status and session details</li>
                      <li>• Complete route testing results</li>
                      <li>• System health and connectivity status</li>
                      <li>• Simulation test results</li>
                      <li>• Recent audit logs and events</li>
                      <li>• Security recommendations</li>
                      <li>• Performance metrics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Export Options</h4>
                    <div className="space-y-2">
                      <Button 
                        onClick={exportAuditReport} 
                        className="w-full"
                        disabled={isGeneratingReport}
                      >
                        {isGeneratingReport ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download Audit Report (.md)
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-800">Report Information</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    The audit report will be saved to <code>@ADMIN_SYSTEM_AUDIT_REPORT.md</code> and 
                    automatically downloaded. It includes all current test results, system status, 
                    and security recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
}