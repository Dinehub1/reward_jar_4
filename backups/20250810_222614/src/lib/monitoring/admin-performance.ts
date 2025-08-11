/**
 * Admin Dashboard Performance Monitoring
 * 
 * Tracks performance metrics and provides insights for optimization
 * Helps identify bottlenecks in data synchronization
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  metadata?: Record<string, any>
}

interface CacheMetrics {
  hit: number
  miss: number
  invalidations: number
  errors: number
}

class AdminPerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private cacheMetrics: CacheMetrics = {
    hit: 0,
    miss: 0,
    invalidations: 0,
    errors: 0
  }

  /**
   * Record API response time
   */
  recordApiResponseTime(endpoint: string, responseTime: number, success: boolean) {
    this.metrics.push({
      name: 'api_response_time',
      value: responseTime,
      timestamp: new Date(),
      metadata: { endpoint, success }
    })

    // Log slow queries (>2 seconds)
    if (responseTime > 2000) {
      console.warn(`🐌 Slow API response detected: ${endpoint} took ${responseTime}ms`)
    }

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  /**
   * Record SWR cache performance
   */
  recordCacheEvent(type: 'hit' | 'miss' | 'invalidation' | 'error', key: string) {
    if (type === 'error') {
      this.cacheMetrics.errors++
    } else if (type === 'invalidation') {
      this.cacheMetrics.invalidations++
    } else {
      this.cacheMetrics[type]++
    }
    
    console.log(`📊 Cache ${type}: ${key}`)
    
    this.metrics.push({
      name: `cache_${type}`,
      value: 1,
      timestamp: new Date(),
      metadata: { key }
    })
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(table: string, queryTime: number, recordCount: number) {
    this.metrics.push({
      name: 'database_query_time',
      value: queryTime,
      timestamp: new Date(),
      metadata: { table, recordCount }
    })

    // Log slow database queries (>1 second)
    if (queryTime > 1000) {
      console.warn(`🐌 Slow database query: ${table} took ${queryTime}ms for ${recordCount} records`)
    }
  }

  /**
   * Record real-time sync latency
   */
  recordSyncLatency(event: string, latency: number) {
    this.metrics.push({
      name: 'sync_latency',
      value: latency,
      timestamp: new Date(),
      metadata: { event }
    })

    // Log high sync latency (>5 seconds)
    if (latency > 5000) {
      console.warn(`🐌 High sync latency: ${event} took ${latency}ms`)
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo)
    
    const apiResponseTimes = recentMetrics
      .filter(m => m.name === 'api_response_time')
      .map(m => m.value)
    
    const dbQueryTimes = recentMetrics
      .filter(m => m.name === 'database_query_time')
      .map(m => m.value)
    
    const syncLatencies = recentMetrics
      .filter(m => m.name === 'sync_latency')
      .map(m => m.value)

    return {
      cache: {
        ...this.cacheMetrics,
        hitRate: this.cacheMetrics.hit / (this.cacheMetrics.hit + this.cacheMetrics.miss) || 0
      },
      api: {
        averageResponseTime: apiResponseTimes.length > 0 
          ? apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length 
          : 0,
        slowQueries: apiResponseTimes.filter(t => t > 2000).length,
        totalRequests: apiResponseTimes.length
      },
      database: {
        averageQueryTime: dbQueryTimes.length > 0 
          ? dbQueryTimes.reduce((a, b) => a + b, 0) / dbQueryTimes.length 
          : 0,
        slowQueries: dbQueryTimes.filter(t => t > 1000).length,
        totalQueries: dbQueryTimes.length
      },
      sync: {
        averageLatency: syncLatencies.length > 0 
          ? syncLatencies.reduce((a, b) => a + b, 0) / syncLatencies.length 
          : 0,
        highLatencyEvents: syncLatencies.filter(l => l > 5000).length,
        totalSyncEvents: syncLatencies.length
      },
      timestamp: now
    }
  }

  /**
   * Reset metrics (for testing or periodic cleanup)
   */
  reset() {
    this.metrics = []
    this.cacheMetrics = {
      hit: 0,
      miss: 0,
      invalidations: 0,
      errors: 0
    }
  }
}

// Global performance monitor instance
export const adminPerformanceMonitor = new AdminPerformanceMonitor()

/**
 * Performance monitoring decorator for API calls
 */
export function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now()
  
  return operation()
    .then(result => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      adminPerformanceMonitor.recordApiResponseTime(operationName, duration, true)
      
      return result
    })
    .catch(error => {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      adminPerformanceMonitor.recordApiResponseTime(operationName, duration, false)
      
      throw error
    })
}

/**
 * Hook for accessing performance metrics in components
 */
export function useAdminPerformanceMetrics() {
  const getMetrics = () => adminPerformanceMonitor.getPerformanceSummary()
  
  return {
    getMetrics,
    recordCacheEvent: (type: 'hit' | 'miss' | 'invalidation' | 'error', key: string) =>
      adminPerformanceMonitor.recordCacheEvent(type, key),
    recordSyncLatency: (event: string, latency: number) =>
      adminPerformanceMonitor.recordSyncLatency(event, latency)
  }
}