/**
 * Admin Events & Notification System
 * 
 * Centralized system for notifying admin users about system events,
 * deprecated endpoints, audit issues, and critical failures.
 */

import React from 'react'

export interface AdminEvent {
  id: string
  type: 'audit_issue' | 'endpoint_deprecated' | 'wallet_failure' | 'system_error' | 'cleanup_complete'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AdminNotificationOptions {
  toast?: boolean
  modal?: boolean
  email?: boolean
  log?: boolean
}

class AdminEventManager {
  private events: AdminEvent[] = []
  private listeners: Array<(event: AdminEvent) => void> = []

  /**
   * ✅ Log and notify admins of system events
   */
  async notifyAdmins(
    type: AdminEvent['type'],
    severity: AdminEvent['severity'],
    title: string,
    message: string,
    options: AdminNotificationOptions = { toast: true, log: true },
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AdminEvent = {
      id: `admin_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      metadata
    }

    // Store event
    this.events.push(event)

    // Notify listeners (for real-time UI updates)
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error("Error:", error)
      }
    })
    
    // Handle different notification types
    if (options.log) {
      this.logEvent(event)
    }

    if (options.toast && typeof window !== 'undefined') {
      this.showToast(event)
    }

    if (options.modal && typeof window !== 'undefined') {
      this.showModal(event)
    }

    if (options.email) {
      await this.sendEmailNotification(event)
    }

    // Store in database for audit trail
    await this.storeEventInDatabase(event)
  }

  /**
   * ✅ Console logging with proper formatting
   */
  private logEvent(event: AdminEvent): void {
    const logLevel = event.severity === 'critical' ? 'error' : 
                    event.severity === 'error' ? 'error' :
                    event.severity === 'warning' ? 'warn' : 'info'

    const logMessage = `🔧 ADMIN EVENT [${event.type.toUpperCase()}]: ${event.title} - ${event.message}`
    
    console[logLevel](logMessage, event.metadata)
  }

  /**
   * ✅ Toast notification (browser only)
   */
  private showToast(event: AdminEvent): void {
    // This would integrate with your toast library (e.g., react-hot-toast, sonner)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Browser notification as fallback
      if (Notification.permission === 'granted') {
        new Notification(`Admin: ${event.title}`, {
          body: event.message,
          icon: event.severity === 'critical' ? '🚨' : 
                event.severity === 'error' ? '❌' : 
                event.severity === 'warning' ? '⚠️' : 'ℹ️'
        })
      }
    }
  }

  /**
   * ✅ Modal notification (browser only)
   */
  private showModal(event: AdminEvent): void {
    if (typeof window !== 'undefined') {
      // This would integrate with your modal system
      
      // Simple alert as fallback for critical events
      if (event.severity === 'critical') {
        alert(`CRITICAL ADMIN EVENT: ${event.title}\n\n${event.message}`)
      }
    }
  }

  /**
   * ✅ Email notification to admin users
   */
  private async sendEmailNotification(event: AdminEvent): Promise<void> {
    try {
      // In a real implementation, this would use your email service
      
      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      // await emailService.sendToAdmins({
      //   subject: `Admin Alert: ${event.title}`,
      //   body: event.message,
      //   severity: event.severity
      // })
    } catch (error) {
        console.error("Error:", error)
      }
  }

  /**
   * ✅ Store event in database for audit trail
   * Only works in server-side contexts (API routes, server components)
   */
  private async storeEventInDatabase(event: AdminEvent): Promise<void> {
    try {
      // Only import and use admin client in server-side contexts
      if (typeof window !== 'undefined') {
        return
      }

      // Dynamic import to avoid loading admin client in browser
      const { createAdminClient } = await import('@/lib/supabase/admin-client')
      const adminClient = createAdminClient()
      
      // TODO: Create admin_events table in Supabase
      // await adminClient.from('admin_events').insert({
      //   id: event.id,
      //   type: event.type,
      //   severity: event.severity,
      //   title: event.title,
      //   message: event.message,
      //   timestamp: event.timestamp.toISOString(),
      //   metadata: event.metadata || {}
      // })
      
    } catch (error) {
        console.error("Error:", error)
      }
  }

  /**
   * ✅ Subscribe to admin events (for real-time UI)
   */
  subscribe(listener: (event: AdminEvent) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * ✅ Get recent events for admin dashboard
   */
  getRecentEvents(limit: number = 50): AdminEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * ✅ Clear old events (cleanup)
   */
  clearOldEvents(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge
    this.events = this.events.filter(event => event.timestamp.getTime() > cutoffTime)
  }
}

// Singleton instance
export const adminEvents = new AdminEventManager()

/**
 * ✅ Convenience functions for common admin notifications
 */
export const adminNotifications = {
  /**
   * Notify about audit issues found
   */
  auditIssue: (title: string, message: string, metadata?: Record<string, any>) => {
    return adminEvents.notifyAdmins('audit_issue', 'warning', title, message, 
      { toast: true, log: true }, metadata)
  },

  /**
   * Notify about deprecated endpoints
   */
  endpointDeprecated: (endpoint: string, replacement: string) => {
    return adminEvents.notifyAdmins('endpoint_deprecated', 'warning', 
      'Endpoint Deprecated', 
      `${endpoint} is deprecated. Use ${replacement} instead.`,
      { toast: true, log: true }, 
      { endpoint, replacement })
  },

  /**
   * Notify about wallet provisioning failures
   */
  walletFailure: (cardId: string, error: string) => {
    return adminEvents.notifyAdmins('wallet_failure', 'error',
      'Wallet Provisioning Failed',
      `Failed to provision wallet for card ${cardId}: ${error}`,
      { toast: true, log: true, email: true },
      { cardId, error })
  },

  /**
   * Notify about system errors
   */
  systemError: (component: string, error: string, metadata?: Record<string, any>) => {
    return adminEvents.notifyAdmins('system_error', 'critical',
      'System Error',
      `${component}: ${error}`,
      { toast: true, log: true, email: true, modal: true },
      { component, error, ...metadata })
  },

  /**
   * Notify about cleanup completion
   */
  cleanupComplete: (action: string, details: string) => {
    return adminEvents.notifyAdmins('cleanup_complete', 'info',
      'Cleanup Complete',
      `${action}: ${details}`,
      { toast: true, log: true },
      { action, details })
  }
}

/**
 * ✅ React hook for admin events (for UI components)
 */
export function useAdminEvents() {
  const [events, setEvents] = React.useState<AdminEvent[]>([])

  React.useEffect(() => {
    // Get initial events
    setEvents(adminEvents.getRecentEvents())

    // Subscribe to new events
    const unsubscribe = adminEvents.subscribe((event) => {
      setEvents(prev => [event, ...prev.slice(0, 49)]) // Keep latest 50
    })

    return unsubscribe
  }, [])

  return {
    events,
    clearOldEvents: () => adminEvents.clearOldEvents()
  }
}