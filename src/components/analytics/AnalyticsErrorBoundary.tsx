'use client'

import React, { useState, useEffect } from 'react'
import { analytics } from '../../../lib/monitoring/analytics'

// Error boundary component
export function withAnalyticsErrorBoundary<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  return function AnalyticsErrorBoundary(props: T) {
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        analytics.trackError(new Error(error.message), {
          component: WrappedComponent.name,
          action: 'runtime_error',
          additionalData: { filename: error.filename, lineno: error.lineno }
        })
        setHasError(true)
      }

      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }, [])

    if (hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">
            An error occurred in the card creation system. Please refresh the page and try again.
          </p>
          <button
            onClick={() => {
              setHasError(false)
              window.location.reload()
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}