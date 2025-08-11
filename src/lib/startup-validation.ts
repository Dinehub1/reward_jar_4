/**
 * Server-Side Startup Validation for RewardJar 4.0
 * 
 * This module performs critical environment validation during server startup
 * to ensure all required variables are present before the application starts.
 */

import { validateEnvVarsOrThrow, getEnvReport } from '@/lib/env-validation'

/**
 * Validates environment variables at server startup
 * This should be called early in the application lifecycle
 */
export function validateServerEnvironment(): void {
  try {
    // Validate all environment variables
    validateEnvVarsOrThrow()
    
    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      
      // Show detailed report in development
      const report = getEnvReport()
    } else {
      // Production: Just log basic success
    }
  } catch (error) {
    // Log the error and re-throw to prevent server startup
    
    // In production, we want to fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1) // Exit the process to prevent deployment with invalid config
    }
    
    // Re-throw the error to be handled by the application
    throw error
  }
}

/**
 * Validates specific environment variables for a given context
 * @param context - The context requiring validation (e.g., 'admin', 'wallet', 'auth')
 * @param requiredVars - Array of required environment variable names
 */
export function validateContextEnvironment(context: string, requiredVars: string[]): void {
  const missing: string[] = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    const error = new Error(
      `🚨 ${context.toUpperCase()} CONTEXT ERROR: Missing required environment variables: ${missing.join(', ')}`
    )
    
    throw error
  }
  
  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * Validates environment for admin operations
 * Called before admin routes are accessed
 */
export function validateAdminEnvironment(): void {
  validateContextEnvironment('admin', [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ])
}

/**
 * Validates environment for wallet operations
 * Called before wallet generation routes are accessed
 */
export function validateWalletEnvironment(): void {
  const requiredForWallet = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  // Apple Wallet specific validation
  const appleVars = [
    'APPLE_CERT_BASE64',
    'APPLE_KEY_BASE64',
    'APPLE_WWDR_BASE64',
    'APPLE_CERT_PASSWORD',
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_PASS_TYPE_IDENTIFIER'
  ]
  
  // Google Wallet specific validation
  const googleVars = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_CLASS_ID'
  ]
  
  // Check core wallet requirements
  validateContextEnvironment('wallet-core', requiredForWallet)
  
  // Check if at least one wallet type is configured
  const appleConfigured = appleVars.every(varName => process.env[varName])
  const googleConfigured = googleVars.every(varName => process.env[varName])
  
  if (!appleConfigured && !googleConfigured) {
    throw new Error(
      '🚨 WALLET ENVIRONMENT ERROR: At least one wallet type (Apple or Google) must be fully configured'
    )
  }
  
  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * Health check function that returns environment status
 * Used by health check endpoints
 */
export function getEnvironmentHealth() {
  try {
    const report = getEnvReport()
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      report: report
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default validateServerEnvironment