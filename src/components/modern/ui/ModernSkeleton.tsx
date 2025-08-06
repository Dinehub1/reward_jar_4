'use client'

import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

interface ModernSkeletonProps {
  variant?: 'text' | 'circle' | 'rectangle' | 'card'
  className?: string
  width?: string | number
  height?: string | number
  children?: React.ReactNode
}

const ModernSkeleton = ({ 
  variant = 'rectangle', 
  className, 
  width, 
  height,
  ...props 
}: ModernSkeletonProps & React.HTMLAttributes<HTMLDivElement>) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded'
      case 'circle':
        return 'rounded-full aspect-square'
      case 'card':
        return 'h-32 rounded-xl'
      default:
        return 'rounded-md'
    }
  }

  const style = {
    ...(width && { width }),
    ...(height && { height })
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
        getVariantStyles(),
        className
      )}
      style={style}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </motion.div>
  )
}

// Staggered loading blocks for lists
interface StaggeredSkeletonProps {
  count?: number
  variant?: 'text' | 'circle' | 'rectangle' | 'card'
  className?: string
  staggerDelay?: number
}

const StaggeredSkeleton = ({ 
  count = 3, 
  variant = 'text', 
  className,
  staggerDelay = 0.1 
}: StaggeredSkeletonProps) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: index * staggerDelay,
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          <ModernSkeleton variant={variant} className={className} />
        </motion.div>
      ))}
    </div>
  )
}

// Enhanced table skeleton with staggered animation
interface ModernTableSkeletonProps {
  rows?: number
  columns?: number
}

const ModernTableSkeleton = ({ rows = 5, columns = 6 }: ModernTableSkeletonProps) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <motion.div 
        className="flex space-x-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <ModernSkeleton key={i} variant="text" className="flex-1 h-5" />
        ))}
      </motion.div>
      
      {/* Rows with staggered animation */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="flex space-x-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            delay: rowIndex * 0.1,
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1]
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <ModernSkeleton key={colIndex} variant="text" className="flex-1" />
          ))}
        </motion.div>
      ))}
    </div>
  )
}

// Enhanced card skeleton with modern styling
interface ModernCardSkeletonProps {
  count?: number
  className?: string
}

const ModernCardSkeleton = ({ count = 4, className }: ModernCardSkeletonProps) => {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            delay: i * 0.1,
            duration: 0.4,
            ease: [0.4, 0.0, 0.2, 1]
          }}
          className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between space-y-0 pb-4">
            <ModernSkeleton variant="text" width={100} height={16} />
            <ModernSkeleton variant="circle" width={24} height={24} />
          </div>
          <div className="space-y-3">
            <ModernSkeleton variant="text" width={60} height={32} />
            <ModernSkeleton variant="text" width={120} height={12} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Loading state with shimmer effect
const ShimmerLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      <motion.div
        className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 0%'],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
        style={{
          backgroundSize: '200% 100%'
        }}
      />
      <motion.div
        className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 0%'],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: 'linear',
          delay: 0.2 
        }}
        style={{
          backgroundSize: '200% 100%'
        }}
      />
    </div>
  )
}

export { 
  ModernSkeleton, 
  StaggeredSkeleton, 
  ModernTableSkeleton, 
  ModernCardSkeleton, 
  ShimmerLoader 
}