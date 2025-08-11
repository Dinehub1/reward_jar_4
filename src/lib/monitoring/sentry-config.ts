/**
 * 🔍 SENTRY MONITORING CONFIGURATION
 * 
 * Production-ready error tracking and performance monitoring
 * Supports environment-specific configurations
 */

import { getEnvironmentConfig } from '@/lib/config/environment';

export interface SentryConfig {
  dsn?: string
  environment: string
  enableTracing: boolean
  tracesSampleRate: number
  enableErrorBoundaries: boolean
  enableApiMonitoring: boolean
}

/**
 * Get Sentry configuration based on environment
 */
export function getSentryConfig(): SentryConfig {
  const config = getEnvironmentConfig();
  
  return {
    dsn: config.monitoring.sentry,
    environment: config.nodeEnv,
    enableTracing: config.nodeEnv === 'production',
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    enableErrorBoundaries: true,
    enableApiMonitoring: config.nodeEnv !== 'development'
  };
}

/**
 * Check if Sentry is configured and enabled
 */
export function isSentryEnabled(): boolean {
  const config = getSentryConfig();
  return !!config.dsn && config.dsn.length > 0;
}

/**
 * Performance monitoring tags for RewardJar
 */
export const SENTRY_TAGS = {
  component: {
    auth: 'authentication',
    wallet: 'wallet-integration',
    admin: 'admin-panel',
    business: 'business-dashboard',
    customer: 'customer-experience'
  },
  operation: {
    login: 'user-login',
    roleCheck: 'role-verification',
    walletGeneration: 'wallet-generation',
    cardCreation: 'card-creation',
    dataFetch: 'data-fetching'
  }
} as const;

/**
 * Custom error types for better error categorization
 */
export enum ErrorCategory {
  AUTH_ERROR = 'authentication',
  WALLET_ERROR = 'wallet_integration', 
  DATABASE_ERROR = 'database',
  API_ERROR = 'api',
  VALIDATION_ERROR = 'validation',
  NETWORK_ERROR = 'network'
}

/**
 * RewardJar-specific error context
 */
export interface ErrorContext {
  userId?: string
  userRole?: number
  component: string
  operation: string
  category: ErrorCategory
  metadata?: Record<string, any>
}

/**
 * Environment-specific Sentry integration for Next.js
 */
export const sentryIntegrationConfig = {
  // Client-side configuration
  client: {
    beforeSend: (event: any, hint: any) => {
      // Filter out development noise
      if (getSentryConfig().environment === 'development') {
        // Only send errors, not debug info
        if (event.level === 'debug' || event.level === 'info') {
          return null;
        }
      }
      
      // Add RewardJar context
      if (event.tags) {
        event.tags.app = 'rewardjar';
        event.tags.version = '4.0';
      }
      
      return event;
    },
    
    tracesSampleRate: getSentryConfig().tracesSampleRate,
    
    // Performance monitoring
    integrations: [
      // Web Vitals for Core Web Vitals tracking
      // Router integration for navigation tracking
    ]
  },
  
  // Server-side configuration  
  server: {
    beforeSend: (event: any, hint: any) => {
      // Add server context
      if (event.tags) {
        event.tags.runtime = 'server';
        event.tags.app = 'rewardjar';
      }
      
      // Filter sensitive data
      if (event.request?.data) {
        // Remove sensitive fields
        const sanitized = { ...event.request.data };
        delete sanitized.password;
        delete sanitized.accessToken;
        delete sanitized.serviceRoleKey;
        event.request.data = sanitized;
      }
      
      return event;
    }
  }
};

/**
 * Helper function to capture RewardJar-specific errors
 */
export function captureRewardJarError(
  error: Error, 
  context: ErrorContext
) {
  if (!isSentryEnabled()) {
    console.error('[RewardJar Error]', error, context);
    return;
  }
  
  // This would be implemented when Sentry is actually installed
  console.error('[RewardJar Error - Sentry Ready]', error, context);
}

/**
 * Helper function to capture performance metrics
 */
export function capturePerformanceMetric(
  name: string,
  value: number,
  unit: 'ms' | 'count' | 'percentage' = 'ms',
  tags?: Record<string, string>
) {
  if (!isSentryEnabled()) {
    console.log(`[Performance] ${name}: ${value}${unit}`, tags);
    return;
  }
  
  // This would be implemented when Sentry is actually installed
  console.log(`[Performance - Sentry Ready] ${name}: ${value}${unit}`, tags);
}