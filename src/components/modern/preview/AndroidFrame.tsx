'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'

interface AndroidFrameProps {
  children: React.ReactNode
  variant?: 'pixel' | 'samsung' | 'oneplus' | 'default'
  className?: string
  // Enhanced interaction props (Phase 1)
  interactive?: boolean
  onDeviceClick?: () => void
  onDeviceFocus?: () => void
  showReflection?: boolean
  enableZoom?: boolean
  focused?: boolean
}

const getFrameColors = (variant: AndroidFrameProps['variant']) => {
  switch (variant) {
    case 'pixel':
      return {
        frame: 'bg-gray-800',
        bezel: 'bg-gray-700',
        buttons: 'bg-gray-600'
      }
    case 'samsung':
      return {
        frame: 'bg-gradient-to-b from-gray-900 to-black',
        bezel: 'bg-gradient-to-b from-gray-800 to-gray-900',
        buttons: 'bg-gray-700'
      }
    case 'oneplus':
      return {
        frame: 'bg-gradient-to-b from-slate-800 to-slate-900',
        bezel: 'bg-gradient-to-b from-slate-700 to-slate-800',
        buttons: 'bg-slate-600'
      }
    case 'default':
    default:
      return {
        frame: 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900',
        bezel: 'bg-gradient-to-b from-gray-700 to-gray-800',
        buttons: 'bg-gray-600'
      }
  }
}

export function AndroidFrame({  
  children, 
  variant = 'default',
  className = '',
  interactive = false,
  onDeviceClick,
  onDeviceFocus,
  showReflection = true,
  enableZoom = false,
  focused = false
 }: AndroidFrameProps) {
  const colors = getFrameColors(variant)
  
  // Enhanced animations and interactions (same as iPhone)
  const scaleOnHover = interactive ? 1.02 : 1
  const scaleOnTap = interactive ? 0.98 : 1
  const focusScale = focused && enableZoom ? 1.1 : 1
  
  const handleClick = () => {
    if (interactive) {
      onDeviceClick?.()
      onDeviceFocus?.()
    }
  }
  
  return (
    <div className={`relative mx-auto ${className}`}>
      {/* Enhanced Android Device Frame with Interactions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: focusScale 
        }}
        whileHover={interactive ? { 
          scale: scaleOnHover,
          rotateY: -2, // Opposite direction from iPhone for variety
          rotateX: 1
        } : {}}
        whileTap={interactive ? { 
          scale: scaleOnTap,
          rotateY: 0,
          rotateX: 0
        } : {}}
        transition={{ 
          duration: 0.5, 
          ease: designTokens.animation.easing.out,
          scale: { duration: 0.3 },
          rotate: { duration: 0.2 }
        }}
        className={`
          relative w-[375px] h-[812px] ${colors.frame} 
          rounded-[2.5rem] p-2 transform-gpu
          ${interactive ? 'cursor-pointer' : ''}
          ${focused ? 'ring-4 ring-green-500 ring-opacity-50' : ''}
        `}
        style={{ 
          boxShadow: focused 
            ? '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.3)'
            : designTokens.wallet.shadows.device,
          filter: focused 
            ? 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.25))'
            : 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))'
        }}
        onClick={handleClick}
      >
        {/* Screen Bezel */}
        <div className={`
          w-full h-full ${colors.bezel} 
          rounded-[2rem] overflow-hidden relative
        `}>
          {/* Punch Hole Camera (Top Right) */}
          <div className="absolute top-4 right-6 w-3 h-3 bg-black rounded-full z-20 shadow-inner">
            {/* Camera lens effect */}
            <div className="absolute inset-0.5 bg-gray-800 rounded-full">
              <div className="absolute inset-0.5 bg-gray-900 rounded-full" />
            </div>
          </div>
          
          {/* Status Bar Icons Area */}
          <div className="absolute top-2 left-4 right-12 h-6 flex items-center justify-between z-10">
            {/* Left side status icons */}
            <div className="flex items-center space-x-1">
              <div className="w-4 h-2 bg-white/20 rounded-sm" />
              <div className="w-2 h-2 bg-white/30 rounded-full" />
            </div>
            {/* Right side status icons */}
            <div className="flex items-center space-x-1">
              <div className="w-3 h-2 bg-white/20 rounded-sm" />
              <div className="w-4 h-2 bg-white/30 rounded-sm" />
            </div>
          </div>
          
          {/* Screen Content Area */}
          <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
            {/* Status Bar Background */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-transparent z-10" />
            
            {/* Main Content Area */}
            <div className="w-full h-full pt-10 pb-6 px-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  ease: designTokens.animation.easing.out,
                  delay: 0.2 
                }}
                className="w-full h-full relative"
              >
                {children}
              </motion.div>
            </div>
            
            {/* Navigation Bar (Android 3-button or gesture) */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center h-6">
              {variant === 'pixel' ? (
                // Gesture indicator (modern Android)
                <div className="w-32 h-1 bg-black/60 rounded-full" />
              ) : (
                // Traditional 3-button navigation
                <div className="flex items-center space-x-8">
                  <div className="w-4 h-4 border border-black/40 rounded-sm" />
                  <div className="w-4 h-4 bg-black/40 rounded-full" />
                  <div className="w-4 h-4 border border-black/40 rounded-sm rotate-45" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Physical Buttons */}
        {/* Power Button */}
        <div className={`absolute -right-1 top-28 w-1 h-12 ${colors.buttons} rounded-l shadow-sm`} />
        
        {/* Volume Buttons */}
        <div className={`absolute -left-1 top-24 w-1 h-8 ${colors.buttons} rounded-r shadow-sm`} />
        <div className={`absolute -left-1 top-36 w-1 h-8 ${colors.buttons} rounded-r shadow-sm`} />
        
        {/* Bixby/Assistant Button (Samsung variant) */}
        {variant === 'samsung' && (
          <div className={`absolute -left-1 top-48 w-1 h-6 ${colors.buttons} rounded-r shadow-sm`} />
        )}
      </motion.div>
      
      {/* Device Reflection/Glow Effect */}
      <div 
        className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Enhanced Reflection (Phase 1) */}
      {showReflection && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[300px] h-6"
          style={{
            background: focused 
              ? 'radial-gradient(ellipse, rgba(34, 197, 94, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)',
            filter: 'blur(12px)'
          }}
          animate={{
            opacity: interactive ? [0.3, 0.1, 0.3] : 0.3,
            scaleX: focused ? 1.2 : 1
          }}
          transition={{
            opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            scaleX: { duration: 0.3 }
          }}
        />
      )}
    </div>
  )
}

// Enhanced version with interactive features
export function InteractiveAndroidFrame({ 
  children, 
  variant = 'default',
  className = '',
  onDeviceInteraction,
  showReflection = true
}: AndroidFrameProps & {
  onDeviceInteraction?: () => void
  showReflection?: boolean
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onDeviceInteraction}
      className="cursor-pointer"
    >
      <AndroidFrame variant={variant} className={className}>
        {children}
      </AndroidFrame>
      
      {showReflection && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[300px] h-4"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.1) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
          animate={{
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.div>
  )
}

export default AndroidFrame