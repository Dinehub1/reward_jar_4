/**
 * Server-Side Startup Validation for RewardJar 4.0
 * 
 * This module performs critical environment validation during server startup
 * to ensure all required variables are present before the application starts.
 */

import { validateEnvVarsOrThrow as validateEnvVarsOrThrowExternal, getEnvReport } from '@/lib/env-validation'

/**
 * Validates environment variables at server startup
 * This should be called early in the application lifecycle
 */
export function validateServerEnvironment(): void {
  try {
    // Validate all environment variables
    validateEnvVarsOrThrowExternal()
    
    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SERVER ENVIRONMENT VALIDATION: All critical variables present')
      
      // Show detailed report in development
      const report = getEnvReport()
      console.log(report)
    } else {
      // Production: Just log basic success
      console.log('✅ Environment validation passed')
    }
  } catch (error) {
    // Log the error and re-throw to prevent server startup
    console.error('🚨 SERVER STARTUP FAILED - Environment validation error:')
    console.error(error instanceof Error ? error.message : 'Unknown validation error')
    
    // In production, we want to fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Production deployment blocked due to missing environment variables')
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
    
    console.error(error.message)
    throw error
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ ${context.toUpperCase()} CONTEXT: Environment validation passed`)
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
    console.log(`✅ WALLET ENVIRONMENT: ${appleConfigured ? 'Apple ✅' : 'Apple ❌'} ${googleConfigured ? 'Google ✅' : 'Google ❌'}`)
  }
}

/**
 * Fail-fast env validation gate for production boot
 * Throws an Error with actionable message if critical vars are missing
 */
export function validateEnvVarsOrThrow() {
  const isProd = process.env.NODE_ENV === 'production'
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please set them in your production environment.`
    )
  }
  if (isProd && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Service role key must never be exposed with NEXT_PUBLIC_. Remove NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  // Optional but recommended flags
  if (isProd && process.env.DISABLE_LEGACY_ADMIN_ENDPOINTS !== 'true') {
    console.warn('DISABLE_LEGACY_ADMIN_ENDPOINTS is not set to true in production.')
  }

  // Google Wallet readiness (optional, but warn if enabled and missing pieces)
  const googleEnabled = process.env.DISABLE_GOOGLE_WALLET !== 'true'
  if (googleEnabled) {
    const need = ['GOOGLE_SERVICE_ACCOUNT_JSON', 'GOOGLE_WALLET_ISSUER_ID']
    const missingGoogle = need.filter((k) => !process.env[k])
    if (missingGoogle.length > 0) {
      console.warn(`Google Wallet enabled but missing: ${missingGoogle.join(', ')}`)
    }
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