/**
 * RewardJar 4.0 - Real-time Audit Monitor
 * WebSocket-powered live monitoring for admin audit system
 * 
 * @version 4.0
 * @created January 2025
 */

import type { AuditEvent, Alert } from './admin-audit'

// Real-time monitoring class with WebSocket support
export class RealtimeAuditMonitor {
  private websocket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventListeners: Map<string, ((event: AuditEvent) => void)[]> = new Map()
  private isConnected = false

  constructor(private wsUrl?: string) {
    this.wsUrl = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  }

  /**
   * Start real-time monitoring with WebSocket connection
   */
  async startRealTimeMonitoring(): Promise<boolean> {
    try {
      console.log('🔄 Starting real-time audit monitoring...')
      
      if (typeof window === 'undefined') {
        console.warn('⚠️ WebSocket monitoring only available in browser environment')
        return false
      }

      this.websocket = new WebSocket(`${this.wsUrl}/admin-audit`)
      
      this.websocket.onopen = () => {
        console.log('✅ WebSocket connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Send authentication
        this.sendMessage({
          type: 'auth',
          token: this.getAuthToken()
        })
      }
      
      this.websocket.onmessage = (event) => {
        try {
          const auditEvent: AuditEvent = JSON.parse(event.data)
          this.handleRealTimeEvent(auditEvent)
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error)
        }
      }
      
      this.websocket.onclose = () => {
        console.log('🔌 WebSocket connection closed')
        this.isConnected = false
        this.attemptReconnect()
      }
      
      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.isConnected = false
      }

      return true
    } catch (error) {
      console.error('❌ Failed to start real-time monitoring:', error)
      return false
    }
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
      this.isConnected = false
    }
  }

  /**
   * Add event listener for specific event types
   */
  addEventListener(eventType: string, callback: (event: AuditEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(callback)
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, callback: (event: AuditEvent) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Handle incoming real-time events
   */
  private handleRealTimeEvent(event: AuditEvent): void {
    console.log(`📡 Real-time event: ${event.type}`, event)
    
    // Trigger specific event listeners
    const listeners = this.eventListeners.get(event.type) || []
    listeners.forEach(callback => callback(event))
    
    // Trigger general listeners
    const generalListeners = this.eventListeners.get('*') || []
    generalListeners.forEach(callback => callback(event))
    
    // Handle critical events
    if (event.severity === 'critical') {
      this.handleCriticalEvent(event)
    }
  }

  /**
   * Handle critical system events
   */
  private async handleCriticalEvent(event: AuditEvent): Promise<void> {
    console.error('🚨 CRITICAL EVENT:', event)
    
    // Trigger immediate alerts
    await this.sendAlert({
      id: `critical-${Date.now()}`,
      level: 'critical',
      message: `Critical system event: ${event.type}`,
      action: 'immediate_investigation_required',
      timestamp: new Date().toISOString(),
      metadata: event.data
    })
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: any): void {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify(message))
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.startRealTimeMonitoring()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('❌ Max reconnection attempts reached')
    }
  }

  /**
   * Get authentication token for WebSocket
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('supabase.auth.token') || null
    }
    return null
  }

  /**
   * Send alert to notification services
   */
  private async sendAlert(alert: Alert): Promise<void> {
    try {
      // Send to Slack
      await fetch('/api/admin/alerts/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      })

      // Send critical alerts via email
      if (alert.level === 'critical' || alert.level === 'error') {
        await fetch('/api/admin/alerts/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      }
    } catch (error) {
      console.error('❌ Failed to send alert:', error)
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts
    }
  }

  /**
   * Emit custom audit event
   */
  emitEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    }

    // Handle locally first
    this.handleRealTimeEvent(auditEvent)

    // Send to server if connected
    if (this.isConnected) {
      this.sendMessage({
        type: 'audit_event',
        event: auditEvent
      })
    }
  }
}

// Singleton instance
export const realtimeAuditMonitor = new RealtimeAuditMonitor()