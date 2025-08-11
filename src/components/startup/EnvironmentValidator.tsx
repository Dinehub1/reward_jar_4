'use client'

import { useEffect, useState } from 'react'
import { validateEnvVars, getEnvReport } from '@/lib/env-validation'

interface EnvironmentValidatorProps {
  children: React.ReactNode
}

/**
 * Environment Validator Component
 * 
 * Validates environment variables on the client side and provides
 * helpful error messages if critical variables are missing.
 * This runs after the server-side validation to catch any client-side issues.
 */
export function EnvironmentValidator({ children }: EnvironmentValidatorProps) {
  const [validationState, setValidationState] = useState<{
    isValid: boolean
    isLoading: boolean
    errors: string[]
    warnings: string[]
  }>({
    isValid: true,
    isLoading: true,
    errors: [],
    warnings: []
  })

  useEffect(() => {
    // Only validate client-accessible environment variables
    const clientEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    }

    try {
      const result = validateEnvVars(clientEnv)
      
      // Only check for client-accessible variables
      const clientErrors = result.errors.filter(error => 
        error.includes('NEXT_PUBLIC_SUPABASE_URL') || 
        error.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
        error.includes('NEXT_PUBLIC_BASE_URL')
      )

      setValidationState({
        isValid: clientErrors.length === 0,
        isLoading: false,
        errors: clientErrors,
        warnings: result.warnings
      })

      // Log environment status in development
      if (process.env.NODE_ENV === 'development') {
        if (result.warnings.length > 0) {
        }
      }
    } catch (error) {
      setValidationState({
        isValid: false,
        isLoading: false,
        errors: ['Environment validation failed'],
        warnings: []
      })
    }
  }, [])

  // Show loading state briefly
  if (validationState.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating environment...</p>
        </div>
      </div>
    )
  }

  // Show error state if critical variables are missing
  if (!validationState.isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-destructive/20 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-destructive mb-2">Configuration Error</h1>
            <p className="text-sm text-muted-foreground mb-4">
              RewardJar requires certain environment variables to function properly.
            </p>
          </div>
          
          <div className="space-y-2 mb-4">
            {validationState.errors.map((error, index) => (
              <div key={index} className="text-sm text-destructive bg-destructive/5 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">
              <strong>For developers:</strong> Check your <code>.env.local</code> file and ensure all required variables are set.
            </p>
            <p>
              See <code>doc/doc2/3_SUPABASE_SETUP.md</code> for complete setup instructions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show warnings in development (non-blocking)
  if (process.env.NODE_ENV === 'development' && validationState.warnings.length > 0) {
  }

  // Environment is valid, render children
  return <>{children}</>
}

export default EnvironmentValidator