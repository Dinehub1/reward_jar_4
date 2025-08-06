'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'

// Unified interfaces for all wallet components
export interface WalletCardData {
  businessName?: string
  cardName?: string
  businessLogoUrl?: string
  cardColor?: string
  iconEmoji?: string
  stampsRequired?: number
  reward?: string
  rewardDescription?: string
  cardDescription?: string
  howToEarnStamp?: string
  rewardDetails?: string
  // New properties for enhanced card designs
  backgroundImageUrl?: string
  cardStyle?: 'gradient' | 'image' | 'solid'
  textColor?: string
  accentColor?: string
}

export interface WalletViewProps {
  cardData: WalletCardData
  activeView?: 'apple' | 'google' | 'pwa'
  side?: 'front' | 'back'
  showBackPage?: boolean
  onToggleBack?: (show: boolean) => void
  demoFilledStamps?: number
  screenshotMode?: boolean
  isDarkMode?: boolean
  className?: string
}

// Unified QR Code Display Component
interface QRCodeDisplayProps {
  value: string
  size?: number
  walletType?: 'apple' | 'google' | 'pwa' | 'default'
  className?: string
}

export const QRCodeDisplay = React.memo<QRCodeDisplayProps>(({ 
  value, 
  size = 48, 
  walletType = 'default',
  className = ''
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')
  
  // Dynamic sizing based on wallet type for optimal user experience
  const getOptimalSize = React.useCallback(() => {
    switch (walletType) {
      case 'apple': return Math.min(size, 48) // Compact for Apple's design
      case 'google': return Math.min(size, 44) // Smaller for Google's header
      case 'pwa': return Math.max(size, 48) // Larger for better PWA visibility
      default: return size
    }
  }, [size, walletType])

  const optimalSize = getOptimalSize()
  
  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const qrcode = await import('qrcode')
        const url = await qrcode.toDataURL(value, {
          width: optimalSize * 2, // Higher resolution for crisp display
          margin: walletType === 'google' ? 0 : 1, // Minimal margin for Google
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M' // Medium error correction for better scanning
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }
    
    if (value) generateQR()
  }, [value, optimalSize, walletType])

  if (qrCodeUrl) {
    return (
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        width={optimalSize} 
        height={optimalSize} 
        className={`transition-all duration-200 ${
          walletType === 'google' ? 'rounded-sm' : 'rounded'
        } ${className}`}
        style={{ imageRendering: 'crisp-edges' }} // Ensure crisp QR code rendering
      />
    )
  }

  return (
    <div 
      className={`bg-white flex items-center justify-center border-2 border-dashed border-gray-300 animate-pulse ${
        walletType === 'google' ? 'rounded-sm' : 'rounded'
      } ${className}`}
      style={{ width: optimalSize, height: optimalSize }}
    >
      <div className="w-6 h-6 text-gray-400 text-xs font-mono flex items-center justify-center">
        QR
      </div>
    </div>
  )
})

QRCodeDisplay.displayName = 'QRCodeDisplay'

// Unified Stamp Grid Generator
export interface StampGridResult {
  stamps: React.ReactElement[]
  progressPercentage: number
}

export const generateStampGrid = (
  totalStamps: number, 
  filledStamps: number, 
  walletType: 'apple' | 'google' | 'pwa',
  iconEmoji: string = '☕'
): StampGridResult => {
  const stamps: React.ReactElement[] = []
  const progressPercentage = (filledStamps / totalStamps) * 100

  // Platform-specific styling based on design tokens
  const getStampStyles = (isFilled: boolean, isNext: boolean, index: number) => {
    const baseStyles = `
      flex items-center justify-center text-lg font-bold 
      transition-all duration-${designTokens.animation.duration.normal} 
      border-2 relative overflow-hidden cursor-pointer
    `
    
    const sizeStyles = {
      apple: 'w-12 h-12 rounded-xl',  // Larger stamps for better visibility
      google: 'w-10 h-10 rounded-xl', 
      pwa: 'w-10 h-10 rounded-xl'
    }
    
    // Enhanced styling for Apple wallet to match reference
    const stateStyles = walletType === 'apple' 
      ? isFilled 
        ? 'bg-white border-gray-300 text-gray-800 shadow-md scale-105' 
        : 'bg-white/20 border-white/40 text-white/60 backdrop-blur-sm hover:bg-white/30'
      : isFilled 
        ? 'bg-white/25 border-white/70 text-white backdrop-blur-sm scale-105 shadow-sm' 
        : isNext && walletType === 'pwa'
        ? 'border-white border-opacity-70 text-white text-opacity-70 animate-pulse'
        : 'border-white/40 text-white/70 bg-white/5'
    
    return `${baseStyles} ${sizeStyles[walletType]} ${stateStyles}`
  }

  for (let i = 0; i < totalStamps; i++) {
    const isFilled = i < filledStamps
    const isNext = i === filledStamps // Next stamp to be filled
    
    stamps.push(
      <motion.div
        key={i}
        className={getStampStyles(isFilled, isNext, i)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.3,
          delay: i * 0.05, // Staggered animation
          ease: designTokens.animation.easing.out
        }}
        whileHover={{ scale: walletType === 'apple' ? 1.05 : 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Stamp content */}
        {isFilled ? (
          <span className="animate-bounce-in text-2xl">{iconEmoji}</span>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {walletType === 'apple' && (
              <div className="w-6 h-6 rounded-full border-2 border-current opacity-40" />
            )}
            {walletType !== 'apple' && (
              <span className="text-lg opacity-40">{iconEmoji}</span>
            )}
          </div>
        )}
        
        {/* Enhanced visual effects */}
        {isFilled && walletType === 'apple' && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        )}
        
        {/* Progress indicator for filled stamps */}
        {isFilled && walletType === 'pwa' && (
          <div className="absolute -inset-0.5 rounded border border-green-400 opacity-50 animate-pulse"></div>
        )}
      </motion.div>
    )
  }
  
  return { stamps, progressPercentage }
}

