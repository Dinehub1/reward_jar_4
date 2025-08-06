'use client'

import * as React from "react"
import { motion, HTMLMotionProps } from 'framer-motion'
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl",
        modern: "bg-gradient-to-r from-slate-900 to-slate-800 text-white hover:from-slate-800 hover:to-slate-700 shadow-lg hover:shadow-xl border border-slate-700/50",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-13 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ModernButtonProps
  extends Omit<HTMLMotionProps<"button">, "size">,
    VariantProps<typeof modernButtonVariants> {
  asChild?: boolean
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button

    return (
      <Comp
        className={cn(modernButtonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] }
        }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
        {...props}
      >
        {/* Background pulse effect on hover */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-xl"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ 
            scale: 1, 
            opacity: 1,
            transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
          }}
        />
        
        {/* Ripple effect on tap */}
        <motion.div
          className="absolute inset-0 bg-white/30 rounded-xl"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ 
            scale: 1.2, 
            opacity: [0, 0.3, 0],
            transition: { duration: 0.4, ease: "easeOut" }
          }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Comp>
    )
  }
)
ModernButton.displayName = "ModernButton"

// Loading button variant with spinner
interface LoadingButtonProps extends ModernButtonProps {
  loading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, loadingText = "Loading...", children, disabled, ...props }, ref) => {
    return (
      <ModernButton
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            {loadingText}
          </>
        ) : (
          children
        )}
      </ModernButton>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

// Icon button with enhanced animations
interface IconButtonProps extends ModernButtonProps {
  icon: React.ReactNode
  label?: string
  showLabel?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <ModernButton
        ref={ref}
        variant="ghost"
        size={showLabel ? "default" : "icon"}
        className={cn("group", className)}
        {...props}
      >
        <motion.div
          animate={{ rotate: 0 }}
          whileHover={{ rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
        {showLabel && label && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            transition={{ duration: 0.2 }}
            className="ml-2"
          >
            {label}
          </motion.span>
        )}
      </ModernButton>
    )
  }
)
IconButton.displayName = "IconButton"

// Floating Action Button
interface FABProps extends ModernButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FABProps>(
  ({ position = 'bottom-right', className, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    }

    return (
      <motion.div
        className={positionClasses[position]}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ModernButton
          ref={ref}
          variant="gradient"
          size="icon"
          className={cn("rounded-full shadow-2xl", className)}
          {...props}
        />
      </motion.div>
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

export { 
  ModernButton, 
  LoadingButton, 
  IconButton, 
  FloatingActionButton, 
  modernButtonVariants 
}