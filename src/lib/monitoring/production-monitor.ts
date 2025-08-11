/**
 * 🔍 PRODUCTION MONITORING SYSTEM
 * 
 * Comprehensive monitoring, logging, and alerting for RewardJar
 * Supports performance tracking, error monitoring, and health checks
 */

import { getEnvironmentConfig } from '@/lib/config/environment';
import { captureRewardJarError, capturePerformanceMetric, ErrorCategory } from './sentry-config';

export interface PerformanceMetrics {
  authResponseTime: number
  walletGenerationTime: number
  databaseQueryTime: number
  apiResponseTime: number
  errorRate: number
  userSessions: number
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'offline'
  auth: 'healthy' | 'degraded' | 'offline'
  wallets: 'healthy' | 'partial' | 'offline'
  apis: 'healthy' | 'degraded' | 'offline'
  overall: 'healthy' | 'degraded' | 'offline'
}

class ProductionMonitor {
  private metrics: Map<string, number[]> = new Map();
  private isProduction: boolean;
  
  constructor() {
    const config = getEnvironmentConfig();
    this.isProduction = config.nodeEnv === 'production';
  }

  /**
   * Track authentication performance
   */
  trackAuthPerformance(operation: string, duration: number, success: boolean) {
    const metricName = `auth_${operation}`;
    this.addMetric(metricName, duration);
    
    capturePerformanceMetric(metricName, duration, 'ms', {
      operation,
      success: success.toString(),
      component: 'authentication'
    });

    // Alert if auth is taking too long
    if (duration > 2000) {
      this.alertSlowOperation('authentication', operation, duration);
    }
  }