// Unified Wallet Pass Frame Container
interface WalletPassFrameProps {
  children: React.ReactNode
  walletType: 'apple' | 'google' | 'pwa'
  cardColor?: string
  showBackPage?: boolean
  screenshotMode?: boolean
  isDarkMode?: boolean
  className?: string
}

export const WalletPassFrame: React.FC<WalletPassFrameProps> = ({
  children,
  walletType,
  cardColor = designTokens.colors.primary[600],
  showBackPage = false,
  screenshotMode = false,
  isDarkMode = false,
  className = ''
}) => {
  // Platform-specific frame styles using design tokens
  const getFrameStyles = () => {
    const baseStyles = `
      relative overflow-hidden transition-all duration-${designTokens.animation.duration.normal}
    `
    
    switch (walletType) {
      case 'apple':
        return `
          ${baseStyles}
          rounded-${designTokens.borderRadius.xl}
          shadow-${isDarkMode ? 'xl' : 'lg'}
          ${screenshotMode ? '' : 'hover:shadow-2xl'}
        `
      case 'google':
        return `
          ${baseStyles}
          rounded-${designTokens.borderRadius['2xl']}
          shadow-${isDarkMode ? 'xl' : 'lg'}
          bg-white
          ${screenshotMode ? '' : 'hover:shadow-2xl'}
        `
      case 'pwa':
        return `
          ${baseStyles}
          rounded-${designTokens.borderRadius.xl}
          border border-opacity-30
          ${isDarkMode 
            ? 'bg-gray-900/80 border-gray-600' 
            : 'bg-white/80 border-gray-200'
          }
          backdrop-blur-lg
          ${screenshotMode ? '' : 'hover:backdrop-blur-xl'}
        `
      default:
        return baseStyles
    }
  }

  return (
    <motion.div
      className={`flex justify-center items-center w-full h-full p-4 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: designTokens.animation.easing.out 
      }}
      whileHover={{ 
        scale: screenshotMode ? 1 : 1.02,
        transition: { duration: 0.2 }
      }}
    >
      <div
        className={getFrameStyles()}
        style={{ 
          width: designTokens.wallet.pass.width,
          height: designTokens.wallet.pass.height,
          ...(walletType === 'apple' && {
            perspective: '1000px'
          })
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

// Unified Back Page Content Component
interface BackPageContentProps {
  cardData: WalletCardData
  walletType: 'apple' | 'google' | 'pwa'
  onToggleBack?: (show: boolean) => void
  screenshotMode?: boolean
  isDarkMode?: boolean
}

export const BackPageContent: React.FC<BackPageContentProps> = ({
  cardData,
  walletType,
  onToggleBack,
  screenshotMode = false,
  isDarkMode = false
}) => {
  const getBackgroundStyles = () => {
    switch (walletType) {
      case 'apple':
        return 'bg-gray-900 text-white'
      case 'google':
        return 'bg-gray-50 text-gray-900'
      case 'pwa':
        return isDarkMode 
          ? 'bg-gray-800/90 text-white backdrop-blur-lg' 
          : 'bg-white/90 text-gray-900 backdrop-blur-lg'
      default:
        return 'bg-white text-gray-900'
    }
  }

  const getDoneButtonStyles = () => {
    switch (walletType) {
      case 'apple':
        return 'text-blue-400 hover:bg-blue-400/10'
      case 'google':
        return 'text-blue-600 hover:bg-blue-50'
      case 'pwa':
        return isDarkMode 
          ? 'text-blue-400 hover:bg-blue-400/10' 
          : 'text-blue-600 hover:bg-blue-50'
      default:
        return 'text-blue-600 hover:bg-blue-50'
    }
  }

  return (
    <div 
      className={`h-full px-6 py-4 overflow-y-auto ${getBackgroundStyles()}`}
      style={{ 
        borderRadius: designTokens.wallet.pass.borderRadius,
        ...(walletType === 'apple' && {
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        })
      }}
    >
      {/* Done Button */}
      {!screenshotMode && onToggleBack && (
        <button 
          onClick={() => onToggleBack(false)}
          className={`
            absolute top-3 right-3 text-sm font-medium px-3 py-1 rounded-md 
            transition-colors duration-200 ${getDoneButtonStyles()}
          `}
        >
          Done
        </button>
      )}
      
      <h3 className="font-bold mb-4 text-lg mt-2">Pass Details</h3>
      <div className="space-y-3 text-sm">
        <div>
          <span className="opacity-70 font-medium">Reward:</span><br/>
          <span>{cardData.rewardDescription || cardData.reward || 'No reward description'}</span>
        </div>
        <div>
          <span className="opacity-70 font-medium">Description:</span><br/>
          <span>{cardData.cardDescription || 'No card description'}</span>
        </div>
        <div>
          <span className="opacity-70 font-medium">How to Earn:</span><br/>
          <span>{cardData.howToEarnStamp || 'No instructions provided'}</span>
        </div>
        <div>
          <span className="opacity-70 font-medium">Additional Info:</span><br/>
          <span>{cardData.rewardDetails || 'No additional details'}</span>
        </div>
        <div>
          <span className="opacity-70 font-medium">Support:</span><br/>
          <span className={walletType === 'apple' ? 'text-blue-400' : 'text-blue-600'}>
            support@rewardjar.xyz
          </span>
        </div>
      </div>
    </div>
  )
}