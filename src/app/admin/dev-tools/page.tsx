'use client'

import { useState, useCallback } from 'react' 
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { EnvironmentStatusCard } from '@/components/admin/EnvironmentStatusCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
// Note: Using details/summary for collapsible functionality since @/components/ui/collapsible may not be available
import { 
  Bug, 
  TestTube, 
  Map, 
  Database, 
  Zap, 
  Settings, 
  Monitor, 
  Code, 
  PlayCircle,
  FileText,
  Users,
  CreditCard,
  Building,
  Activity,
  ExternalLink,
  Wrench,
  Gauge,
  Shield,
  AlertTriangle,
  Stethoscope,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download
} from 'lucide-react'
import Link from 'next/link'

interface DevTool {
  id: string
  title: string
  description: string
  path: string
  icon: React.ReactNode
  category: 'testing' | 'debug' | 'utilities' | 'monitoring'
  status: 'active' | 'beta' | 'deprecated'
  lastUpdated?: string
}

interface HealthCheckResult {
  tool: DevTool
  httpStatus: number
  responseTime: number
  hasErrors: boolean
  errorDetails?: string
  hasSpinners: boolean
  hasMissingData: boolean
  autoRefreshDetected: boolean
  timestamp: number
  success: boolean
}

interface HealthCheckProgress {
  total: number
  completed: number
  current: string
  isRunning: boolean
}

const devTools: DevTool[] = [
  // Testing Tools
  {
    id: 'sandbox',
    title: 'Testing Sandbox',
    description: 'Global preview mode for cards, wallets, and system flows',
    path: '/admin/sandbox',
    icon: <TestTube className="h-5 w-5" />,
    category: 'testing',
    status: 'active',
    lastUpdated: 'Recently updated'
  },
  {
    id: 'test-dashboard',
    title: 'Test Dashboard',
    description: 'Comprehensive testing interface for admin operations',
    path: '/admin/test-dashboard',
    icon: <Monitor className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-cards',
    title: 'Card Testing',
    description: 'Card functionality and wallet integration testing',
    path: '/admin/test-cards',
    icon: <CreditCard className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-business',
    title: 'Business Management Testing',
    description: 'Business operations and management flow testing',
    path: '/admin/test-business-management',
    icon: <Building className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-customer',
    title: 'Customer Monitoring Testing',
    description: 'Customer analytics and monitoring system testing',
    path: '/admin/test-customer-monitoring',
    icon: <Users className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'demo-card-creation',
    title: 'Card Creation Demo',
    description: 'Interactive demo of card creation workflow',
    path: '/admin/demo/card-creation',
    icon: <PlayCircle className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-automation',
    title: 'Test Automation',
    description: 'Automated testing and manual test page management',
    path: '/admin/dev-tools/test-automation',
    icon: <TestTube className="h-5 w-5" />,
    category: 'testing',
    status: 'active',
    lastUpdated: 'Just created'
  },

  // Debug Tools
  {
    id: 'debug-maps',
    title: 'Google Maps Debug',
    description: 'Debug Google Maps API integration and loading issues',
    path: '/debug-maps',
    icon: <Map className="h-5 w-5" />,
    category: 'debug',
    status: 'active',
    lastUpdated: 'Just updated'
  },
  {
    id: 'debug-client',
    title: 'Client Debug',
    description: 'Client-side debugging and diagnostics',
    path: '/admin/debug-client',
    icon: <Bug className="h-5 w-5" />,
    category: 'debug',
    status: 'beta'
  },
  {
    id: 'test-auth-debug',
    title: 'Auth Debug',
    description: 'Authentication system debugging and testing',
    path: '/admin/test-auth-debug',
    icon: <Shield className="h-5 w-5" />,
    category: 'debug',
    status: 'active'
  },
  {
    id: 'test-login',
    title: 'Login Testing',
    description: 'Login flow testing and validation',
    path: '/admin/test-login',
    icon: <Users className="h-5 w-5" />,
    category: 'debug',
    status: 'active'
  },

  // Utilities
  {
    id: 'api-health',
    title: 'API Health Check',
    description: 'Check status of all API endpoints and services',
    path: '/api/health',
    icon: <Activity className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },
  {
    id: 'env-check',
    title: 'Environment Check',
    description: 'Validate environment variables and configuration',
    path: '/api/health/env',
    icon: <Settings className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },
  {
    id: 'wallet-health',
    title: 'Wallet Health',
    description: 'Check wallet provisioning and update services',
    path: '/api/health/wallet',
    icon: <CreditCard className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },
  {
    id: 'centralized-arch',
    title: 'Architecture Test',
    description: 'Test centralized architecture and data flow',
    path: '/api/test/centralized-architecture',
    icon: <Database className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },

  // Monitoring
  {
    id: 'system-monitor',
    title: 'System Monitor',
    description: 'Real-time system health and performance monitoring dashboard',
    path: '/admin/dev-tools/system-monitor',
    icon: <Gauge className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active',
    lastUpdated: 'Just created'
  },
  {
    id: 'api-health-dashboard',
    title: 'API Health Dashboard',
    description: 'Comprehensive API endpoint testing and monitoring',
    path: '/admin/dev-tools/api-health',
    icon: <Activity className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active',
    lastUpdated: 'Just created'
  },
  {
    id: 'system-alerts',
    title: 'System Alerts',
    description: 'System alerts and notifications monitoring',
    path: '/admin/alerts',
    icon: <AlertTriangle className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active'
  },
  {
    id: 'support-tools',
    title: 'Support Tools',
    description: 'Customer support and manual operation tools',
    path: '/admin/support',
    icon: <Wrench className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active'
  }
]

