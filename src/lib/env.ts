// Centralized environment configuration for RewardJar 4.0
// This file exports all environment variables with validation

// Core Application Variables
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 🔐 Service Role Key - Only for server-side usage
// DO NOT access directly - use getServiceRoleKey() instead for proper validation

// Base URL Configuration with proper fallbacks
// Priority: BASE_URL -> NEXT_PUBLIC_BASE_URL -> localhost for development
export const BASE_URL = process.env.BASE_URL || 
                       process.env.NEXT_PUBLIC_BASE_URL || 
                       (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.rewardjar.xyz')

export const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || BASE_URL

export const NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Apple Wallet Variables
export const APPLE_CERT_BASE64 = process.env.APPLE_CERT_BASE64
export const APPLE_KEY_BASE64 = process.env.APPLE_KEY_BASE64
export const APPLE_WWDR_BASE64 = process.env.APPLE_WWDR_BASE64
export const APPLE_CERT_PASSWORD = process.env.APPLE_CERT_PASSWORD
export const APPLE_TEAM_IDENTIFIER = process.env.APPLE_TEAM_IDENTIFIER || process.env.APPLE_TEAM_ID
export const APPLE_PASS_TYPE_IDENTIFIER = process.env.APPLE_PASS_TYPE_IDENTIFIER || process.env.APPLE_PASS_TYPE_ID

// Google Wallet Variables
export const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
export const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
export const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
export const GOOGLE_CLASS_ID = process.env.GOOGLE_CLASS_ID
export const GOOGLE_WALLET_CLASS_SUFFIX = process.env.GOOGLE_WALLET_CLASS_SUFFIX
export const GOOGLE_WALLET_CLASS_SUFFIX_STAMP = process.env.GOOGLE_WALLET_CLASS_SUFFIX_STAMP
export const GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP = process.env.GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP

// Security & Analytics Variables (Optional)
export const API_KEY = process.env.API_KEY
export const DEV_SEED_API_KEY = process.env.DEV_SEED_API_KEY
export const NEXT_PUBLIC_POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
export const NEXT_PUBLIC_POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST

// MCP Integration
export const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

// Validation function to check if all required variables are present
export function validateEnvironmentVariables() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    APPLE_TEAM_IDENTIFIER,
    APPLE_PASS_TYPE_IDENTIFIER,
  }

  const missing = Object.entries(required).filter(([_, value]) => !value)
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.map(([key]) => key).join(', ')}`)
  }

  return true
}

// Validation function specifically for admin operations (server-side only)
export function validateAdminEnvironmentVariables() {
  if (typeof window !== 'undefined') {
    throw new Error('validateAdminEnvironmentVariables can only be called server-side')
  }
  
  const required = {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APPLE_TEAM_IDENTIFIER,
    APPLE_PASS_TYPE_IDENTIFIER,
  }

  const missing = Object.entries(required).filter(([_, value]) => !value)
  
  if (missing.length > 0) {
    throw new Error(`Missing required admin environment variables: ${missing.map(([key]) => key).join(', ')}`)
  }

  return true
}

// Check if Apple Wallet is fully configured
export function isAppleWalletConfigured(): boolean {
  return !!(
    APPLE_CERT_BASE64 &&
    APPLE_KEY_BASE64 &&
    APPLE_WWDR_BASE64 &&
    APPLE_CERT_PASSWORD &&
    (APPLE_TEAM_IDENTIFIER) &&
    (APPLE_PASS_TYPE_IDENTIFIER)
  )
}

// Check if Google Wallet is fully configured
export function isGoogleWalletConfigured(): boolean {
  const hasCreds = !!(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) || !!GOOGLE_SERVICE_ACCOUNT_JSON
  const hasClass = !!(GOOGLE_CLASS_ID || GOOGLE_WALLET_CLASS_SUFFIX || GOOGLE_WALLET_CLASS_SUFFIX_STAMP || GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP)
  return hasCreds && hasClass
}

// Get wallet availability status
export function getWalletAvailability() {
  return {
    apple: isAppleWalletConfigured(),
    google: isGoogleWalletConfigured(),
    pwa: true, // PWA is always available
  }
}

// Get the appropriate base URL for the current environment
export function getBaseUrl(): string {
  // For client-side usage
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // For server-side usage
  return BASE_URL
}

/**
 * 🔐 SECURE SERVICE ROLE KEY ACCESS
 * 
 * This function safely retrieves the SUPABASE_SERVICE_ROLE_KEY with proper validation.
 * 
 * ⚠️ SECURITY REQUIREMENTS:
 * - Only call this server-side (API routes, server components)
 * - Never use in client components or browser code
 * - Provides clear error messages for missing configuration
 * 
 * @throws {Error} If service role key is missing or accessed client-side
 * @returns {string} The validated service role key
 */
export const getServiceRoleKey = (): string => {
  // Prevent client-side access
  if (typeof window !== 'undefined') {
    throw new Error('🚨 SECURITY VIOLATION: SUPABASE_SERVICE_ROLE_KEY cannot be accessed in browser/client context')
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    // Enhanced error message for development
    if (process.env.NODE_ENV === 'development') {
    }
    
    throw new Error('💡 Missing SUPABASE_SERVICE_ROLE_KEY in .env.local - Required for admin operations')
  }
  
  return serviceRoleKey
}

/**
 * Check if service role key is properly configured
 * Safe to call from anywhere as it doesn't throw
 */
export const isServiceRoleKeyConfigured = (): boolean => {
  // Safe check that doesn't throw
  if (typeof window !== 'undefined') {
    return false // Always false on client-side for security
  }
  
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

/**
 * Get environment status for admin dashboard
 * Safe to call from client-side as it doesn't expose sensitive data
 */
export const getEnvironmentStatus = () => {
  const isClient = typeof window !== 'undefined'
  
  return {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: isClient ? null : isServiceRoleKeyConfigured(), // null on client for security
    // For client safety, do not compute walletAvailability from client env
    walletAvailability: isClient ? { apple: false, google: false, pwa: true } : getWalletAvailability(),
    baseUrl: getBaseUrl(),
  }
}

// Get the production URL for Apple Wallet (Apple requires HTTPS and no localhost)
export function getAppleWalletBaseUrl(): string {
  const PRODUCTION_DOMAIN = "https://www.rewardjar.xyz"
  const baseUrl = getBaseUrl()
  
  // Apple Wallet requires HTTPS and rejects localhost/IP addresses
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1') || baseUrl.includes('192.168.') || baseUrl.includes('10.0.')) {
    return PRODUCTION_DOMAIN
  }
  
  // Ensure HTTPS
  return baseUrl.startsWith('https://') ? baseUrl : `https://${baseUrl.replace('http://', '')}`
} 