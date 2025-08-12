'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Shield, 
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * 🔧 UNIFIED ERROR HANDLING
 * 
 * User-friendly error states with recovery options
 * Mobile-optimized with clear messaging for non-technical users
 */

export interface ErrorInfo {
  code?: string
  message: string
  statusCode?: number
  retryable?: boolean
  suggestions?: string[]
  technicalDetails?: string
}

interface UnifiedErrorProps {
  error: Error | ErrorInfo | string
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
  variant?: 'card' | 'inline' | 'toast' | 'fullscreen'
  className?: string
  showTechnicalDetails?: boolean
}

// Error type detection and mapping
function parseError(error: Error | ErrorInfo | string): ErrorInfo {
  if (typeof error === 'string') {
    return {
      message: error,
      retryable: true
    }
  }

  if (error instanceof Error) {
    const statusCode = (error as any).status || 0
    const code = (error as any).code || 'UNKNOWN_ERROR'

    return {
      code,
      message: error.message,
      statusCode,
      retryable: !isAuthError(statusCode),
      suggestions: getSuggestionsForError(code, statusCode),
      technicalDetails: error.stack
    }
  }

  return error as ErrorInfo
}

// Helper functions
function isAuthError(statusCode: number): boolean {
  return statusCode === 401 || statusCode === 403
}

function isNetworkError(code: string): boolean {
  return code === 'NETWORK_ERROR' || code === 'TIMEOUT' || code === 'FETCH_ERROR'
}

function getSuggestionsForError(code: string, statusCode: number): string[] {
  if (isAuthError(statusCode)) {
    return [
      'Please sign in again',
      'Check if your session has expired',
      'Contact support if the problem persists'
    ]
  }

  if (isNetworkError(code) || statusCode >= 500) {
    return [
      'Check your internet connection',
      'Try refreshing the page',
      'The issue may be temporary - please try again in a few minutes'
    ]
  }

  if (statusCode === 429) {
    return [
      'You\'re making requests too quickly',
      'Please wait a moment before trying again',
      'Consider reducing the frequency of your actions'
    ]
  }

  return [
    'This appears to be a temporary issue',
    'Try refreshing the page',
    'Contact support if the problem continues'
  ]
}

function getErrorIcon(code: string, statusCode: number) {
  if (isAuthError(statusCode)) return Shield
  if (isNetworkError(code)) return WifiOff
  if (statusCode === 429) return Clock
  return AlertCircle
}

function getUserFriendlyMessage(message: string, statusCode: number): string {
  // Convert technical messages to user-friendly ones
  const friendlyMessages: Record<string, string> = {
    'Authentication required': 'Please sign in to continue',
    'Failed to fetch': 'Connection problem - please check your internet',
    'Network error': 'Unable to connect - please try again',
    'Internal server error': 'Something went wrong on our end - we\'re looking into it',
    'Unauthorized': 'You don\'t have permission to do that',
    'Not found': 'The information you\'re looking for isn\'t available',
    'Request timeout': 'The request took too long - please try again'
  }

  const lowerMessage = message.toLowerCase()
  for (const [technical, friendly] of Object.entries(friendlyMessages)) {
    if (lowerMessage.includes(technical.toLowerCase())) {
      return friendly
    }
  }

  return message
}

// Main error component
export default function UnifiedError({
  error,
  onRetry,
  onDismiss,
  variant = 'card',
  className,
  showTechnicalDetails = false
}: UnifiedErrorProps) {
  const [retrying, setRetrying] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  const errorInfo = parseError(error)
  const Icon = getErrorIcon(errorInfo.code || '', errorInfo.statusCode || 0)
  const friendlyMessage = getUserFriendlyMessage(errorInfo.message, errorInfo.statusCode || 0)

  const handleRetry = async () => {
    if (!onRetry) return
    
    setRetrying(true)
    
    // Haptic feedback on mobile
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }

    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  // Different variants for different contexts
  if (variant === 'toast') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-96 ${className}`}
      >
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{friendlyMessage}</p>
                {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
                  <p className="text-xs text-red-700 mt-1">{errorInfo.suggestions[0]}</p>
                )}
              </div>
              <div className="flex gap-1">
                {errorInfo.retryable && onRetry && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-red-600 hover:text-red-700"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-red-600 hover:text-red-700"
                    onClick={onDismiss}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <Icon className="h-4 w-4 text-red-600 flex-shrink-0" />
        <span className="text-sm text-red-800 flex-1">{friendlyMessage}</span>
        {errorInfo.retryable && onRetry && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-red-600 hover:text-red-700"
            onClick={handleRetry}
            disabled={retrying}
          >
            <RefreshCw className={`h-3 w-3 ${retrying ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'fullscreen') {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Icon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-600 mb-4">{friendlyMessage}</p>
            
            {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <h4 className="text-xs font-medium text-blue-900 mb-2">What you can try:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  {errorInfo.suggestions.map((suggestion, index) => (
                    <li key={index}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {errorInfo.retryable && onRetry && (
                <Button onClick={handleRetry} disabled={retrying} className="flex-1">
                  <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              )}
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>

            {showTechnicalDetails && errorInfo.technicalDetails && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer">Technical Details</summary>
                <pre className="text-xs text-gray-400 mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {errorInfo.technicalDetails}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default card variant
  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-red-900">{friendlyMessage}</h3>
              {errorInfo.statusCode && (
                <Badge variant="secondary" className="text-xs">
                  {errorInfo.statusCode}
                </Badge>
              )}
            </div>

            {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
              <div className="space-y-1">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1 text-xs text-red-700 hover:text-red-800"
                >
                  <HelpCircle className="h-3 w-3" />
                  What you can try
                  {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                
                <AnimatePresence>
                  {showDetails && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-700 space-y-1 pl-4"
                    >
                      {errorInfo.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}

            {(errorInfo.retryable && onRetry) && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${retrying ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
                {onDismiss && (
                  <Button size="sm" variant="outline" onClick={onDismiss}>
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Error boundary component
export function ErrorBoundary({ 
  children, 
  fallback,
  onError
}: {
  children: React.ReactNode
  fallback?: (error: Error) => React.ReactNode
  onError?: (error: Error) => void
}) {
  const [error, setError] = useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message))
      onError?.(new Error(event.message))
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [onError])

  if (error) {
    return fallback?.(error) || (
      <UnifiedError 
        error={error} 
        variant="fullscreen"
        onRetry={() => {
          setError(null)
          window.location.reload()
        }}
      />
    )
  }

  return <>{children}</>
}