  /**
   * Track wallet generation performance
   */
  trackWalletPerformance(walletType: 'apple' | 'google' | 'pwa', duration: number, success: boolean) {
    const metricName = `wallet_${walletType}`;
    this.addMetric(metricName, duration);
    
    capturePerformanceMetric(metricName, duration, 'ms', {
      walletType,
      success: success.toString(),
      component: 'wallet'
    });

    // Alert if wallet generation is failing
    if (!success) {
      captureRewardJarError(
        new Error(`Wallet generation failed: ${walletType}`),
        {
          component: 'wallet',
          operation: 'generation',
          category: ErrorCategory.WALLET_ERROR,
          metadata: { walletType, duration }
        }
      );
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(table: string, operation: string, duration: number, success: boolean) {
    const metricName = `db_${table}_${operation}`;
    this.addMetric(metricName, duration);
    
    capturePerformanceMetric(metricName, duration, 'ms', {
      table,
      operation,
      success: success.toString(),
      component: 'database'
    });

    // Alert if queries are slow
    if (duration > 500) {
      this.alertSlowOperation('database', `${table}.${operation}`, duration);
    }
  }

  /**
   * Track API endpoint performance
   */
  trackApiEndpoint(endpoint: string, method: string, duration: number, statusCode: number) {
    const metricName = `api_${method}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    this.addMetric(metricName, duration);
    
    capturePerformanceMetric(metricName, duration, 'ms', {
      endpoint,
      method,
      statusCode: statusCode.toString(),
      component: 'api'
    });

    // Track error rates
    if (statusCode >= 400) {
      this.trackError('api', endpoint, statusCode);
    }
  }

  /**
   * Track user session events
   */
  trackUserSession(event: 'login' | 'logout' | 'session_refresh', userId?: string, userRole?: number) {
    capturePerformanceMetric(`user_${event}`, 1, 'count', {
      event,
      userRole: userRole?.toString() || 'unknown',
      component: 'user_session'
    });

    // Track session health
    if (event === 'login') {
      this.addMetric('user_logins', 1);
    }
  }

  /**
   * Monitor system health
   */
  async checkSystemHealth(): Promise<SystemHealth> {
    const results = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkAuthHealth(),
      this.checkWalletHealth(),
      this.checkApiHealth()
    ]);

    const [database, auth, wallets, apis] = results.map(r => 
      r.status === 'fulfilled' ? r.value : 'offline'
    ) as [SystemHealth['database'], SystemHealth['auth'], SystemHealth['wallets'], SystemHealth['apis']];

    const overall: SystemHealth['overall'] = 
      [database, auth, wallets, apis].every(s => s === 'healthy') ? 'healthy' :
      [database, auth, wallets, apis].some(s => s === 'offline') ? 'degraded' :
      'degraded';

    const health: SystemHealth = { database, auth, wallets, apis, overall };

    // Alert if system is degraded
    if (overall !== 'healthy') {
      captureRewardJarError(
        new Error(`System health degraded: ${overall}`),
        {
          component: 'system',
          operation: 'health_check',
          category: ErrorCategory.API_ERROR,
          metadata: health
        }
      );
    }

    return health;
  }

  /**
   * Get performance summary
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      authResponseTime: this.getAverageMetric('auth_role_lookup') || 0,
      walletGenerationTime: this.getAverageMetric('wallet_apple') || 0,
      databaseQueryTime: this.getAverageMetric('db_users_select') || 0,
      apiResponseTime: this.getAverageMetric('api_GET_admin') || 0,
      errorRate: this.getErrorRate(),
      userSessions: this.getMetricSum('user_logins') || 0
    };
  }

  // Private helper methods
  private addMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  private getAverageMetric(name: string): number | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private getMetricSum(name: string): number | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0);
  }

  private getErrorRate(): number {
    const errors = this.getMetricSum('errors') || 0;
    const total = this.getMetricSum('requests') || 1;
    return (errors / total) * 100;
  }

  private trackError(component: string, operation: string, code: number) {
    this.addMetric('errors', 1);
    this.addMetric('requests', 1);
    
    if (this.isProduction) {
      captureRewardJarError(
        new Error(`${component} error: ${operation} (${code})`),
        {
          component,
          operation,
          category: ErrorCategory.API_ERROR,
          metadata: { statusCode: code }
        }
      );
    }
  }

  private alertSlowOperation(component: string, operation: string, duration: number) {
    if (this.isProduction) {
      console.warn(`[PERFORMANCE ALERT] Slow ${component} operation: ${operation} took ${duration}ms`);
    }
  }

  private async checkDatabaseHealth(): Promise<SystemHealth['database']> {
    try {
      // This would typically make a quick health check query
      // For now, simulate based on recent metrics
      const avgQueryTime = this.getAverageMetric('db_users_select');
      if (!avgQueryTime) return 'healthy';
      return avgQueryTime < 100 ? 'healthy' : avgQueryTime < 500 ? 'degraded' : 'offline';
    } catch {
      return 'offline';
    }
  }

  private async checkAuthHealth(): Promise<SystemHealth['auth']> {
    try {
      const avgAuthTime = this.getAverageMetric('auth_role_lookup');
      if (!avgAuthTime) return 'healthy';
      return avgAuthTime < 200 ? 'healthy' : avgAuthTime < 1000 ? 'degraded' : 'offline';
    } catch {
      return 'offline';
    }
  }

  private async checkWalletHealth(): Promise<SystemHealth['wallets']> {
    try {
      // Check if wallet generation is working
      const appleMetric = this.getAverageMetric('wallet_apple');
      const googleMetric = this.getAverageMetric('wallet_google');
      
      if (!appleMetric && !googleMetric) return 'healthy'; // No data yet
      
      const working = [appleMetric, googleMetric].filter(m => m && m < 5000).length;
      const total = [appleMetric, googleMetric].filter(m => m).length;
      
      if (working === total) return 'healthy';
      if (working > 0) return 'partial';
      return 'offline';
    } catch {
      return 'offline';
    }
  }

  private async checkApiHealth(): Promise<SystemHealth['apis']> {
    try {
      const errorRate = this.getErrorRate();
      return errorRate < 5 ? 'healthy' : errorRate < 20 ? 'degraded' : 'offline';
    } catch {
      return 'offline';
    }
  }
}

// Singleton instance
export const productionMonitor = new ProductionMonitor();

// Helper functions for easy use across the app
export function trackAuth(operation: string, duration: number, success: boolean) {
  productionMonitor.trackAuthPerformance(operation, duration, success);
}

export function trackWallet(walletType: 'apple' | 'google' | 'pwa', duration: number, success: boolean) {
  productionMonitor.trackWalletPerformance(walletType, duration, success);
}

export function trackDatabase(table: string, operation: string, duration: number, success: boolean) {
  productionMonitor.trackDatabaseQuery(table, operation, duration, success);
}

export function trackApi(endpoint: string, method: string, duration: number, statusCode: number) {
  productionMonitor.trackApiEndpoint(endpoint, method, duration, statusCode);
}

export function trackUser(event: 'login' | 'logout' | 'session_refresh', userId?: string, userRole?: number) {
  productionMonitor.trackUserSession(event, userId, userRole);
}