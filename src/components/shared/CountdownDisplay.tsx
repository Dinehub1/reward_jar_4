'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DesignConfig } from '@/lib/supabase/types'

interface CountdownDisplayProps {
  // Expiry countdown props
  expiryDate?: string | Date
  
  // Progress countdown props
  currentProgress?: number
  totalProgress?: number
  progressType?: 'stamps' | 'sessions' | 'visits'
  
  // Urgency settings
  urgencyThreshold?: number // Days for expiry, percentage for progress
  
  // Design configuration
  designConfig?: DesignConfig
  platform?: 'apple' | 'google' | 'pwa'
  
  // Display options
  showIcon?: boolean
  showLabel?: boolean
  compact?: boolean
  urgencyOnly?: boolean // Only show when urgent
  
  className?: string
}

// Platform-specific styling
const platformStyles = {
  apple: {
    container: 'bg-gray-50 border border-gray-200 rounded-lg',
    text: 'text-gray-900',
    urgent: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    success: 'bg-green-50 border-green-200 text-green-900'
  },
  google: {
    container: 'bg-white border border-gray-300 rounded-md',
    text: 'text-gray-800',
    urgent: 'bg-red-100 border-red-300 text-red-800',
    warning: 'bg-orange-100 border-orange-300 text-orange-800',
    success: 'bg-green-100 border-green-300 text-green-800'
  },
  pwa: {
    container: 'bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border',
    text: 'text-gray-900',
    urgent: 'from-red-50 to-red-100 border-red-200 text-red-900',
    warning: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900',
    success: 'from-green-50 to-green-100 border-green-200 text-green-900'
  }
}

function calculateTimeRemaining(expiryDate: string | Date) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0 }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { expired: false, days, hours, minutes }
}

function formatTimeRemaining(timeRemaining: ReturnType<typeof calculateTimeRemaining>, compact: boolean = false) {
  const { expired, days, hours, minutes } = timeRemaining
  
  if (expired) return 'Expired'
  
  if (compact) {
    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }
  
  if (days > 7) return `${days} days`
  if (days > 0) return `${days} day${days === 1 ? '' : 's'}`
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'}`
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function getProgressPercentage(current: number, total: number): number {
  return Math.min(100, Math.max(0, (current / total) * 100))
}

function getUrgencyLevel(
  timeRemaining: ReturnType<typeof calculateTimeRemaining> | null,
  progressPercent: number | null,
  urgencyThreshold: number = 7
): 'normal' | 'warning' | 'urgent' | 'success' {
  // Check expiry urgency
  if (timeRemaining) {
    if (timeRemaining.expired) return 'urgent'
    if (timeRemaining.days <= urgencyThreshold) return 'warning'
  }
  
  // Check progress urgency (close to completion)
  if (progressPercent !== null) {
    if (progressPercent >= 100) return 'success'
    if (progressPercent >= 90) return 'warning'
  }
  
  return 'normal'
}

export function CountdownDisplay({
  expiryDate,
  currentProgress,
  totalProgress,
  progressType = 'stamps',
  urgencyThreshold = 7,
  designConfig,
  platform = 'apple',
  showIcon = true,
  showLabel = true,
  compact = false,
  urgencyOnly = false,
  className
}: CountdownDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof calculateTimeRemaining> | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Update time remaining every minute
  useEffect(() => {
    setMounted(true)
    if (!expiryDate) return
    
    const updateTime = () => {
      setTimeRemaining(calculateTimeRemaining(expiryDate))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [expiryDate])
  
  // Don't render on server
  if (!mounted) return null
  
  // Calculate values
  const progressPercent = currentProgress !== undefined && totalProgress !== undefined 
    ? getProgressPercentage(currentProgress, totalProgress)
    : null
    
  const urgencyLevel = getUrgencyLevel(timeRemaining, progressPercent, urgencyThreshold)
  
  // Apply urgency-only filter
  if (urgencyOnly && urgencyLevel === 'normal') return null
  
  // Get platform styles
  const styles = platformStyles[platform]
  const baseStyle = styles.container
  const urgencyStyle = urgencyLevel === 'urgent' ? styles.urgent
    : urgencyLevel === 'warning' ? styles.warning
    : urgencyLevel === 'success' ? styles.success
    : baseStyle
  
  // Choose appropriate icon
  const getIcon = () => {
    if (urgencyLevel === 'urgent') return AlertTriangle
    if (urgencyLevel === 'success') return CheckCircle
    if (timeRemaining) return Clock
    if (progressPercent !== null) return Target
    return Calendar
  }
  
  const IconComponent = getIcon()
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-2 p-3',
        urgencyStyle,
        compact && 'p-2 text-sm',
        className
      )}
    >
      {showIcon && (
        <IconComponent className={cn(
          'shrink-0',
          compact ? 'h-4 w-4' : 'h-5 w-5',
          urgencyLevel === 'urgent' && 'animate-pulse'
        )} />
      )}
      
      <div className="flex-1 min-w-0">
        {/* Expiry Countdown */}
        {timeRemaining && (
          <div className={compact ? 'space-y-0' : 'space-y-1'}>
            {showLabel && !compact && (
              <div className="text-xs font-medium opacity-75">
                {timeRemaining.expired ? 'Expired' : 'Expires in'}
              </div>
            )}
            <div className={cn(
              'font-semibold',
              compact ? 'text-sm' : 'text-base'
            )}>
              {formatTimeRemaining(timeRemaining, compact)}
            </div>
          </div>
        )}
        
        {/* Progress Countdown */}
        {progressPercent !== null && (
          <div className={compact ? 'space-y-0' : 'space-y-1'}>
            {showLabel && !compact && (
              <div className="text-xs font-medium opacity-75">
                {progressType === 'stamps' ? 'Stamps' : 
                 progressType === 'sessions' ? 'Sessions' : 'Progress'}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className={cn(
                'font-semibold',
                compact ? 'text-sm' : 'text-base'
              )}>
                {currentProgress}/{totalProgress}
              </div>
              {!compact && (
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      urgencyLevel === 'success' ? 'bg-green-500' :
                      urgencyLevel === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    )}
                  />
                </div>
              )}
              <div className={cn(
                'text-xs font-medium',
                compact && 'hidden'
              )}>
                {Math.round(progressPercent)}%
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Urgency indicator */}
      {urgencyLevel !== 'normal' && !compact && (
        <div className={cn(
          'w-2 h-2 rounded-full',
          urgencyLevel === 'urgent' && 'bg-red-500 animate-pulse',
          urgencyLevel === 'warning' && 'bg-yellow-500',
          urgencyLevel === 'success' && 'bg-green-500'
        )} />
      )}
    </motion.div>
  )
}

// Specialized components for specific use cases
export function ExpiryCountdown(props: Omit<CountdownDisplayProps, 'currentProgress' | 'totalProgress' | 'progressType'>) {
  return <CountdownDisplay {...props} />
}

export function ProgressCountdown(props: Omit<CountdownDisplayProps, 'expiryDate'>) {
  return <CountdownDisplay {...props} />
}