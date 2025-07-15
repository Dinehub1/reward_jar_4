// Centralized environment configuration for RewardJar 4.0
// This file exports all environment variables with validation

// Core Application Variables
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
export const NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Apple Wallet Variables
export const APPLE_CERT_BASE64 = process.env.APPLE_CERT_BASE64
export const APPLE_KEY_BASE64 = process.env.APPLE_KEY_BASE64
export const APPLE_WWDR_BASE64 = process.env.APPLE_WWDR_BASE64
export const APPLE_CERT_PASSWORD = process.env.APPLE_CERT_PASSWORD
export const APPLE_TEAM_IDENTIFIER = process.env.APPLE_TEAM_IDENTIFIER!
export const APPLE_PASS_TYPE_IDENTIFIER = process.env.APPLE_PASS_TYPE_IDENTIFIER!

// Google Wallet Variables
export const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
export const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
export const GOOGLE_CLASS_ID = process.env.GOOGLE_CLASS_ID

// Security & Analytics Variables (Optional)
export const API_KEY = process.env.API_KEY
export const NEXT_PUBLIC_POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
export const NEXT_PUBLIC_POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST

// Validation function to check if all required variables are present
export function validateEnvironmentVariables() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    APPLE_TEAM_IDENTIFIER,
    APPLE_PASS_TYPE_IDENTIFIER,
  }

  const missing = Object.entries(required).filter(([_, value]) => !value)
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.map(([key]) => key))
    throw new Error(`Missing required environment variables: ${missing.map(([key]) => key).join(', ')}`)
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
    APPLE_TEAM_IDENTIFIER &&
    APPLE_PASS_TYPE_IDENTIFIER
  )
}

// Check if Google Wallet is fully configured
export function isGoogleWalletConfigured(): boolean {
  return !!(
    GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    GOOGLE_CLASS_ID
  )
}

// Get wallet availability status
export function getWalletAvailability() {
  return {
    apple: isAppleWalletConfigured(),
    google: isGoogleWalletConfigured(),
    pwa: true, // PWA is always available
  }
} 