'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'

interface IPhone15FrameProps {
  children: React.ReactNode
  variant?: 'natural' | 'black' | 'white' | 'blue' | 'pro'
  className?: string
  // Enhanced interaction props (Phase 1)
  interactive?: boolean
  onDeviceClick?: () => void
  onDeviceFocus?: () => void
  showReflection?: boolean
  enableZoom?: boolean
  focused?: boolean
}

const getFrameColors = (variant: IPhone15FrameProps['variant']) => {
  switch (variant) {
    case 'black':
      return {
        frame: 'bg-gray-900',
        bezel: 'bg-gray-800',
        buttons: 'bg-gray-700'
      }
    case 'white':
      return {
        frame: 'bg-gray-100',
        bezel: 'bg-gray-200',
        buttons: 'bg-gray-300'
      }
    case 'blue':
      return {
        frame: 'bg-blue-900',
        bezel: 'bg-blue-800',
        buttons: 'bg-blue-700'
      }
    case 'pro':
      return {
        frame: 'bg-gradient-to-b from-gray-800 to-gray-900',
        bezel: 'bg-gradient-to-b from-gray-700 to-gray-800',
        buttons: 'bg-gray-600'
      }
    case 'natural':
    default:
      return {
        frame: 'bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800',
        bezel: 'bg-gradient-to-b from-gray-600 to-gray-700',
        buttons: 'bg-gray-500'
      }
  }
}

export function IPhone15Frame({  
  children, 
  variant = 'natural',
  className = '',
  interactive = false,
  onDeviceClick,
  onDeviceFocus,
  showReflection = true,
  enableZoom = false,
  focused = false
 }: IPhone15FrameProps) {
  const colors = getFrameColors(variant)
  
  // Enhanced animations and interactions
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
      {/* Enhanced Device Frame with Interactions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: focusScale 
        }}
        whileHover={interactive ? { 
          scale: scaleOnHover,
          rotateY: 2,
          rotateX: -1
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
          rounded-[3rem] p-2 transform-gpu
          ${interactive ? 'cursor-pointer' : ''}
          ${focused ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
        `}
        style={{ 
          boxShadow: focused 
            ? '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.3)'
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
          rounded-[2.5rem] overflow-hidden relative
        `}>
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-full z-20 shadow-inner">
            {/* Camera and sensors inside Dynamic Island */}
            <div className="absolute top-1/2 left-6 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rounded-full" />
            <div className="absolute top-1/2 right-6 transform -translate-y-1/2 w-1.5 h-1.5 bg-gray-700 rounded-full" />
          </div>
          
          {/* Screen Content Area */}
          <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
            {/* Status Bar Area (protected from content) */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-transparent z-10" />
            
            {/* Main Content Area */}
            <div className="w-full h-full pt-12 pb-8 px-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  ease: designTokens.animation.easing.out,
                  delay: 0.2 
                }}
                className="w-full h-full relative flex items-start justify-center"
              >
                {/* Content area mimics a typical Wallet scroll view top padding */}
                <div className="w-full flex justify-center pt-8">
                  {children}
                </div>
              </motion.div>
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full opacity-60" />
          </div>
        </div>
        
        {/* Physical Buttons */}
        {/* Volume Buttons */}
        <div className={`absolute -left-1 top-20 w-1 h-8 ${colors.buttons} rounded-r shadow-sm`} />
        <div className={`absolute -left-1 top-32 w-1 h-12 ${colors.buttons} rounded-r shadow-sm`} />
        <div className={`absolute -left-1 top-48 w-1 h-12 ${colors.buttons} rounded-r shadow-sm`} />
        
        {/* Power Button */}
        <div className={`absolute -right-1 top-32 w-1 h-16 ${colors.buttons} rounded-l shadow-sm`} />
        
        {/* Action Button (iPhone 15 Pro) */}
        {variant === 'pro' && (
          <div className={`absolute -left-1 top-16 w-1 h-6 ${colors.buttons} rounded-r shadow-sm`} />
        )}
      </motion.div>
      
      {/* Device Reflection/Glow Effect */}
      <div 
        className="absolute inset-0 rounded-[3rem] pointer-events-none"
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
              ? 'radial-gradient(ellipse, rgba(59, 130, 246, 0.2) 0%, transparent 70%)'
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
export function InteractiveIPhone15Frame({ 
  children, 
  variant = 'natural',
  className = '',
  onDeviceInteraction,
  showReflection = true
}: IPhone15FrameProps & {
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
      <IPhone15Frame variant={variant} className={className}>
        {children}
      </IPhone15Frame>
      
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

export default IPhone15Frame