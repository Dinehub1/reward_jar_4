/**
 * Environment Variables Validation for RewardJar 4.0
 * 
 * Validates required environment variables at startup to prevent runtime errors.
 * Called during application initialization to ensure all necessary configuration is present.
 */

interface EnvConfig {
  // Core Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // Application Configuration (Required)
  BASE_URL: string
  NEXT_PUBLIC_BASE_URL: string
  
  // Apple Wallet Configuration (Required for Production)
  APPLE_CERT_BASE64?: string
  APPLE_KEY_BASE64?: string
  APPLE_WWDR_BASE64?: string
  APPLE_CERT_PASSWORD?: string
  APPLE_TEAM_IDENTIFIER?: string
  APPLE_PASS_TYPE_IDENTIFIER?: string
  
  // Google Wallet Configuration (Required for Production)
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string
  GOOGLE_CLASS_ID?: string
  
  // MCP Integration (Optional)
  SUPABASE_ACCESS_TOKEN?: string
  
  // Optional Features
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string
  API_KEY?: string
}

interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  summary: {
    core: { required: number; present: number }
    apple: { required: number; present: number }
    google: { required: number; present: number }
    optional: { total: number; present: number }
  }
}

/**
 * Validates all environment variables required for RewardJar 4.0
 * @param env - Environment variables object (defaults to process.env)
 * @returns Validation result with detailed feedback
 */
export function validateEnvVars(env: Record<string, string | undefined> = process.env): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Core required variables
  const coreRequired = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'BASE_URL',
    'NEXT_PUBLIC_BASE_URL'
  ]
  
  // Apple Wallet variables (required for production wallet functionality)
  const appleRequired = [
    'APPLE_CERT_BASE64',
    'APPLE_KEY_BASE64', 
    'APPLE_WWDR_BASE64',
    'APPLE_CERT_PASSWORD',
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_PASS_TYPE_IDENTIFIER'
  ]
  
  // Google Wallet variables (required for production wallet functionality)
  const googleRequired = [
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    'GOOGLE_CLASS_ID'
  ]
  
  // Optional variables
  const optional = [
    'SUPABASE_ACCESS_TOKEN',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'API_KEY'
  ]
  
  // Validate core requirements
  let corePresent = 0
  for (const key of coreRequired) {
    if (!env[key]) {
      errors.push(`❌ CORE: ${key} is required but not set`)
    } else {
      corePresent++
    }
  }
  
  // Validate Apple Wallet configuration
  let applePresent = 0
  for (const key of appleRequired) {
    if (env[key]) {
      applePresent++
    }
  }
  
  if (applePresent > 0 && applePresent < appleRequired.length) {
    warnings.push(`⚠️ APPLE WALLET: Partial configuration (${applePresent}/${appleRequired.length}) - some Apple Wallet features may not work`)
  }
  
  // Validate Google Wallet configuration
  let googlePresent = 0
  for (const key of googleRequired) {
    if (env[key]) {
      googlePresent++
    }
  }
  
  if (googlePresent > 0 && googlePresent < googleRequired.length) {
    warnings.push(`⚠️ GOOGLE WALLET: Partial configuration (${googlePresent}/${googleRequired.length}) - some Google Wallet features may not work`)
  }
  
  // Count optional variables
  const optionalPresent = optional.filter(key => env[key]).length
  
  // Additional validations
  if (env.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('❌ NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
  }
  
  if (env.BASE_URL && !env.BASE_URL.startsWith('http')) {
    errors.push('❌ BASE_URL must be a valid HTTP/HTTPS URL')
  }
  
  if (env.NEXT_PUBLIC_BASE_URL && !env.NEXT_PUBLIC_BASE_URL.startsWith('http')) {
    errors.push('❌ NEXT_PUBLIC_BASE_URL must be a valid HTTP/HTTPS URL')
  }
  
  const success = errors.length === 0
  
  return {
    success,
    errors,
    warnings,
    summary: {
      core: { required: coreRequired.length, present: corePresent },
      apple: { required: appleRequired.length, present: applePresent },
      google: { required: googleRequired.length, present: googlePresent },
      optional: { total: optional.length, present: optionalPresent }
    }
  }
}

/**
 * Validates environment variables and throws an error if critical variables are missing
 * Use this at application startup to fail fast on configuration issues
 */
export function validateEnvVarsOrThrow(env?: Record<string, string | undefined>): void {
  const result = validateEnvVars(env)
  
  if (!result.success) {
    const errorMessage = [
      '🚨 ENVIRONMENT VALIDATION FAILED',
      '',
      'Missing required environment variables:',
      ...result.errors,
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See doc/doc2/3_SUPABASE_SETUP.md for complete setup instructions.'
    ].join('\n')
    
    throw new Error(errorMessage)
  }
  
  // Log warnings even on success
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => )
  }
  
  // Log success summary
  const { core, apple, google, optional } = result.summary
}

/**
 * Development helper to get a detailed environment report
 * @returns Formatted string with environment status
 */
export function getEnvReport(env?: Record<string, string | undefined>): string {
  const result = validateEnvVars(env)
  const { summary } = result
  
  const lines = [
    '🔍 ENVIRONMENT CONFIGURATION REPORT',
    '=' .repeat(50),
    '',
    `✅ Core Configuration: ${summary.core.present}/${summary.core.required} (${Math.round(summary.core.present / summary.core.required * 100)}%)`,
    `🍎 Apple Wallet: ${summary.apple.present}/${summary.apple.required} (${Math.round(summary.apple.present / summary.apple.required * 100)}%)`,
    `🤖 Google Wallet: ${summary.google.present}/${summary.google.required} (${Math.round(summary.google.present / summary.google.required * 100)}%)`,
    `⚙️ Optional Features: ${summary.optional.present}/${summary.optional.total} (${Math.round(summary.optional.present / summary.optional.total * 100)}%)`,
    '',
    `🎯 Overall Status: ${result.success ? '✅ READY' : '❌ NEEDS ATTENTION'}`
  ]
  
  if (result.errors.length > 0) {
    lines.push('', '❌ ERRORS:', ...result.errors.map(e => `  ${e}`))
  }
  
  if (result.warnings.length > 0) {
    lines.push('', '⚠️ WARNINGS:', ...result.warnings.map(w => `  ${w}`))
  }
  
  return lines.join('\n')
}

export default validateEnvVars