/**
 * RewardJar 4.0 - Alerting Service
 * System health monitoring and alert management
 * 
 * @version 4.0
 * @created January 2025
 */

import type { Alert, AlertStatus } from './admin-audit'
import { adminAuditService } from './admin-audit'

// Alerting service for system health monitoring
export class AlertingService {
  private alertThresholds = {
    responseTime: 1000, // ms
    errorRate: 0.05, // 5%
    failedAuthAttempts: 5,
    memoryUsage: 0.85, // 85%
    diskUsage: 0.90 // 90%
  }

  /**
   * Check system health and generate alerts
   */
  async checkSystemHealth(): Promise<AlertStatus> {
    try {
      const health = await adminAuditService.checkSystemHealth()
      const alerts: Alert[] = []
      
      // Performance alerts
      if (health.responseTime && health.responseTime > this.alertThresholds.responseTime) {
        alerts.push({
          id: `perf-${Date.now()}`,
          level: 'warning',
          message: `System response time above ${this.alertThresholds.responseTime}ms (${health.responseTime}ms)`,
          action: 'investigate_performance',
          timestamp: new Date().toISOString(),
          metadata: { responseTime: health.responseTime }
        })
      }

      // Service connectivity alerts
      const services = ['supabase', 'database', 'storage', 'walletServices'] as const
      const failedServices = services.filter(service => health[service] === 'error')
      
      if (failedServices.length > 0) {
        alerts.push({
          id: `service-${Date.now()}`,
          level: failedServices.length > 2 ? 'critical' : 'error',
          message: `Service connectivity issues: ${failedServices.join(', ')}`,
          action: 'restore_services',
          timestamp: new Date().toISOString(),
          metadata: { failedServices }
        })
      }

      // Error rate monitoring
      if (health.errors && health.errors.length > 0) {
        const errorRate = health.errors.length / health.apiEndpoints
        if (errorRate > this.alertThresholds.errorRate) {
          alerts.push({
            id: `error-rate-${Date.now()}`,
            level: 'warning',
            message: `High error rate detected: ${Math.round(errorRate * 100)}%`,
            action: 'investigate_errors',
            timestamp: new Date().toISOString(),
            metadata: { errorRate, errors: health.errors }
          })
        }
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (alerts.some(a => a.level === 'critical')) {
        status = 'critical'
      } else if (alerts.length > 0) {
        status = 'warning'
      }

      return {
        alerts,
        status,
        lastCheck: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Health check failed:', error)
      
      return {
        alerts: [{
          id: `health-check-error-${Date.now()}`,
          level: 'critical',
          message: 'Health check system failure',
          action: 'investigate_monitoring_system',
          timestamp: new Date().toISOString(),
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }],
        status: 'critical',
        lastCheck: new Date().toISOString()
      }
    }
  }

  /**
   * Send alert to notification channels
   */
  async sendAlert(alert: Alert): Promise<boolean> {
    try {
      const promises = []

      // Always send to Slack
      promises.push(
        fetch('/api/admin/alerts/slack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      )

      // Send critical and error alerts via email
      if (alert.level === 'critical' || alert.level === 'error') {
        promises.push(
          fetch('/api/admin/alerts/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert)
          })
        )
      }

      const results = await Promise.allSettled(promises)
      const failures = results.filter(r => r.status === 'rejected')
      
      if (failures.length > 0) {
        console.error('❌ Some alert notifications failed:', failures)
        return false
      }

      console.log('✅ Alert sent successfully:', alert.message)
      return true
    } catch (error) {
      console.error('❌ Failed to send alert:', error)
      return false
    }
  }

  /**
   * Create alert from system event
   */
  createAlert(
    level: Alert['level'],
    message: string,
    action: string,
    metadata?: any
  ): Alert {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      action,
      timestamp: new Date().toISOString(),
      metadata
    }
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds }
    console.log('✅ Alert thresholds updated:', this.alertThresholds)
  }

  /**
   * Get current alert thresholds
   */
  getThresholds(): typeof this.alertThresholds {
    return { ...this.alertThresholds }
  }

  /**
   * Check if alert level requires immediate attention
   */
  isUrgentAlert(alert: Alert): boolean {
    return alert.level === 'critical' || alert.level === 'error'
  }

  /**
   * Get alert severity score (0-100)
   */
  getAlertSeverity(alert: Alert): number {
    switch (alert.level) {
      case 'critical': return 100
      case 'error': return 75
      case 'warning': return 50
      case 'info': return 25
      default: return 0
    }
  }

  /**
   * Format alert for display
   */
  formatAlert(alert: Alert): string {
    const timestamp = new Date(alert.timestamp).toLocaleString()
    const emoji = this.getAlertEmoji(alert.level)
    
    return `${emoji} **${alert.level.toUpperCase()}** - ${alert.message}\n` +
           `*Time*: ${timestamp}\n` +
           `*Action*: ${alert.action}\n` +
           `*ID*: ${alert.id}`
  }

  /**
   * Get emoji for alert level
   */
  private getAlertEmoji(level: Alert['level']): string {
    switch (level) {
      case 'critical': return '🚨'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  /**
   * Batch send multiple alerts
   */
  async sendAlerts(alerts: Alert[]): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const alert of alerts) {
      const success = await this.sendAlert(alert)
      if (success) {
        sent++
      } else {
        failed++
      }
    }

    console.log(`📊 Alert batch complete: ${sent} sent, ${failed} failed`)
    return { sent, failed }
  }
}

// Singleton instance
export const alertingService = new AlertingService()