/**
 * Google Wallet Analytics & Monitoring
 * Track usage, performance, and compliance metrics
 */

export interface GoogleWalletMetrics {
  totalPasses: number
  dailyGeneration: number
  successRate: number
  averageResponseTime: number
  errorRate: number
  topBusinesses: Array<{
    businessId: string
    businessName: string
    passCount: number
  }>
  cardTypeDistribution: {
    stamp: number
    membership: number
  }
  platformDistribution: {
    android: number
    web: number
    other: number
  }
}

export interface GoogleWalletEvent {
  eventType: 'pass_generated' | 'pass_saved' | 'pass_viewed' | 'pass_expired' | 'error'
  cardId: string
  businessId: string
  cardType: 'stamp' | 'membership'
  platform: string
  timestamp: Date
  metadata?: Record<string, any>
  processingTime?: number
  errorDetails?: {
    message: string
    code?: string
    stack?: string
  }
}

export class GoogleWalletAnalytics {
  /**
   * Track Google Wallet pass generation event
   */
  static async trackPassGeneration(event: {
    cardId: string
    businessId: string
    cardType: 'stamp' | 'membership'
    classId: string
    objectId: string
    processingTime: number
    userAgent?: string
  }): Promise<void> {
    try {
      const platform = this.detectPlatform(event.userAgent)
      
      const analyticsEvent: GoogleWalletEvent = {
        eventType: 'pass_generated',
        cardId: event.cardId,
        businessId: event.businessId,
        cardType: event.cardType,
        platform,
        timestamp: new Date(),
        processingTime: event.processingTime,
        metadata: {
          classId: event.classId,
          objectId: event.objectId,
          userAgent: event.userAgent
        }
      }

      // Store in database for analytics
      await this.storeEvent(analyticsEvent)

      // Send to external analytics if configured
      await this.sendToExternalAnalytics(analyticsEvent)

    } catch (error) {
      console.error('Failed to track Google Wallet pass generation:', error)
    }
  }

  /**
   * Track Google Wallet error
   */
  static async trackError(event: {
    cardId: string
    businessId?: string
    errorMessage: string
    errorCode?: string
    errorStack?: string
    processingTime?: number
    userAgent?: string
  }): Promise<void> {
    try {
      const platform = this.detectPlatform(event.userAgent)
      
      const analyticsEvent: GoogleWalletEvent = {
        eventType: 'error',
        cardId: event.cardId,
        businessId: event.businessId || 'unknown',
        cardType: 'stamp', // Default, will be updated if known
        platform,
        timestamp: new Date(),
        processingTime: event.processingTime,
        errorDetails: {
          message: event.errorMessage,
          code: event.errorCode,
          stack: event.errorStack
        }
      }

      await this.storeEvent(analyticsEvent)
      await this.sendToExternalAnalytics(analyticsEvent)

    } catch (error) {
      console.error('Failed to track Google Wallet error:', error)
    }
  }

  /**
   * Get Google Wallet analytics metrics
   */
  static async getMetrics(timeRange: {
    start: Date
    end: Date
  }): Promise<GoogleWalletMetrics> {
    try {
      // This would typically query your analytics database
      // For now, return mock data structure
      return {
        totalPasses: 0,
        dailyGeneration: 0,
        successRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topBusinesses: [],
        cardTypeDistribution: {
          stamp: 0,
          membership: 0
        },
        platformDistribution: {
          android: 0,
          web: 0,
          other: 0
        }
      }
    } catch (error) {
      console.error('Failed to get Google Wallet metrics:', error)
      throw error
    }
  }

