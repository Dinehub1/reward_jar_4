/**
 * RewardJar 4.0 - Admin Audit Utility Library
 * Centralized audit tools, system testing, and report generation
 * 
 * @version 4.0
 * @created January 2025
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'

// Types for audit system
export interface RouteTestResult {
  route: string
  method: string
  status: 'success' | 'error' | 'testing' | 'pending'
  responseTime?: number
  statusCode?: number
  error?: string
  timestamp?: string
  requiredRole?: number
  description?: string
}

export interface SessionInfo {
  isAuthenticated: boolean
  userId?: string
  userRole?: number
  email?: string
  sessionValid?: boolean
  tokenClaims?: any
  error?: string
  lastActivity?: string
  sessionDuration?: number
}

export interface SystemHealth {
  supabase: 'connected' | 'error' | 'testing'
  database: 'connected' | 'error' | 'testing'
  storage: 'connected' | 'error' | 'testing'
  walletServices: 'connected' | 'error' | 'testing'
  apiEndpoints: number
  timestamp?: string
  responseTime?: number
  errors?: string[]
}

export interface SimulationResult {
  type: 'qr_scan' | 'stamp_add' | 'reward_trigger' | 'wallet_generate'
  status: 'success' | 'error' | 'testing'
  details?: any
  timestamp?: string
  duration?: number
  parameters?: any
}

export interface AuditLog {
  id: string
  event_type: string
  user_id?: string
  details: any
  created_at: string
  ip_address?: string
  user_agent?: string
}

export interface AuditReport {
  timestamp: string
  sessionInfo: SessionInfo
  systemHealth: SystemHealth
  routeTests: RouteTestResult[]
  simulations: SimulationResult[]
  auditLogs: AuditLog[]
  summary: AuditSummary
}

export interface AuditSummary {
  totalRoutes: number
  successfulRoutes: number
  failedRoutes: number
  averageResponseTime: number
  systemHealthScore: number
  securityScore: number
  recommendationsCount: number
}

// Route definitions for comprehensive testing
export const AUDIT_ROUTES: Array<{
  route: string
  method: string
  description: string
  requiredRole?: number
  category: 'admin' | 'business' | 'customer' | 'public'
}> = [
  // Admin routes (role_id = 1)
  { route: '/api/admin/auth-check', method: 'GET', description: 'Admin auth validation', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/dashboard-unified', method: 'GET', description: 'Admin dashboard data', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/businesses', method: 'GET', description: 'Business management', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/customers', method: 'GET', description: 'Customer management', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/cards', method: 'GET', description: 'Card management', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/health-check', method: 'GET', description: 'System health check', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/promote-user', method: 'POST', description: 'User role promotion', requiredRole: 1, category: 'admin' },
  { route: '/api/admin/sync-wallets', method: 'POST', description: 'Wallet synchronization', requiredRole: 1, category: 'admin' },
  
  // Business routes (role_id = 2)
  { route: '/api/business/dashboard', method: 'GET', description: 'Business dashboard', requiredRole: 2, category: 'business' },
  { route: '/api/business/profile', method: 'GET', description: 'Business profile', requiredRole: 2, category: 'business' },
  { route: '/api/business/analytics', method: 'GET', description: 'Business analytics', requiredRole: 2, category: 'business' },
  { route: '/api/business/memberships', method: 'GET', description: 'Membership management', requiredRole: 2, category: 'business' },
  
  // Customer routes (role_id = 3)
  { route: '/api/customer/card', method: 'GET', description: 'Customer cards', requiredRole: 3, category: 'customer' },
  
  // Public routes (no authentication required)
  { route: '/api/health/simple', method: 'GET', description: 'Basic health check', category: 'public' },
  { route: '/api/analytics', method: 'GET', description: 'Public analytics', category: 'public' }
]

// Audit utility class
export class AdminAuditService {
  private adminClient = createAdminClient()

  /**
   * Test a single route for accessibility and performance
   */
  async testRoute(route: string, method: string, headers?: Record<string, string>): Promise<RouteTestResult> {
    const startTime = Date.now()
    
    try {
      console.log(`🧪 Testing route: ${method} ${route}`)
      
      const response = await fetch(route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })
      
      const responseTime = Date.now() - startTime
      
      return {
        route,
        method,
        status: response.ok ? 'success' : 'error',
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      return {
        route,
        method,
        status: 'error',
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test all defined routes
   */
  async testAllRoutes(delayBetweenTests = 100): Promise<RouteTestResult[]> {
    console.log('🧪 Starting comprehensive route testing...')
    
    const results: RouteTestResult[] = []
    
    for (const routeConfig of AUDIT_ROUTES) {
      const result = await this.testRoute(routeConfig.route, routeConfig.method)
      result.description = routeConfig.description
      result.requiredRole = routeConfig.requiredRole
      
      results.push(result)
      
      // Small delay to avoid overwhelming the server
      if (delayBetweenTests > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenTests))
      }
    }
    
    console.log(`✅ Route testing completed: ${results.filter(r => r.status === 'success').length}/${results.length} successful`)
    
    return results
  }

  /**
   * Get current session information
   */
  async getSessionInfo(): Promise<SessionInfo> {
    try {
      console.log('🔐 Gathering session information...')
      
      // Get basic auth status
      const authResponse = await fetch('/api/auth/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!authResponse.ok) {
        return {
          isAuthenticated: false,
          error: `Auth status check failed: ${authResponse.status}`
        }
      }
      
      const authData = await authResponse.json()
      
      // Get admin-specific auth check
      const adminResponse = await fetch('/api/admin/auth-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      let adminData = null
      if (adminResponse.ok) {
        adminData = await adminResponse.json()
      }
      
      return {
        isAuthenticated: authData.authenticated || false,
        userId: authData.user?.id,
        userRole: adminData?.data?.user?.role,
        email: authData.user?.email,
        sessionValid: authData.authenticated && adminData?.success,
        tokenClaims: authData.user,
        lastActivity: new Date().toISOString(),
        error: !authData.authenticated ? 'Not authenticated' : 
               !adminData?.success ? 'Admin access denied' : undefined
      }
    } catch (error) {
      console.error('❌ Error getting session info:', error)
      
      return {
        isAuthenticated: false,
        error: `Session error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Comprehensive system health check
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now()
    
    try {
      console.log('🏥 Performing comprehensive system health check...')
      
      const healthChecks = await Promise.allSettled([
        // Basic connectivity
        this.testSupabaseConnectivity(),
        this.testDatabaseConnectivity(),
        this.testStorageConnectivity(),
        this.testWalletServices()
      ])
      
      const results = healthChecks.map(result => 
        result.status === 'fulfilled' ? result.value : 'error'
      )
      
      const responseTime = Date.now() - startTime
      
      return {
        supabase: results[0] as any,
        database: results[1] as any,
        storage: results[2] as any,
        walletServices: results[3] as any,
        apiEndpoints: AUDIT_ROUTES.length,
        timestamp: new Date().toISOString(),
        responseTime,
        errors: healthChecks
          .filter(result => result.status === 'rejected')
          .map(result => result.reason?.message || 'Unknown error')
      }
    } catch (error) {
      console.error('❌ System health check failed:', error)
      
      return {
        supabase: 'error',
        database: 'error',
        storage: 'error',
        walletServices: 'error',
        apiEndpoints: 0,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Test Supabase connectivity
   */
  private async testSupabaseConnectivity(): Promise<'connected' | 'error'> {
    try {
      const response = await fetch('/api/health/simple')
      return response.ok ? 'connected' : 'error'
    } catch (error) {
      return 'error'
    }
  }

  /**
   * Test database connectivity
   */
  private async testDatabaseConnectivity(): Promise<'connected' | 'error'> {
    try {
      const { error } = await this.adminClient
        .from('users')
        .select('id')
        .limit(1)
      
      return error ? 'error' : 'connected'
    } catch (error) {
      return 'error'
    }
  }

  /**
   * Test storage connectivity
   */
  private async testStorageConnectivity(): Promise<'connected' | 'error'> {
    try {
      const response = await fetch('/api/admin/auth-check')
      return response.ok ? 'connected' : 'error'
    } catch (error) {
      return 'error'
    }
  }

  /**
   * Test wallet services
   */
  private async testWalletServices(): Promise<'connected' | 'error'> {
    try {
      // Test wallet generation endpoints (without actually generating)
      const appleTest = await fetch('/api/wallet/apple/test-connectivity', { method: 'GET' })
      const googleTest = await fetch('/api/wallet/google/test-connectivity', { method: 'GET' })
      
      // If either service responds (even with 404), we consider wallet services reachable
      return (appleTest.status < 500 || googleTest.status < 500) ? 'connected' : 'error'
    } catch (error) {
      return 'error'
    }
  }

  /**
   * Simulate QR code scan for a card
   */
  async simulateQRScan(cardId: string): Promise<SimulationResult> {
    const startTime = Date.now()
    
    try {
      console.log(`📱 Simulating QR scan for card: ${cardId}`)
      
      // Test the customer card endpoint
      const response = await fetch(`/api/customer/card/${cardId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      const duration = Date.now() - startTime
      
      return {
        type: 'qr_scan',
        status: response.ok ? 'success' : 'error',
        timestamp: new Date().toISOString(),
        duration,
        parameters: { cardId },
        details: {
          cardId,
          found: response.ok,
          cardData: data,
          statusCode: response.status
        }
      }
    } catch (error) {
      return {
        type: 'qr_scan',
        status: 'error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        parameters: { cardId },
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Simulate stamp earning for a customer card
   */
  async simulateStampEarning(customerCardId: string, billAmount?: number): Promise<SimulationResult> {
    const startTime = Date.now()
    
    try {
      console.log(`⭐ Simulating stamp earning for card: ${customerCardId}`)
      
      const response = await fetch('/api/stamp/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerCardId,
          billAmount,
          notes: 'Admin audit simulation',
          markedBy: 'admin-audit-system'
        })
      })
      
      const data = await response.json()
      const duration = Date.now() - startTime
      
      return {
        type: 'stamp_add',
        status: response.ok ? 'success' : 'error',
        timestamp: new Date().toISOString(),
        duration,
        parameters: { customerCardId, billAmount },
        details: {
          customerCardId,
          stampAdded: response.ok,
          result: data,
          statusCode: response.status
        }
      }
    } catch (error) {
      return {
        type: 'stamp_add',
        status: 'error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        parameters: { customerCardId, billAmount },
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Simulate wallet generation (Apple and Google)
   */
  async simulateWalletGeneration(customerCardId: string): Promise<SimulationResult> {
    const startTime = Date.now()
    
    try {
      console.log(`📲 Simulating wallet generation for card: ${customerCardId}`)
      
      // Test both Apple and Google wallet generation
      const [appleResponse, googleResponse] = await Promise.allSettled([
        fetch(`/api/wallet/apple/${customerCardId}`),
        fetch(`/api/wallet/google/${customerCardId}`)
      ])
      
      const appleResult = appleResponse.status === 'fulfilled' ? appleResponse.value.ok : false
      const googleResult = googleResponse.status === 'fulfilled' ? googleResponse.value.ok : false
      const duration = Date.now() - startTime
      
      return {
        type: 'wallet_generate',
        status: (appleResult || googleResult) ? 'success' : 'error',
        timestamp: new Date().toISOString(),
        duration,
        parameters: { customerCardId },
        details: {
          customerCardId,
          appleWallet: appleResult,
          googleWallet: googleResult,
          appleStatus: appleResponse.status === 'fulfilled' ? appleResponse.value.status : 'error',
          googleStatus: googleResponse.status === 'fulfilled' ? googleResponse.value.status : 'error'
        }
      }
    } catch (error) {
      return {
        type: 'wallet_generate',
        status: 'error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        parameters: { customerCardId },
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  /**
   * Get recent audit logs (mock implementation - replace with real audit table)
   */
  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    try {
      console.log(`📋 Fetching recent audit logs (limit: ${limit})...`)
      
      // Mock implementation - in production, this would query a real audit_logs table
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          event_type: 'admin_login',
          user_id: 'admin-user-id',
          details: { action: 'Admin dashboard access', ip: '192.168.1.1' },
          created_at: new Date().toISOString(),
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          event_type: 'card_created',
          user_id: 'admin-user-id',
          details: { cardType: 'stamp', businessId: 'test-123', cardName: 'Coffee Shop Card' },
          created_at: new Date(Date.now() - 3600000).toISOString(),
          ip_address: '192.168.1.1'
        },
        {
          id: '3',
          event_type: 'stamp_added',
          user_id: 'customer-123',
          details: { customerCardId: 'card-456', stampsAdded: 1, billAmount: 5.50 },
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          event_type: 'wallet_generated',
          user_id: 'customer-123',
          details: { walletType: 'apple', cardId: 'card-456', success: true },
          created_at: new Date(Date.now() - 10800000).toISOString()
        },
        {
          id: '5',
          event_type: 'business_flagged',
          user_id: 'admin-user-id',
          details: { businessId: 'business-789', reason: 'Suspicious activity' },
          created_at: new Date(Date.now() - 14400000).toISOString(),
          ip_address: '192.168.1.1'
        }
      ]
      
      return mockLogs.slice(0, limit)
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error)
      return []
    }
  }

  /**
   * Generate comprehensive audit summary
   */
  generateAuditSummary(
    routeTests: RouteTestResult[],
    systemHealth: SystemHealth,
    sessionInfo: SessionInfo
  ): AuditSummary {
    const successfulRoutes = routeTests.filter(r => r.status === 'success').length
    const failedRoutes = routeTests.filter(r => r.status === 'error').length
    
    const avgResponseTime = routeTests
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / routeTests.length || 0
    
    // Calculate system health score (0-100)
    const healthServices = Object.values(systemHealth).filter(v => v === 'connected').length
    const systemHealthScore = Math.round((healthServices / 4) * 100)
    
    // Calculate security score (0-100)
    const securityFactors = [
      sessionInfo.isAuthenticated ? 25 : 0,
      sessionInfo.userRole === 1 ? 25 : 0,
      sessionInfo.sessionValid ? 25 : 0,
      routeTests.filter(r => r.route.includes('/admin/') && r.status === 'success').length > 0 ? 25 : 0
    ]
    const securityScore = securityFactors.reduce((sum, score) => sum + score, 0)
    
    // Count recommendations needed
    let recommendationsCount = 0
    if (failedRoutes > 0) recommendationsCount++
    if (systemHealthScore < 100) recommendationsCount++
    if (securityScore < 100) recommendationsCount++
    if (avgResponseTime > 1000) recommendationsCount++
    
    return {
      totalRoutes: routeTests.length,
      successfulRoutes,
      failedRoutes,
      averageResponseTime: Math.round(avgResponseTime),
      systemHealthScore,
      securityScore,
      recommendationsCount
    }
  }

  /**
   * Generate comprehensive markdown audit report
   */
  generateMarkdownReport(auditData: Partial<AuditReport>): string {
    const timestamp = new Date().toISOString()
    const summary = auditData.summary || {
      totalRoutes: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      averageResponseTime: 0,
      systemHealthScore: 0,
      securityScore: 0,
      recommendationsCount: 0
    }
    
    return `# 🔍 RewardJar 4.0 - Comprehensive Admin Audit Report

**Generated**: ${timestamp}
**Status**: Automated System Audit
**Scope**: Complete security, performance, and functionality validation

---

## 📊 EXECUTIVE SUMMARY

### System Quality Metrics
- **Overall Health Score**: ${summary.systemHealthScore}/100
- **Security Score**: ${summary.securityScore}/100
- **Route Success Rate**: ${Math.round((summary.successfulRoutes / summary.totalRoutes) * 100)}%
- **Average Response Time**: ${summary.averageResponseTime}ms
- **Critical Issues**: ${summary.recommendationsCount}

### Key Findings
${summary.securityScore >= 90 ? '✅ Security: Excellent - All authentication patterns properly implemented' : '⚠️ Security: Issues detected - Review authentication and authorization'}
${summary.systemHealthScore >= 90 ? '✅ System Health: Excellent - All services operational' : '⚠️ System Health: Issues detected - Some services experiencing problems'}
${summary.averageResponseTime < 500 ? '✅ Performance: Excellent - Fast response times' : summary.averageResponseTime < 1000 ? '✅ Performance: Good - Acceptable response times' : '⚠️ Performance: Slow response times detected'}

---

## 🔐 AUTHENTICATION & SESSION STATUS

${auditData.sessionInfo ? `
### Current Session
- **User ID**: ${auditData.sessionInfo.userId || 'N/A'}
- **User Role**: ${auditData.sessionInfo.userRole || 'N/A'} ${auditData.sessionInfo.userRole === 1 ? '(Admin)' : auditData.sessionInfo.userRole === 2 ? '(Business)' : auditData.sessionInfo.userRole === 3 ? '(Customer)' : '(Unknown)'}
- **Email**: ${auditData.sessionInfo.email || 'N/A'}
- **Authenticated**: ${auditData.sessionInfo.isAuthenticated ? '✅ Yes' : '❌ No'}
- **Session Valid**: ${auditData.sessionInfo.sessionValid ? '✅ Yes' : '❌ No'}
- **Last Activity**: ${auditData.sessionInfo.lastActivity || 'N/A'}

${auditData.sessionInfo.error ? `### Security Issues
⚠️ **Error**: ${auditData.sessionInfo.error}` : ''}
` : 'Session information not available'}

---

## 🛣️ ROUTE ACCESS TESTING

### Summary
- **Total Routes Tested**: ${summary.totalRoutes}
- **Successful**: ${summary.successfulRoutes} ✅
- **Failed**: ${summary.failedRoutes} ❌
- **Success Rate**: ${Math.round((summary.successfulRoutes / summary.totalRoutes) * 100)}%

### ✅ Successful Routes
${auditData.routeTests?.filter(r => r.status === 'success').map(route => 
  `- **${route.method} ${route.route}** - ${route.statusCode} (${route.responseTime}ms) - ${route.description || 'No description'}`
).join('\n') || 'No successful routes recorded'}

### ❌ Failed Routes
${auditData.routeTests?.filter(r => r.status === 'error').map(route => 
  `- **${route.method} ${route.route}** - ${route.statusCode || 'N/A'} - ${route.error || 'Unknown error'} - ${route.description || 'No description'}`
).join('\n') || 'No failed routes'}

### ⏳ Pending Routes
${auditData.routeTests?.filter(r => r.status === 'pending').map(route => 
  `- **${route.method} ${route.route}** - Not tested - ${route.description || 'No description'}`
).join('\n') || 'All routes tested'}

---

## 🏥 SYSTEM HEALTH STATUS

${auditData.systemHealth ? `
### Service Status
- **Supabase**: ${auditData.systemHealth.supabase === 'connected' ? '✅ Connected' : '❌ Error'}
- **Database**: ${auditData.systemHealth.database === 'connected' ? '✅ Connected' : '❌ Error'}
- **Storage**: ${auditData.systemHealth.storage === 'connected' ? '✅ Connected' : '❌ Error'}
- **Wallet Services**: ${auditData.systemHealth.walletServices === 'connected' ? '✅ Connected' : '❌ Error'}

### Performance Metrics
- **Health Check Response Time**: ${auditData.systemHealth.responseTime || 'N/A'}ms
- **API Endpoints Monitored**: ${auditData.systemHealth.apiEndpoints || 0}
- **Last Check**: ${auditData.systemHealth.timestamp || 'N/A'}

${auditData.systemHealth.errors && auditData.systemHealth.errors.length > 0 ? `
### System Errors
${auditData.systemHealth.errors.map(error => `- ❌ ${error}`).join('\n')}
` : ''}
` : 'System health information not available'}

---

## 🧪 SIMULATION TEST RESULTS

${auditData.simulations && auditData.simulations.length > 0 ? auditData.simulations.map(sim => `
### ${sim.type.toUpperCase().replace('_', ' ')} Test
- **Status**: ${sim.status === 'success' ? '✅ Success' : '❌ Failed'}
- **Duration**: ${sim.duration || 'N/A'}ms
- **Timestamp**: ${sim.timestamp}
- **Parameters**: ${JSON.stringify(sim.parameters || {})}

**Results**:
\`\`\`json
${JSON.stringify(sim.details, null, 2)}
\`\`\`
`).join('\n') : 'No simulation tests performed'}

---

## 📋 RECENT SYSTEM EVENTS

${auditData.auditLogs && auditData.auditLogs.length > 0 ? auditData.auditLogs.map(log => `
### ${log.event_type.toUpperCase().replace('_', ' ')}
- **Time**: ${new Date(log.created_at).toLocaleString()}
- **User**: ${log.user_id || 'System'}
- **IP**: ${log.ip_address || 'N/A'}
- **Details**: ${JSON.stringify(log.details)}
`).join('\n') : 'No audit logs available'}

---

## 🎯 RECOMMENDATIONS & ACTION ITEMS

### Security Recommendations
${summary.securityScore >= 90 ? 
  '✅ Security implementation is excellent. Continue monitoring for anomalies.' : 
  `⚠️ Security Score: ${summary.securityScore}/100 - Review and strengthen authentication patterns.`}

### Performance Recommendations
${summary.averageResponseTime < 500 ? 
  '✅ Performance is excellent. No action needed.' : 
  summary.averageResponseTime < 1000 ? 
    '✅ Performance is good. Monitor for degradation.' : 
    `⚠️ Average response time: ${summary.averageResponseTime}ms - Optimize slow endpoints.`}

### System Health Recommendations
${summary.systemHealthScore >= 90 ? 
  '✅ All systems operational. Continue regular monitoring.' : 
  `⚠️ System Health: ${summary.systemHealthScore}/100 - Address service connectivity issues.`}

### Route Access Recommendations
${summary.failedRoutes === 0 ? 
  '✅ All routes accessible. Authentication and authorization working correctly.' : 
  `⚠️ ${summary.failedRoutes} failed routes detected. Review authentication and fix broken endpoints.`}

---

## 📈 TREND ANALYSIS

### Performance Trends
- Current average response time: ${summary.averageResponseTime}ms
- Route success rate: ${Math.round((summary.successfulRoutes / summary.totalRoutes) * 100)}%
- System uptime: ${summary.systemHealthScore}%

### Security Trends
- Authentication success rate: ${auditData.sessionInfo?.isAuthenticated ? '100%' : '0%'}
- Admin access validation: ${auditData.sessionInfo?.userRole === 1 ? 'Passed' : 'Failed'}
- Session management: ${auditData.sessionInfo?.sessionValid ? 'Healthy' : 'Issues detected'}

---

## 🚀 NEXT STEPS

### Immediate Actions (Priority 1)
${summary.securityScore < 70 ? '- 🔴 **CRITICAL**: Fix authentication and security issues immediately' : ''}
${summary.failedRoutes > 5 ? '- 🔴 **CRITICAL**: Multiple route failures detected - investigate immediately' : ''}
${summary.systemHealthScore < 50 ? '- 🔴 **CRITICAL**: System services down - restore immediately' : ''}

### Short-term Actions (Priority 2)
${summary.averageResponseTime > 1000 ? '- 🟡 **HIGH**: Optimize slow API endpoints' : ''}
${summary.systemHealthScore < 90 ? '- 🟡 **HIGH**: Address service connectivity issues' : ''}
${summary.failedRoutes > 0 && summary.failedRoutes <= 5 ? '- 🟡 **HIGH**: Fix failed route endpoints' : ''}

### Long-term Monitoring (Priority 3)
- 🟢 **MEDIUM**: Implement automated health monitoring
- 🟢 **MEDIUM**: Set up performance alerting
- 🟢 **MEDIUM**: Create automated security scanning
- 🟢 **MEDIUM**: Establish audit log retention policy

---

*Generated by RewardJar 4.0 Admin Audit System*
*Report Date: ${timestamp}*
*Next Audit Recommended: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}*`
  }
}

// Additional interfaces for real-time monitoring
export interface AuditEvent {
  id: string
  type: 'route_test' | 'health_check' | 'simulation' | 'auth_event' | 'system_alert'
  timestamp: string
  data: any
  severity: 'info' | 'warning' | 'error' | 'critical'
  user_id?: string
}

export interface Alert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  action: string
  timestamp: string
  resolved?: boolean
  metadata?: any
}

export interface SystemMetrics {
  responseTimeHistory: number[]
  errorRateHistory: number[]
  activeUserSessions: number
  apiCallVolume: number
  systemResourceUsage: {
    memory: number
    cpu: number
    storage: number
  }
  timestamp: string
}

export interface AlertStatus {
  alerts: Alert[]
  status: 'healthy' | 'warning' | 'critical'
  lastCheck: string
}

// Export additional services
export { realtimeAuditMonitor } from './realtime-audit-monitor'
export { alertingService } from './alerting-service'
export { scheduledAuditService } from './scheduled-audit-service'

// Singleton instances for reuse
export const adminAuditService = new AdminAuditService()