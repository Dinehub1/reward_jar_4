'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'

interface IPhone15FrameProps {
  children: React.ReactNode
  variant?: 'natural' | 'black' | 'white' | 'blue' | 'pro'
  className?: string
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

export const IPhone15Frame: React.FC<IPhone15FrameProps> = ({ 
  children, 
  variant = 'natural',
  className = ''
}) => {
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
          rounded-[3rem] p-2
        `}
        style={{ 
          boxShadow: designTokens.wallet.shadows.device,
          filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))'
        }}
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
                className="w-full h-full relative"
              >
                {children}
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
    </div>
  )
}

// Enhanced version with interactive features
export const InteractiveIPhone15Frame: React.FC<IPhone15FrameProps & {
  onDeviceInteraction?: () => void
  showReflection?: boolean
}> = ({ 
  children, 
  variant = 'natural',
  className = '',
  onDeviceInteraction,
  showReflection = true
}) => {
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