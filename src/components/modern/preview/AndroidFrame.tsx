'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'

interface AndroidFrameProps {
  children: React.ReactNode
  variant?: 'pixel' | 'samsung' | 'oneplus' | 'default'
  className?: string
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
  className = ''
 }: AndroidFrameProps) {
  const colors = getFrameColors(variant)
  
  return (
    <div className={`relative mx-auto ${className}`}>
      {/* Outer Device Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          ease: designTokens.animation.easing.out 
        }}
        className={`
          relative w-[375px] h-[812px] ${colors.frame} 
          rounded-[2.5rem] p-2
        `}
        style={{ 
          boxShadow: designTokens.wallet.shadows.device,
          filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))'
        }}
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