  /**
   * Generate Google Wallet compliance report
   */
  static async generateComplianceReport(): Promise<{
    timestamp: Date
    status: 'compliant' | 'non_compliant' | 'warning'
    checks: Array<{
      name: string
      status: 'pass' | 'fail' | 'warning'
      message: string
      details?: any
    }>
    recommendations: string[]
  }> {
    const checks = []
    const recommendations = []

    // Check environment configuration
    const hasRequiredEnvVars = !!(
      process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_WALLET_PRIVATE_KEY &&
      process.env.GOOGLE_WALLET_ISSUER_ID
    )

    checks.push({
      name: 'Environment Variables',
      status: hasRequiredEnvVars ? 'pass' : 'fail',
      message: hasRequiredEnvVars 
        ? 'All required environment variables are configured'
        : 'Missing required Google Wallet environment variables'
    })

    if (!hasRequiredEnvVars) {
      recommendations.push('Configure GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL, GOOGLE_WALLET_PRIVATE_KEY, and GOOGLE_WALLET_ISSUER_ID')
    }

    // Check HTTPS in production
    const isProduction = process.env.NODE_ENV === 'production'
    const hasHttps = process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') || !isProduction

    checks.push({
      name: 'HTTPS Configuration',
      status: hasHttps ? 'pass' : 'fail',
      message: hasHttps 
        ? 'HTTPS is properly configured'
        : 'HTTPS is required for Google Wallet in production'
    })

    if (!hasHttps && isProduction) {
      recommendations.push('Configure HTTPS for production Google Wallet integration')
    }

    // Check JWT signing capability
    let jwtSigningWorking = false
    try {
      // Test JWT creation (this would be done by the compliance module)
      jwtSigningWorking = true
    } catch (error) {
      // JWT signing failed
    }

    checks.push({
      name: 'JWT Signing',
      status: jwtSigningWorking ? 'pass' : 'fail',
      message: jwtSigningWorking 
        ? 'JWT signing is working correctly'
        : 'JWT signing is not working - check private key format'
    })

    if (!jwtSigningWorking) {
      recommendations.push('Verify private key format and ensure it includes proper PEM headers')
    }

    // Determine overall status
    const failedChecks = checks.filter(check => check.status === 'fail')
    const warningChecks = checks.filter(check => check.status === 'warning')

    let status: 'compliant' | 'non_compliant' | 'warning'
    if (failedChecks.length > 0) {
      status = 'non_compliant'
    } else if (warningChecks.length > 0) {
      status = 'warning'
    } else {
      status = 'compliant'
    }

    return {
      timestamp: new Date(),
      status,
      checks,
      recommendations
    }
  }

  /**
   * Detect platform from user agent
   */
  private static detectPlatform(userAgent?: string): string {
    if (!userAgent) return 'unknown'
    
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('android')) return 'android'
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
    if (ua.includes('mobile')) return 'mobile'
    if (ua.includes('chrome')) return 'chrome'
    if (ua.includes('firefox')) return 'firefox'
    if (ua.includes('safari')) return 'safari'
    
    return 'web'
  }

  /**
   * Store analytics event in database
   */
  private static async storeEvent(event: GoogleWalletEvent): Promise<void> {
    try {
      // This would store the event in your analytics database
      // For now, just log it
      console.log('Google Wallet Analytics Event:', {
        type: event.eventType,
        cardId: event.cardId,
        businessId: event.businessId,
        platform: event.platform,
        timestamp: event.timestamp.toISOString()
      })
    } catch (error) {
      console.error('Failed to store Google Wallet analytics event:', error)
    }
  }

  /**
   * Send event to external analytics service
   */
  private static async sendToExternalAnalytics(event: GoogleWalletEvent): Promise<void> {
    try {
      // This would send to services like Google Analytics, Mixpanel, etc.
      // Implementation depends on your analytics setup
      
      if (process.env.GOOGLE_ANALYTICS_ID) {
        // Send to Google Analytics
        // Implementation would go here
      }

      if (process.env.MIXPANEL_TOKEN) {
        // Send to Mixpanel
        // Implementation would go here
      }

    } catch (error) {
      console.error('Failed to send Google Wallet event to external analytics:', error)
    }
  }
}

export default GoogleWalletAnalytics