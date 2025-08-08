/**
 * RewardJar 4.0 - Scheduled Audit Service
 * Cron-like scheduled auditing with comprehensive reporting
 * 
 * @version 4.0
 * @created January 2025
 */

import { adminAuditService } from './admin-audit'
import { alertingService } from './alerting-service'

// Scheduled audit service with cron-like functionality
export class ScheduledAuditService {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false
  private auditHistory: any[] = []

  /**
   * Start the scheduled audit service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scheduled audit service already running')
      return
    }

    console.log('🕐 Starting scheduled audit service...')
    this.isRunning = true
    
    await this.setupDefaultSchedules()
  }

  /**
   * Stop the scheduled audit service
   */
  stop(): void {
    console.log('🛑 Stopping scheduled audit service...')
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval)
      console.log(`✅ Stopped scheduled audit: ${name}`)
    })
    
    this.intervals.clear()
    this.isRunning = false
  }

  /**
   * Schedule a custom audit
   */
  scheduleAudit(
    name: string, 
    intervalMs: number, 
    auditFunction: () => Promise<void>
  ): void {
    if (this.intervals.has(name)) {
      console.log(`⚠️ Audit '${name}' already scheduled, replacing...`)
      clearInterval(this.intervals.get(name)!)
    }

    const interval = setInterval(async () => {
      try {
        console.log(`🔄 Running scheduled audit: ${name}`)
        await auditFunction()
        console.log(`✅ Completed scheduled audit: ${name}`)
      } catch (error) {
        console.error(`❌ Scheduled audit failed: ${name}`, error)
        
        // Create alert for failed audit
        const alert = alertingService.createAlert(
          'error',
          `Scheduled audit failed: ${name}`,
          'investigate_audit_failure',
          { auditName: name, error: error instanceof Error ? error.message : 'Unknown error' }
        )
        
        await alertingService.sendAlert(alert)
      }
    }, intervalMs)

    this.intervals.set(name, interval)
    console.log(`📅 Scheduled audit '${name}' every ${intervalMs}ms`)
  }

  /**
   * Setup default audit schedules
   */
  private async setupDefaultSchedules(): Promise<void> {
    // Health check every 5 minutes (300,000ms)
    this.scheduleAudit('health-check', 5 * 60 * 1000, async () => {
      const healthStatus = await alertingService.checkSystemHealth()
      
      // Store health check result
      await this.storeAuditResult('health-check', {
        status: healthStatus.status,
        alertCount: healthStatus.alerts.length,
        alerts: healthStatus.alerts,
        timestamp: new Date().toISOString()
      })
      
      // Send alerts if any issues found
      if (healthStatus.alerts.length > 0) {
        await alertingService.sendAlerts(healthStatus.alerts)
      }
    })

    // Route testing every 30 minutes (1,800,000ms)
    this.scheduleAudit('route-testing', 30 * 60 * 1000, async () => {
      const routeTests = await adminAuditService.testAllRoutes(50) // Faster testing
      const failedRoutes = routeTests.filter(r => r.status === 'error')
      
      await this.storeAuditResult('route-testing', {
        totalRoutes: routeTests.length,
        successfulRoutes: routeTests.filter(r => r.status === 'success').length,
        failedRoutes: failedRoutes.length,
        averageResponseTime: this.calculateAverageResponseTime(routeTests),
        timestamp: new Date().toISOString()
      })

      // Alert on failed routes
      if (failedRoutes.length > 0) {
        const alert = alertingService.createAlert(
          failedRoutes.length > 3 ? 'critical' : 'warning',
          `${failedRoutes.length} routes failing`,
          'investigate_route_failures',
          { failedRoutes: failedRoutes.map(r => r.route) }
        )
        
        await alertingService.sendAlert(alert)
      }
    })

    // Comprehensive system audit every hour (3,600,000ms)
    this.scheduleAudit('comprehensive-audit', 60 * 60 * 1000, async () => {
      const auditResults = await this.runComprehensiveAudit()
      await this.storeAuditResult('comprehensive-audit', auditResults)

      // Check for critical issues in comprehensive audit
      if (auditResults.summary.systemHealthScore < 70) {
        const alert = alertingService.createAlert(
          'critical',
          `System health score critically low: ${auditResults.summary.systemHealthScore}%`,
          'immediate_system_investigation',
          { healthScore: auditResults.summary.systemHealthScore }
        )
        
        await alertingService.sendAlert(alert)
      }
    })

    // Daily audit report (86,400,000ms) - Run at 2 AM
    const now = new Date()
    const tomorrow2AM = new Date(now)
    tomorrow2AM.setDate(tomorrow2AM.getDate() + 1)
    tomorrow2AM.setHours(2, 0, 0, 0)
    
    const msUntil2AM = tomorrow2AM.getTime() - now.getTime()
    
    setTimeout(() => {
      // Run daily report immediately, then every 24 hours
      this.scheduleAudit('daily-report', 24 * 60 * 60 * 1000, async () => {
        const report = await this.generateDailyReport()
        await this.emailDailyReport(report)
      })
      
      // Run the first daily report
      this.generateDailyReport().then(report => this.emailDailyReport(report))
    }, msUntil2AM)
  }

  /**
   * Run comprehensive audit of all systems
   */
  private async runComprehensiveAudit(): Promise<any> {
    console.log('🔍 Running comprehensive system audit...')
    
    const [routeTests, systemHealth, sessionInfo] = await Promise.all([
      adminAuditService.testAllRoutes(50), // Faster testing for scheduled runs
      adminAuditService.checkSystemHealth(),
      adminAuditService.getSessionInfo()
    ])

    const auditResults = {
      timestamp: new Date().toISOString(),
      routeTests,
      systemHealth,
      sessionInfo,
      summary: adminAuditService.generateAuditSummary(routeTests, systemHealth, sessionInfo)
    }

    return auditResults
  }

  /**
   * Store audit result in database
   */
  private async storeAuditResult(auditType: string, results: any): Promise<void> {
    try {
      const response = await fetch('/api/admin/audit-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_type: auditType,
          results,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to store audit result: ${response.status}`)
      }

      // Also store in memory for immediate access
      this.auditHistory.unshift({
        audit_type: auditType,
        results,
        timestamp: new Date().toISOString()
      })

      // Keep only last 100 entries in memory
      if (this.auditHistory.length > 100) {
        this.auditHistory = this.auditHistory.slice(0, 100)
      }

      console.log(`✅ Stored audit result: ${auditType}`)
    } catch (error) {
      console.error(`❌ Failed to store audit result: ${auditType}`, error)
    }
  }

  /**
   * Generate daily audit report
   */
  private async generateDailyReport(): Promise<string> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    try {
      // Fetch yesterday's audit data
      const response = await fetch(`/api/admin/audit-history?date=${yesterday.toISOString().split('T')[0]}`)
      const auditHistory = await response.json()
      
      // Generate comprehensive report
      const reportData = {
        timestamp: new Date().toISOString(),
        auditHistory: auditHistory.data || [],
        summary: this.generateDailySummary(auditHistory.data || [])
      }

      return adminAuditService.generateMarkdownReport(reportData)
    } catch (error) {
      console.error('❌ Failed to generate daily report:', error)
      
      // Generate basic report with available data
      return this.generateBasicDailyReport()
    }
  }

  /**
   * Generate basic daily report when API fails
   */
  private generateBasicDailyReport(): string {
    const recentAudits = this.auditHistory.slice(0, 20)
    const timestamp = new Date().toISOString()
    
    return `# 📊 RewardJar 4.0 - Daily Audit Report (Fallback)

**Generated**: ${timestamp}
**Status**: Basic report due to API limitations
**Data Source**: In-memory audit history

## Summary
- Recent audits processed: ${recentAudits.length}
- System monitoring: Active
- Alert system: Operational

## Recent Activity
${recentAudits.map(audit => `- ${audit.audit_type}: ${audit.timestamp}`).join('\n')}

---
*Generated by RewardJar 4.0 Scheduled Audit System*`
  }

  /**
   * Email daily report to administrators
   */
  private async emailDailyReport(report: string): Promise<void> {
    try {
      const alert = alertingService.createAlert(
        'info',
        'Daily System Audit Report',
        'review_daily_metrics',
        {
          type: 'daily_report',
          report,
          reportDate: new Date().toISOString().split('T')[0]
        }
      )

      await alertingService.sendAlert(alert)
      console.log('✅ Daily report emailed successfully')
    } catch (error) {
      console.error('❌ Failed to email daily report:', error)
    }
  }

  /**
   * Generate daily summary from audit history
   */
  private generateDailySummary(auditHistory: any[]): any {
    const healthChecks = auditHistory.filter(a => a.audit_type === 'health-check')
    const routeTests = auditHistory.filter(a => a.audit_type === 'route-testing')
    
    return {
      totalAudits: auditHistory.length,
      healthChecks: healthChecks.length,
      routeTests: routeTests.length,
      averageResponseTime: this.calculateAverageFromHistory(routeTests, 'averageResponseTime'),
      systemUptime: this.calculateUptime(healthChecks),
      criticalIssues: auditHistory.filter(a => a.results?.status === 'critical').length,
      warningIssues: auditHistory.filter(a => a.results?.status === 'warning').length
    }
  }

  /**
   * Calculate average response time from route tests
   */
  private calculateAverageResponseTime(routeTests: any[]): number {
    const responseTimes = routeTests
      .map(r => r.responseTime)
      .filter(t => typeof t === 'number')
    
    return responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0
  }

  /**
   * Calculate average value from audit history
   */
  private calculateAverageFromHistory(history: any[], field: string): number {
    const values = history.map(h => h.results?.[field]).filter(v => typeof v === 'number')
    return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
  }

  /**
   * Calculate system uptime percentage
   */
  private calculateUptime(healthChecks: any[]): number {
    const healthyChecks = healthChecks.filter(h => h.results?.status === 'healthy').length
    return healthChecks.length > 0 ? Math.round((healthyChecks / healthChecks.length) * 100) : 0
  }

  /**
   * Get recent audit history
   */
  getRecentAudits(limit = 20): any[] {
    return this.auditHistory.slice(0, limit)
  }

  /**
   * Get service status
   */
  getStatus(): { 
    running: boolean
    scheduledAudits: string[]
    totalAuditsRun: number
    lastAuditTime: string | null
  } {
    return {
      running: this.isRunning,
      scheduledAudits: Array.from(this.intervals.keys()),
      totalAuditsRun: this.auditHistory.length,
      lastAuditTime: this.auditHistory.length > 0 ? this.auditHistory[0].timestamp : null
    }
  }

  /**
   * Force run specific audit
   */
  async forceRunAudit(auditName: string): Promise<boolean> {
    try {
      console.log(`🚀 Force running audit: ${auditName}`)
      
      switch (auditName) {
        case 'health-check':
          const healthStatus = await alertingService.checkSystemHealth()
          await this.storeAuditResult('health-check', healthStatus)
          break
          
        case 'route-testing':
          const routeTests = await adminAuditService.testAllRoutes()
          await this.storeAuditResult('route-testing', {
            totalRoutes: routeTests.length,
            results: routeTests,
            timestamp: new Date().toISOString()
          })
          break
          
        case 'comprehensive-audit':
          const auditResults = await this.runComprehensiveAudit()
          await this.storeAuditResult('comprehensive-audit', auditResults)
          break
          
        case 'daily-report':
          const report = await this.generateDailyReport()
          await this.emailDailyReport(report)
          break
          
        default:
          throw new Error(`Unknown audit type: ${auditName}`)
      }
      
      console.log(`✅ Force run completed: ${auditName}`)
      return true
    } catch (error) {
      console.error(`❌ Force run failed: ${auditName}`, error)
      return false
    }
  }
}

// Singleton instance
export const scheduledAuditService = new ScheduledAuditService()