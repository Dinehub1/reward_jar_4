/**
 * Development mode utilities for RewardJar 4.0
 * Helps optimize developer tools behavior in different environments
 */

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Check if auto-refresh should be enabled for a specific feature
 */
export function shouldEnableAutoRefresh(featureName?: string): boolean {
  // In development, check localStorage for explicit enabling
  if (isDevelopment && typeof window !== 'undefined') {
    const key = featureName ? `auto-refresh-${featureName}` : 'auto-refresh-global'
    return localStorage.getItem(key) === 'true'
  }
  
  // In production, auto-refresh is enabled by default
  return isProduction
}

/**
 * Get appropriate polling interval for different environments
 */
export function getPollingInterval(defaultMs: number = 30000): number {
  if (isDevelopment) {
    // Longer intervals in development to reduce noise
    return Math.max(defaultMs * 2, 60000) // At least 1 minute
  }
  
  return defaultMs
}

/**
 * Check if health checks should run automatically
 */
export function shouldRunHealthChecks(): boolean {
  if (isDevelopment && typeof window !== 'undefined') {
    return localStorage.getItem('enable-health-checks') === 'true'
  }
  
  return isProduction
}

/**
 * Get appropriate timeout for operations in different environments
 */
export function getOperationTimeout(defaultMs: number = 10000): number {
  if (isDevelopment) {
    // Shorter timeouts in development for faster feedback
    return Math.min(defaultMs * 0.8, 8000)
  }
  
  return defaultMs
}

/**
 * Development mode configuration panel data
 */
export function getDevModeConfig() {
  if (typeof window === 'undefined') return null
  
  return {
    autoRefreshGlobal: localStorage.getItem('auto-refresh-global') === 'true',
    enableHealthChecks: localStorage.getItem('enable-health-checks') === 'true',
    autoRefreshDashboard: localStorage.getItem('auto-refresh-test-dashboard') === 'true',
    autoRefreshBusinesses: localStorage.getItem('auto-refresh-businesses') === 'true'
  }
}

/**
 * Toggle development mode setting
 */
export function toggleDevModeSetting(key: string, value?: boolean) {
  if (typeof window === 'undefined') return
  
  const newValue = value ?? (localStorage.getItem(key) !== 'true')
  localStorage.setItem(key, newValue.toString())
  
  // Trigger a custom event for components to listen to
  window.dispatchEvent(new CustomEvent('dev-mode-change', { 
    detail: { key, value: newValue } 
  }))
}