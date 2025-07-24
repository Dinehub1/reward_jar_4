// Environment variable validation utility
import { useEffect, useState } from 'react'

export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  required: Record<string, string | undefined>
  optional: Record<string, string | undefined>
}

// Server-side validation (safe for SSR)
export function validateServerEnvVars(): EnvValidationResult {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const optional = {
    BASE_URL: process.env.BASE_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  }

  const missing = Object.entries(required).filter(([_key, value]) => !value).map(([key]) => key)
  
  return {
    isValid: missing.length === 0,
    missing,
    required,
    optional
  }
}

// Client-side hook to avoid hydration issues
export function useEnvValidation(): EnvValidationResult {
  const [envStatus, setEnvStatus] = useState<EnvValidationResult>({
    isValid: false,
    missing: [],
    required: {},
    optional: {}
  })

  useEffect(() => {
    // Only validate on client-side after hydration
    const required = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    const optional = {
      BASE_URL: process.env.BASE_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    }

    const missing = Object.entries(required).filter(([_key, value]) => !value).map(([key]) => key)
    
    setEnvStatus({
      isValid: missing.length === 0,
      missing,
      required,
      optional
    })
  }, [])

  return envStatus
}

// Legacy function for backward compatibility (deprecated)
export function validateEnvVars(): EnvValidationResult {
  console.warn('validateEnvVars is deprecated. Use useEnvValidation hook instead.')
  return validateServerEnvVars()
}

export function getSupabaseConfig() {
  // Always return valid config for server-side rendering
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkzNTMyMDAsImV4cCI6MjAxNDkyOTIwMH0.placeholder'
  }
} 