'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'
import { 
  Chrome, 
  Minimize2, 
  Square, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Shield,
  Star,
  MoreHorizontal
} from 'lucide-react'

interface WebFrameProps {
  children: React.ReactNode
  browser?: 'chrome' | 'safari' | 'firefox' | 'edge'
  url?: string
  className?: string
}

const getBrowserColors = (browser: WebFrameProps['browser']) => {
  switch (browser) {
    case 'safari':
      return {
        frame: 'bg-gray-100',
        titleBar: 'bg-gray-50',
        addressBar: 'bg-white',
        accent: 'text-blue-500'
      }
    case 'firefox':
      return {
        frame: 'bg-gray-200',
        titleBar: 'bg-orange-100',
        addressBar: 'bg-white',
        accent: 'text-orange-500'
      }
    case 'edge':
      return {
        frame: 'bg-blue-50',
        titleBar: 'bg-blue-100',
        addressBar: 'bg-white',
        accent: 'text-blue-600'
      }
    case 'chrome':
    default:
      return {
        frame: 'bg-gray-100',
        titleBar: 'bg-gray-50',
        addressBar: 'bg-white',
        accent: 'text-blue-500'
      }
  }
}

export const WebFrame: React.FC<WebFrameProps> = ({ 
  children, 
  browser = 'chrome',
  url = 'https://rewardjar.xyz/card/preview',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const colors = getBrowserColors(browser)
  
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }
  
  return (
    <div className={`relative mx-auto ${className}`}>
      {/* Browser Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          ease: designTokens.animation.easing.out 
        }}
        className={`
          relative w-[800px] h-[600px] ${colors.frame} 
          rounded-lg overflow-hidden
        `}
        style={{ 
          boxShadow: designTokens.shadows.xl,
          border: '1px solid rgb(229 231 235)'
        }}
      >
        {/* Title Bar */}
        <div className={`${colors.titleBar} h-10 flex items-center justify-between px-4 border-b border-gray-200`}>
          {/* Window Controls (left) */}
          <div className="flex items-center space-x-2">
            <motion.div 
              className="w-3 h-3 bg-red-500 rounded-full cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
            <motion.div 
              className="w-3 h-3 bg-yellow-500 rounded-full cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
            <motion.div 
              className="w-3 h-3 bg-green-500 rounded-full cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          </div>
          
          {/* Title */}
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-700">RewardJar Card Preview</span>
          </div>
          
          {/* Window Controls (right) */}
          <div className="flex items-center space-x-1">
            <motion.button
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Minimize2 className="w-3 h-3 text-gray-600" />
            </motion.button>
            <motion.button
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Square className="w-3 h-3 text-gray-600" />
            </motion.button>
            <motion.button
              className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
        
        {/* Tab Bar */}
        <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-2">
          <div className="flex items-center space-x-1">
            {/* Active Tab */}
            <div className="bg-white rounded-t-lg px-4 py-2 flex items-center space-x-2 min-w-[200px] border-l border-r border-t border-gray-200">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 truncate">Card Preview</span>
              <motion.button
                className="p-0.5 rounded hover:bg-gray-100"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-3 h-3 text-gray-400" />
              </motion.button>
            </div>
            
            {/* Inactive Tab */}
            <div className="px-4 py-2 flex items-center space-x-2 min-w-[150px] text-gray-500 hover:bg-gray-50 rounded-t-lg transition-colors">
              <Star className="w-4 h-4" />
              <span className="text-sm truncate">Dashboard</span>
            </div>
            
            {/* New Tab Button */}
            <motion.button
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-4 h-4 border-2 border-gray-400 rounded-sm flex items-center justify-center">
                <div className="w-2 h-0.5 bg-gray-400" />
                <div className="w-0.5 h-2 bg-gray-400 absolute" />
              </div>
            </motion.button>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className={`${colors.addressBar} h-12 flex items-center px-4 border-b border-gray-200`}>
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1 mr-4">
            <motion.button
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </motion.button>
            <motion.button
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </motion.button>
            <motion.button
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
            >
              <motion.div
                animate={{ rotate: isLoading ? 360 : 0 }}
                transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </motion.div>
            </motion.button>
          </div>
          
          {/* Address Bar */}
          <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 py-1.5 border border-gray-200">
            <Shield className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-600 font-mono">{url}</span>
            <Star className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-2 ml-4">
            <motion.button
              className="p-2 rounded hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </motion.button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {/* Loading Bar */}
          {isLoading && (
            <motion.div
              className="absolute top-0 left-0 h-0.5 bg-blue-500 z-10"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          )}
          
          {/* Page Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0.7 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full overflow-auto"
            style={{ height: '528px' }} // Remaining height after bars
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: designTokens.animation.easing.out,
                delay: 0.2 
              }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// Enhanced version with interactive features
export const InteractiveWebFrame: React.FC<WebFrameProps & {
  onDeviceInteraction?: () => void
  showReflection?: boolean
}> = ({ 
  children, 
  browser = 'chrome',
  url,
  className = '',
  onDeviceInteraction,
  showReflection = true
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onDeviceInteraction}
      className="cursor-pointer"
    >
      <WebFrame browser={browser} url={url} className={className}>
        {children}
      </WebFrame>
      
      {showReflection && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-[600px] h-6"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)',
            filter: 'blur(12px)'
          }}
          animate={{
            opacity: [0.4, 0.2, 0.4]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.div>
  )
}

export default WebFrame