export default function DevToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Health Check State
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResult[]>([])
  const [healthCheckProgress, setHealthCheckProgress] = useState<HealthCheckProgress>({
    total: 0,
    completed: 0,
    current: '',
    isRunning: false
  })
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false)
  const [lastHealthCheckTime, setLastHealthCheckTime] = useState<Date | null>(null)
  
  // Debug Panel State
  const [expandedDebugPanels, setExpandedDebugPanels] = useState<Set<string>>(new Set())
  const [isLogConsoleOpen, setIsLogConsoleOpen] = useState(false)
  const [logs, setLogs] = useState<Array<{
    timestamp: Date
    tool: string
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
    details?: any
  }>>([])
  
  const toggleDebugPanel = (toolId: string) => {
    setExpandedDebugPanels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }

  const addLog = (tool: string, type: 'info' | 'warning' | 'error' | 'success', message: string, details?: any) => {
    setLogs(prev => [...prev.slice(-49), { // Keep only last 50 logs
      timestamp: new Date(),
      tool,
      type,
      message,
      details
    }])
  }

  const exportLogs = () => {
    const logData = {
      exportTime: new Date().toISOString(),
      totalLogs: logs.length,
      healthCheckResults,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
    }
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dev-tools-debug-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getSuggestedFix = (result: HealthCheckResult): string => {
    if (!result.success) {
      if (result.httpStatus === 500) {
        return "Check server logs for internal errors. Restart the development server if needed."
      }
      if (result.httpStatus === 404) {
        return "Verify the route exists and is properly configured in the Next.js app directory."
      }
      if (result.httpStatus === 401 || result.httpStatus === 403) {
        return "Check authentication state and admin permissions. Try refreshing your session."
      }
      return "Check network connectivity and server status."
    }
    
    if (result.hasSpinners) {
      return "Component loading state is stuck. Check for missing finally blocks or error handling."
    }
    
    if (result.hasMissingData) {
      return "API may be returning empty data. Verify database connections and seed data."
    }
    
    if (result.autoRefreshDetected) {
      return "Excessive auto-refresh detected. Consider adding development mode conditions."
    }
    
    if (result.responseTime > 3000) {
      return "Slow response time. Consider optimizing database queries or API endpoints."
    }
    
    return "Tool is functioning normally. No action required."
  }

  const getIssueType = (result: HealthCheckResult): string => {
    if (!result.success) return "Connection Error"
    if (result.hasSpinners) return "Loading State Issue"
    if (result.hasMissingData) return "Data Issue"
    if (result.autoRefreshDetected) return "Performance Issue"
    if (result.responseTime > 3000) return "Slow Response"
    return "Healthy"
  }

  // Health Check Function with Auto-refresh Detection
  const runHealthCheck = useCallback(async (tool: DevTool): Promise<HealthCheckResult> => {
    const startTime = Date.now()
    let result: HealthCheckResult = {
      tool,
      httpStatus: 0,
      responseTime: 0,
      hasErrors: false,
      hasSpinners: false,
      hasMissingData: false,
      autoRefreshDetected: false,
      timestamp: Date.now(),
      success: false
    }

    try {
      // Step 1: HTTP Status Check
      const response = await fetch(tool.path, {
        method: 'HEAD',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      result.httpStatus = response.status
      result.responseTime = Date.now() - startTime
      result.success = response.status >= 200 && response.status < 400

      // Log the initial HTTP response
      if (result.success) {
        addLog(tool.title, 'info', `HTTP check passed: ${response.status} in ${result.responseTime}ms`)
      } else {
        addLog(tool.title, 'error', `HTTP check failed: ${response.status} ${response.statusText}`)
      }

      // Step 2: For successful HTTP responses, do deeper analysis
      if (result.success && tool.path.startsWith('/admin')) {
        try {
          // Create a hidden iframe to load the page and analyze it
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          iframe.style.width = '1px'
          iframe.style.height = '1px'
          document.body.appendChild(iframe)

          // Set up auto-refresh detection with more precise tracking
          let refreshCount = 0
          let intervalCount = 0
          const refreshDetector = setInterval(() => {
            intervalCount++
            // Only count as refresh if page actually changes
            try {
              if (iframe.contentDocument) {
                const currentContent = iframe.contentDocument.body?.innerHTML?.length || 0
                if (currentContent > 0) {
            refreshCount++
                }
              }
            } catch (e) {
              // Cross-origin or other access issues
            }
          }, 200) // Check less frequently

          // Load the page in iframe with timeout
          const loadPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              clearInterval(refreshDetector)
              reject(new Error('Page load timeout'))
            }, 8000) // Shorter timeout

            iframe.onload = () => {
              clearTimeout(timeout)
              resolve()
            }
            
            iframe.onerror = () => {
              clearTimeout(timeout)
              clearInterval(refreshDetector)
              reject(new Error('Failed to load page'))
            }
          })

          iframe.src = tool.path
          await loadPromise

          // Wait shorter time to detect auto-refreshes
          await new Promise(resolve => setTimeout(resolve, 2000))
          clearInterval(refreshDetector)

          // Analyze the loaded page
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
            if (iframeDoc) {
              // Check for spinners/loaders
              const spinnerSelectors = [
                '.animate-spin',
                '[class*="loading"]',
                '[class*="spinner"]',
                '.loader',
                '[data-testid*="loading"]',
                '[aria-label*="loading"]'
              ]
              
              result.hasSpinners = spinnerSelectors.some(selector => 
                iframeDoc.querySelectorAll(selector).length > 0
              )

              // Check for error messages
              const errorSelectors = [
                '.error',
                '[class*="error"]',
                '.alert-error',
                '[role="alert"]',
                '.text-red-500',
                '.text-destructive'
              ]
              
              const errorElements = errorSelectors.flatMap(selector => 
                Array.from(iframeDoc.querySelectorAll(selector))
              )
              
              if (errorElements.length > 0) {
                result.hasErrors = true
                result.errorDetails = errorElements
                  .map(el => el.textContent?.trim())
                  .filter(text => text && text.length > 0)
                  .slice(0, 3) // First 3 errors
                  .join('; ')
              }

              // Check for missing data indicators
              const missingDataSelectors = [
                '[class*="empty"]',
                '[class*="no-data"]'
              ]
              
              result.hasMissingData = missingDataSelectors.some(selector => 
                iframeDoc.querySelectorAll(selector).length > 0
              )

              // Also check for "No data" text content
              const textElements = Array.from(iframeDoc.querySelectorAll('.text-muted-foreground, .text-gray-500'))
              const hasNoDataText = textElements.some(el => 
                el.textContent?.toLowerCase().includes('no ') || 
                el.textContent?.toLowerCase().includes('empty')
              )
              
              result.hasMissingData = result.hasMissingData || hasNoDataText

              // Auto-refresh detection (improved heuristic)
              result.autoRefreshDetected = refreshCount > 3 && intervalCount > 10 // More realistic threshold
            }
          } catch (analysisError) {
            // Analysis failed but HTTP was successful
            result.errorDetails = `Analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`
          }

          // Clean up iframe
          try {
            if (iframe && iframe.parentNode) {
          document.body.removeChild(iframe)
            }
          } catch (cleanupError) {
            console.warn('Failed to cleanup iframe:', cleanupError)
          }

        } catch (deepAnalysisError) {
          // Deep analysis failed but HTTP was successful
          result.errorDetails = `Deep analysis failed: ${deepAnalysisError instanceof Error ? deepAnalysisError.message : 'Unknown error'}`
        }
      }

    } catch (error) {
      result.success = false
      result.hasErrors = true
      result.errorDetails = error instanceof Error ? error.message : 'Unknown error'
      result.responseTime = Date.now() - startTime
      addLog(tool.title, 'error', `Health check error: ${result.errorDetails}`, error)
    }

    return result
  }, [])

  // Run All Health Checks with Promise.allSettled for better performance
  const runAllToolHealthChecks = useCallback(async () => {
    if (healthCheckProgress.isRunning) return // Prevent multiple simultaneous runs

    setHealthCheckProgress({
      total: devTools.length,
      completed: 0,
      current: '',
      isRunning: true
    })
    
    setHealthCheckResults([])
    setIsHealthCheckOpen(true)
    
    // Use Promise.allSettled for concurrent execution
    const healthCheckPromises = devTools.map(async (tool, index) => {
      // Stagger the start slightly to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, index * 50))
      
        setHealthCheckProgress(prev => ({
          ...prev,
          current: tool.title
        }))
        
        const result = await runHealthCheck(tool)
        
        setHealthCheckProgress(prev => ({
          ...prev,
          completed: prev.completed + 1
        }))
        
        // Update results in real-time
        setHealthCheckResults(prev => [...prev, result])
        
        return result
      })
      
    // Execute all health checks concurrently
    const results = await Promise.allSettled(healthCheckPromises)
    
    setHealthCheckProgress(prev => ({
      ...prev,
      isRunning: false,
      current: 'Completed'
    }))
    
    setLastHealthCheckTime(new Date())
  }, [devTools, healthCheckProgress.isRunning, runHealthCheck])

  const categories = [
    { id: 'all', label: 'All Tools', count: devTools.length },
    { id: 'testing', label: 'Testing', count: devTools.filter(t => t.category === 'testing').length },
    { id: 'debug', label: 'Debug', count: devTools.filter(t => t.category === 'debug').length },
    { id: 'utilities', label: 'Utilities', count: devTools.filter(t => t.category === 'utilities').length },
    { id: 'monitoring', label: 'Monitoring', count: devTools.filter(t => t.category === 'monitoring').length }
  ]

  const filteredTools = devTools.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'beta': return 'secondary'
      case 'deprecated': return 'destructive'
      default: return 'outline'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'testing': return <TestTube className="h-4 w-4" />
      case 'debug': return <Bug className="h-4 w-4" />
      case 'utilities': return <Wrench className="h-4 w-4" />
      case 'monitoring': return <Monitor className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  // Calculate health summary
  const healthSummary = {
    healthy: healthCheckResults.filter(r => r.success).length,
    failed: healthCheckResults.filter(r => !r.success).length,
    withIssues: healthCheckResults.filter(r => r.hasSpinners || r.hasMissingData).length,
    autoRefresh: healthCheckResults.filter(r => r.autoRefreshDetected).length,
    avgLoadTime: healthCheckResults.length > 0 
      ? Math.round(healthCheckResults.reduce((sum, r) => sum + r.responseTime, 0) / healthCheckResults.length)
      : 0
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🛠️ Developer Tools</h1>
            <p className="text-muted-foreground">
              Testing, debugging, and development utilities for RewardJar 4.0
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={isHealthCheckOpen} onOpenChange={setIsHealthCheckOpen}>
              <SheetTrigger asChild>
                <Button 
                  onClick={runAllToolHealthChecks}
                  disabled={healthCheckProgress.isRunning}
                  className="flex items-center gap-2"
                >
                  {healthCheckProgress.isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                  {healthCheckProgress.isRunning ? 'Running Health Checks...' : '🩺 Run All Tool Health Checks'}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Developer Tools Health Report
                  </SheetTitle>
                  <SheetDescription>
                    Comprehensive health check results for all {devTools.length} developer tools
                    {lastHealthCheckTime && (
                      <span className="block mt-1 text-xs">
                        Last run: {lastHealthCheckTime.toLocaleString()}
                      </span>
                    )}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  {/* Progress Bar */}
                  {healthCheckProgress.isRunning && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress: {healthCheckProgress.completed}/{healthCheckProgress.total}</span>
                        <span className="text-muted-foreground">
                          {healthCheckProgress.current && `Testing: ${healthCheckProgress.current}`}
                        </span>
                      </div>
                      <Progress 
                        value={(healthCheckProgress.completed / healthCheckProgress.total) * 100} 
                        className="w-full" 
                      />
                    </div>
                  )}

                  {/* Summary Stats */}
                  {healthCheckResults.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {healthCheckResults.filter(r => r.success).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Healthy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {healthCheckResults.filter(r => !r.success).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {healthCheckResults.filter(r => r.hasSpinners || r.hasMissingData).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {healthCheckResults.filter(r => r.autoRefreshDetected).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Auto-refresh</div>
                      </div>
                    </div>
                  )}

                  {/* Results List */}
                  <div className="space-y-3">
                    {healthCheckResults.map((result) => (
                      <Card key={result.tool.id} className={`${
                        result.success ? 'border-green-200' : 'border-red-200'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {result.tool.icon}
                              <div>
                                <h4 className="font-medium">{result.tool.title}</h4>
                                <p className="text-xs text-muted-foreground">{result.tool.path}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <Badge variant={result.success ? 'default' : 'destructive'}>
                                {result.httpStatus}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {result.responseTime}ms
                              </span>
                              {result.hasSpinners && (
                                <span className="flex items-center gap-1 text-yellow-600">
                                  <Loader2 className="h-3 w-3" />
                                  Spinners detected
                                </span>
                              )}
                              {result.hasMissingData && (
                                <span className="flex items-center gap-1 text-yellow-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  Missing data
                                </span>
                              )}
                              {result.autoRefreshDetected && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <RefreshCw className="h-3 w-3" />
                                  Auto-refresh detected
                                </span>
                              )}
                            </div>

                            {result.hasErrors && result.errorDetails && (
                              <Alert className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Issues Found</AlertTitle>
                                <AlertDescription className="text-xs">
                                  {result.errorDetails}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Empty State */}
                  {!healthCheckProgress.isRunning && healthCheckResults.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No health check results yet.</p>
                      <p className="text-xs">Click "Run All Tool Health Checks" to start testing.</p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              {devTools.length} Tools Available
            </Badge>
          </div>
        </div>

        {/* Enhanced Health Summary Panel */}
        {healthCheckResults.length > 0 && (
          <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">System Health Overview</h3>
                    <p className="text-sm text-slate-600">Real-time monitoring of developer tools</p>
                  </div>
                </div>
                {lastHealthCheckTime && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700">Last Updated</div>
                    <div className="text-xs text-slate-500">
                      {lastHealthCheckTime.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200 hover:border-green-300 transition-all duration-200 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-green-700 mb-1">{healthSummary.healthy}</div>
                    <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Healthy
                    </div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-4 border border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-red-700 mb-1">{healthSummary.failed}</div>
                    <div className="text-sm font-medium text-red-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Failed
                    </div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-4 border border-yellow-200 hover:border-yellow-300 transition-all duration-200 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-yellow-700 mb-1">{healthSummary.withIssues}</div>
                    <div className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                      Issues
                    </div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 border border-orange-200 hover:border-orange-300 transition-all duration-200 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-orange-700 mb-1">{healthSummary.autoRefresh}</div>
                    <div className="text-sm font-medium text-orange-600 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Auto-refresh
                    </div>
                  </div>
                </div>
                
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 p-4 border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{healthSummary.avgLoadTime}ms</div>
                    <div className="text-sm font-medium text-blue-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      Avg Load
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Health Progress Bar */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Overall Health Score</span>
                  <span className="text-sm font-bold text-slate-900">
                    {Math.round((healthSummary.healthy / (healthSummary.healthy + healthSummary.failed + healthSummary.withIssues)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(healthSummary.healthy / (healthSummary.healthy + healthSummary.failed + healthSummary.withIssues)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Status */}
        <EnvironmentStatusCard />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categories.slice(1).map((category) => (
            <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveCategory(category.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.id)}
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter - Mobile Optimized */}
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search developer tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>

                {/* Enhanced Tools Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredTools.map((tool) => {
            const healthResult = healthCheckResults.find(r => r.tool.id === tool.id)
            const isExpanded = expandedDebugPanels.has(tool.id)
            const hasHealthData = !!healthResult
            
            // Dynamic border color based on health status
            const getBorderColor = () => {
              if (!healthResult) return 'border-l-slate-300'
              if (!healthResult.success) return 'border-l-red-500'
              if (healthResult.hasSpinners || healthResult.hasMissingData || healthResult.autoRefreshDetected) return 'border-l-yellow-500'
              return 'border-l-green-500'
            }
            
            return (
              <Card key={tool.id} className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 ${getBorderColor()} hover:scale-[1.02]`}>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-blue-100 transition-colors duration-200">
                    {tool.icon}
                  </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg font-bold text-slate-800">{tool.title}</CardTitle>
                          {healthResult && (
                            <div className="flex items-center gap-1">
                              {healthResult.success ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-xs font-medium text-green-600">Online</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-xs font-medium text-red-600">Error</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Health indicators */}
                        {healthResult && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600 font-medium">{healthResult.responseTime}ms</span>
                            </div>
                            {healthResult.hasSpinners && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Loading
                              </Badge>
                            )}
                            {healthResult.hasMissingData && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                No Data
                              </Badge>
                            )}
                            {healthResult.autoRefreshDetected && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Auto-refresh
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusColor(tool.status) as any} className="text-xs">
                      {tool.status}
                    </Badge>
                    {tool.lastUpdated && (
                        <span className="text-xs text-slate-500">
                        {tool.lastUpdated}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

                <CardContent className="pt-0 relative z-10">
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  {tool.description}
                </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                    {getCategoryIcon(tool.category)}
                      <span className="capitalize font-medium">{tool.category}</span>
                  </div>
                    <div className="flex items-center gap-2">
                      {hasHealthData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDebugPanel(tool.id)}
                          className="text-xs px-2 py-1 h-auto"
                        >
                          Debug
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      )}
                  <Link href={tool.path}>
                        <Button size="sm" className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                          Launch
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                  </div>

                  {/* Expandable Debug Panel */}
                  {hasHealthData && isExpanded && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-slate-800">Debug Information</h4>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="font-medium text-slate-600">Status Code:</span>
                            <div className={`inline-flex items-center ml-2 px-2 py-1 rounded text-xs font-mono ${
                              healthResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {healthResult.httpStatus || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">Response Time:</span>
                            <div className={`inline-flex items-center ml-2 px-2 py-1 rounded text-xs font-mono ${
                              healthResult.responseTime > 3000 ? 'bg-red-100 text-red-800' : 
                              healthResult.responseTime > 1000 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {healthResult.responseTime}ms
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-slate-600">Issue Type:</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getIssueType(healthResult)}
                            </Badge>
                          </div>
                        </div>
                        
                        {healthResult.errorDetails && (
                          <div>
                            <span className="font-medium text-slate-600">Error Details:</span>
                            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 font-mono text-xs">
                              {healthResult.errorDetails}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium text-slate-600">Suggested Fix:</span>
                          <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs leading-relaxed">
                            💡 {getSuggestedFix(healthResult)}
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-medium text-slate-600">Request URL:</span>
                          <div className="mt-1 p-2 bg-slate-100 rounded font-mono text-xs text-slate-700 break-all">
                            {typeof window !== 'undefined' ? window.location.origin : ''}{tool.path}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
            )
          })}
        </div>

        {filteredTools.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tools found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/dev-tools/system-monitor">
                <Button variant="outline" className="w-full justify-start">
                  <Gauge className="h-4 w-4 mr-2" />
                  System Monitor
                </Button>
              </Link>
              <Link href="/admin/dev-tools/api-health">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  API Health Dashboard
                </Button>
              </Link>
              <Link href="/debug-maps">
                <Button variant="outline" className="w-full justify-start">
                  <Map className="h-4 w-4 mr-2" />
                  Debug Google Maps
                </Button>
              </Link>
              <Link href="/admin/sandbox">
                <Button variant="outline" className="w-full justify-start">
                  <TestTube className="h-4 w-4 mr-2" />
                  Testing Sandbox
                </Button>
              </Link>
              <Link href="/api/health">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Raw Health API
                </Button>
              </Link>
              <Link href="/admin/alerts">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  System Alerts
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  runAllToolHealthChecks()
                  setIsHealthCheckOpen(true)
                }}
                disabled={healthCheckProgress.isRunning}
              >
                {healthCheckProgress.isRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Stethoscope className="h-4 w-4 mr-2" />
                )}
                Run Health Checks
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentation & Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Debug Guide - Common Issues & Solutions</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Admin Dashboard Documentation</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Card Creation & Wallet Setup Guide</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>MCP Integration Summary</span>
                <Badge variant="outline">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Debug Console - Mobile Responsive */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsLogConsoleOpen(!isLogConsoleOpen)}
            className="rounded-full w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <Bug className="h-5 w-5" />
          </Button>
          
          {isLogConsoleOpen && (
            <div className="absolute bottom-14 right-0 w-80 sm:w-96 max-w-[calc(100vw-2rem)] h-64 sm:h-80 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="text-sm font-semibold text-slate-100">Debug Console</h3>
                  <Badge variant="outline" className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                    {logs.length} logs
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exportLogs}
                    className="h-6 px-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="h-6 px-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLogConsoleOpen(false)}
                    className="h-6 px-2 text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-700"
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 h-48 sm:h-64">
                {logs.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8">
                    No logs yet. Run health checks to see debug information.
                  </div>
                ) : (
                  logs.slice().reverse().map((log, index) => (
                    <div key={index} className="text-xs font-mono">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 shrink-0">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                          log.type === 'error' ? 'bg-red-400' :
                          log.type === 'warning' ? 'bg-yellow-400' :
                          log.type === 'success' ? 'bg-green-400' :
                          'bg-blue-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-300 font-medium text-xs mb-1">{log.tool}</div>
                          <div className={`text-xs leading-relaxed ${
                            log.type === 'error' ? 'text-red-300' :
                            log.type === 'warning' ? 'text-yellow-300' :
                            log.type === 'success' ? 'text-green-300' :
                            'text-slate-300'
                          }`}>
                            {log.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayoutClient>
  )
}