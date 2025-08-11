'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  level?: 'page' | 'component' | 'critical'
}

function DefaultErrorFallback({ error, resetError, level = 'component' }: ErrorFallbackProps) {
  const isPageLevel = level === 'page'
  const isCritical = level === 'critical'

  return (
    <Card className={`w-full ${isPageLevel ? 'max-w-2xl mx-auto mt-8' : ''} ${isCritical ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isCritical ? 'text-red-800' : 'text-yellow-800'}`}>
          <AlertTriangle className="h-5 w-5" />
          {isCritical ? 'Critical Error' : 'Something went wrong'}
        </CardTitle>
        <CardDescription className={isCritical ? 'text-red-600' : 'text-yellow-600'}>
          {isPageLevel 
            ? 'This page encountered an error and cannot be displayed properly.'
            : 'This component encountered an error and cannot be displayed.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NODE_ENV === 'development' && (
          <details className="rounded border p-3 bg-gray-50">
            <summary className="cursor-pointer font-medium text-gray-700">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 text-sm text-gray-600">
              <p><strong>Message:</strong> {error.message}</p>
              {error.stack && (
                <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
        
        <div className="flex gap-2">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          {isPageLevel && (
            <Button 
              onClick={() => window.location.href = '/'}
              variant="default" 
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.groupEnd()
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
          level={this.props.level}
        />
      )
    }

    return this.props.children
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specialized error boundaries for common use cases
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary level="page" onError={(error, errorInfo) => {
      // Could integrate with error reporting service here
      if (process.env.NODE_ENV === 'production') {
        // Example: reportError(error, errorInfo)
      }
    }}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary level="component">
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary level="critical" onError={(error, errorInfo) => {
      // Always report critical errors
      if (process.env.NODE_ENV === 'production') {
        // Example: reportCriticalError(error, errorInfo)
      }
    }}>
      {children}
    </ErrorBoundary>
  )
}