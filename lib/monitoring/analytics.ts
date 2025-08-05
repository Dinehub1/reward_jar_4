/**
 * Analytics and Monitoring System for Card Creation
 * Tracks user behavior, performance metrics, and errors
 */

import { useState, useEffect } from 'react'

// Types for analytics events
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface CardCreationEvent extends AnalyticsEvent {
  cardId?: string
  businessId?: string
  templateUsed?: string
  stepCompleted?: number
  totalSteps?: number
  completionTime?: number
  errors?: string[]
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | '%'
  timestamp: number
  context?: Record<string, any>
}

// Analytics service class
class AnalyticsService {
  private sessionId: string
  private startTime: number
  private events: AnalyticsEvent[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Track card creation events
  trackCardCreationStarted(data: {
    templateUsed?: string
    businessType?: string
    source?: 'template' | 'scratch'
  }) {
    this.track('card_creation_started', {
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })
  }

  trackStepCompleted(step: number, data: {
    stepName: string
    timeSpent: number
    errors?: string[]
    formData?: Record<string, any>
  }) {
    this.track('card_creation_step_completed', {
      step,
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })
  }

  trackCardCreationCompleted(data: {
    cardId: string
    businessId: string
    templateUsed?: string
    totalTime: number
    totalSteps: number
    errors: string[]
    finalData: Record<string, any>
  }) {
    this.track('card_creation_completed', {
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      success: true
    })
  }

  trackCardCreationAbandoned(data: {
    step: number
    stepName: string
    timeSpent: number
    reason?: string
    errors?: string[]
  }) {
    this.track('card_creation_abandoned', {
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })
  }

  trackTemplateUsage(templateId: string, data: {
    applied: boolean
    modified: boolean
    modifications?: string[]
  }) {
    this.track('template_usage', {
      templateId,
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })
  }

  trackPreviewInteraction(data: {
    walletType: 'apple' | 'google' | 'pwa'
    action: 'view' | 'toggle_back' | 'switch_wallet'
    step: number
  }) {
    this.track('preview_interaction', {
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })
  }

  trackAPICall(endpoint: string, data: {
    method: string
    status: number
    responseTime: number
    error?: string
    payload?: Record<string, any>
  }) {
    this.track('api_call', {
      endpoint,
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })
  }

  trackError(error: Error, context: {
    component: string
    action: string
    step?: number
    additionalData?: Record<string, any>
  }) {
    this.track('error_occurred', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context,
      sessionId: this.sessionId,
      timestamp: Date.now()
    })

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics Error:', error, context)
    }
  }

  // Performance monitoring
  trackPerformanceMetric(metric: PerformanceMetric) {
    this.track('performance_metric', {
      ...metric,
      sessionId: this.sessionId
    })
  }

  // Core Web Vitals tracking
  trackWebVitals() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceMetric({
            name: 'LCP',
            value: entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            context: { url: window.location.pathname }
          })
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceMetric({
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            context: { url: window.location.pathname }
          })
        }
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this.trackPerformanceMetric({
              name: 'CLS',
              value: (entry as any).value,
              unit: 'count',
              timestamp: Date.now(),
              context: { url: window.location.pathname }
            })
          }
        }
      }).observe({ entryTypes: ['layout-shift'] })
    }
  }

  // Generic event tracking
  private track(event: string, properties: Record<string, any> = {}) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId
    }

    this.events.push(analyticsEvent)

    // Send to analytics service (implement based on your provider)
    this.sendToAnalytics(analyticsEvent)
  }

  private async sendToAnalytics(event: AnalyticsEvent) {
    try {
      // Google Analytics 4 example
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.event, {
          ...event.properties,
          session_id: event.sessionId,
          timestamp: event.timestamp
        })
      }

      // PostHog example
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture(event.event, event.properties)
      }

      // Custom analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        }).catch(console.error) // Fail silently to not break user experience
      }

    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  // Get session summary
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      events: this.events
    }
  }

  // Export data for debugging
  exportData() {
    return {
      session: this.getSessionSummary(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsService()

// React hook for analytics
export function useAnalytics() {
  useEffect(() => {
    // Initialize web vitals tracking
    analytics.trackWebVitals()
  }, [])

  return {
    trackCardCreationStarted: analytics.trackCardCreationStarted.bind(analytics),
    trackStepCompleted: analytics.trackStepCompleted.bind(analytics),
    trackCardCreationCompleted: analytics.trackCardCreationCompleted.bind(analytics),
    trackCardCreationAbandoned: analytics.trackCardCreationAbandoned.bind(analytics),
    trackTemplateUsage: analytics.trackTemplateUsage.bind(analytics),
    trackPreviewInteraction: analytics.trackPreviewInteraction.bind(analytics),
    trackAPICall: analytics.trackAPICall.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    getSessionSummary: analytics.getSessionSummary.bind(analytics),
    exportData: analytics.exportData.bind(analytics)
  }
}

// Error boundary component is now in separate file
// See: src/components/analytics/AnalyticsErrorBoundary.tsx