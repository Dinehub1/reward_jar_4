'use client'

import React from 'react'
import { motion, AnimatePresence, type Easing } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

// Custom easing curves for smooth transitions
const easeInOut: Easing = [0.4, 0.0, 0.2, 1]
const easeOut: Easing = [0.0, 0.0, 0.2, 1]

const PageTransition = ({ children, className }: PageTransitionProps) => {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: easeInOut,
          delay: 0.1
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Staggered page transition for components with multiple elements
interface StaggeredPageTransitionProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

const StaggeredPageTransition = ({ 
  children, 
  staggerDelay = 0.1, 
  className 
}: StaggeredPageTransitionProps) => {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: 0.1
            }
          },
          exit: {
            opacity: 0,
            transition: {
              staggerChildren: staggerDelay / 2,
              staggerDirection: -1
            }
          }
        }}
        initial="hidden"
        animate="show"
        exit="exit"
        className={className}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.4, ease: easeOut }
              },
              exit: { 
                opacity: 0, 
                y: -10,
                transition: { duration: 0.2, ease: easeInOut }
              }
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

// Slide transition for navigation between pages
interface SlideTransitionProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  className?: string
}

const SlideTransition = ({ 
  children, 
  direction = 'right', 
  className 
}: SlideTransitionProps) => {
  const pathname = usePathname()

  const variants = {
    left: { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 100, opacity: 0 } },
    right: { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -100, opacity: 0 } },
    up: { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 100, opacity: 0 } },
    down: { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -100, opacity: 0 } }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={variants[direction].initial}
        animate={variants[direction].animate}
        exit={variants[direction].exit}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Scale transition with blur effect
const ScaleTransition = ({ children, className }: PageTransitionProps) => {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
        transition={{
          duration: 0.4,
          ease: easeOut
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Loading transition with skeleton
interface LoadingTransitionProps {
  children: React.ReactNode
  isLoading?: boolean
  loadingComponent?: React.ReactNode
  className?: string
}

const LoadingTransition = ({ 
  children, 
  isLoading = false, 
  loadingComponent,
  className 
}: LoadingTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {loadingComponent}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: easeOut,
            delay: 0.1 
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { 
  PageTransition, 
  StaggeredPageTransition, 
  SlideTransition, 
  ScaleTransition,
  LoadingTransition 
}