'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'

/**
 * 🔄 UNIFIED LOADING STATES
 * 
 * Consistent loading experiences across all components
 * Mobile-optimized with accessibility considerations
 */

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
}

// Base spinner component
export function LoadingSpinner({ size = 'md', className }: Pick<LoadingProps, 'size' | 'className'>) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  )
}

// Skeleton loading for cards and content
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border p-4 space-y-3 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )
}

// Skeleton for mobile dashboard metrics
export function MobileMetricsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
      
      {/* Primary metrics */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg border">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => (
          <div key={i} className="bg-white p-3 rounded-lg border">
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton for quick actions grid
export function QuickActionsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg border">
            <div className="animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-6 w-6 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Dot animation loading
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={`flex space-x-1 justify-center items-center ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 bg-blue-600 rounded-full"
          animate={{
            y: [0, -8, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
            ease: designTokens.animation.easing.out
          }}
        />
      ))}
    </div>
  )
}

// Progressive loading with text
export function ProgressiveLoader({ 
  text = "Loading...", 
  progress, 
  className 
}: { 
  text?: string
  progress?: number
  className?: string 
}) {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      <LoadingSpinner size="lg" className="mx-auto" />
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{text}</p>
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: designTokens.animation.easing.out }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Full page loading overlay
export function FullPageLoader({ 
  text = "Loading dashboard...",
  variant = 'spinner'
}: {
  text?: string
  variant?: 'spinner' | 'dots'
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="text-center space-y-4">
        {variant === 'spinner' ? (
          <LoadingSpinner size="lg" className="mx-auto" />
        ) : (
          <LoadingDots className="h-8" />
        )}
        <p className="text-gray-600 font-medium">{text}</p>
      </div>
    </motion.div>
  )
}

// Main unified loading component
export default function UnifiedLoading({ 
  variant = 'spinner',
  size = 'md',
  text,
  className 
}: LoadingProps) {
  switch (variant) {
    case 'skeleton':
      return <SkeletonCard className={className} />
    case 'pulse':
      return <ProgressiveLoader text={text} className={className} />
    case 'dots':
      return <LoadingDots className={className} />
    default:
      return (
        <div className={`flex items-center justify-center space-x-2 ${className}`}>
          <LoadingSpinner size={size} />
          {text && <span className="text-sm text-gray-600">{text}</span>}
        </div>
      )
  }
}

// Hook for consistent loading states
export function useLoadingState(isLoading: boolean, delay: number = 200) {
  const [showLoading, setShowLoading] = React.useState(false)

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (isLoading) {
      // Delay showing loading to prevent flashing
      timeoutId = setTimeout(() => setShowLoading(true), delay)
    } else {
      setShowLoading(false)
    }

    return () => clearTimeout(timeoutId)
  }, [isLoading, delay])

  return showLoading
}

// Loading boundary component
export function LoadingBoundary({ 
  children, 
  fallback, 
  isLoading 
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  isLoading: boolean
}) {
  const shouldShowLoading = useLoadingState(isLoading)

  if (shouldShowLoading) {
    return fallback || <UnifiedLoading variant="skeleton" />
  }

  return <>{children}</>
}