'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Smartphone, Monitor, Globe, RotateCcw, Info, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { QRCodeDisplay } from '@/components/modern/wallet/WalletPassFrame'
import { CARD_DESIGN_THEME, getCardGradient, applyCardTheme, getResponsiveScale, CARD_COLORS } from '@/lib/cardDesignTheme'
import { WALLET_DIMENSIONS } from '@/lib/wallet-dimensions'
import type { Database } from '@/lib/supabase/types'

// Types for card data (supporting both stamp and membership)
export interface CardLivePreviewData {
  // Common fields
  cardType: 'stamp' | 'membership'
  businessId?: string
  businessName: string
  businessLogoUrl?: string
  cardName: string
  cardColor: string
  iconEmoji: string
  cardDescription?: string
  
  // Stamp card specific
  stampsRequired?: number
  reward?: string
  rewardDescription?: string
  howToEarnStamp?: string
  rewardDetails?: string
  earnedStampMessage?: string
  earnedRewardMessage?: string
  
  // Membership card specific
  totalSessions?: number
  membershipType?: string
  cost?: number
  durationDays?: number
  howToUseCard?: string
  membershipDetails?: string
  sessionUsedMessage?: string
  membershipExpiredMessage?: string
}

export interface CardLivePreviewProps {
  cardData: CardLivePreviewData
  className?: string
  showControls?: boolean
  defaultPlatform?: 'apple' | 'google' | 'pwa'
  sticky?: boolean
  onDimensionWarning?: (warnings: string[]) => void
}

// Platform view types
type PlatformView = 'apple' | 'google' | 'pwa'

export const CardLivePreview: React.FC<CardLivePreviewProps> = ({
  cardData,
  className = '',
  showControls = true,
  defaultPlatform = 'apple',
  sticky = true,
  onDimensionWarning
}) => {
  const [activePlatform, setActivePlatform] = useState<PlatformView>(defaultPlatform)
  const [showBackPage, setShowBackPage] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)
  const [demoProgress, setDemoProgress] = useState(40) // Demo progress percentage
  const [screenWidth, setScreenWidth] = useState(1024)

  // Responsive scaling
  useEffect(() => {
    const updateScreenWidth = () => setScreenWidth(window.innerWidth)
    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth)
    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  const scale = getResponsiveScale(screenWidth)
  const theme = applyCardTheme(activePlatform, cardData.cardType)

  // Calculate demo values
  const isStampCard = cardData.cardType === 'stamp'
  const maxValue = isStampCard ? (cardData.stampsRequired || 10) : (cardData.totalSessions || 10)
  const currentValue = Math.floor((maxValue * demoProgress) / 100)
  const gradientColors = getCardGradient(cardData.cardColor, cardData.cardType)

  // Platform switcher
  const platforms = [
    { id: 'apple' as const, name: 'Apple', icon: Smartphone, color: 'bg-gray-900' },
    { id: 'google' as const, name: 'Google', icon: Monitor, color: 'bg-blue-600' },
    { id: 'pwa' as const, name: 'PWA', icon: Globe, color: 'bg-purple-600' }
  ]

  // Validation warnings
  const getDimensionWarnings = () => {
    const warnings: string[] = []
    if (!cardData.businessLogoUrl) {
      warnings.push('Business logo missing - recommended for better branding')
    }
    if (cardData.cardName.length > 20) {
      warnings.push('Card name too long - may be truncated on mobile')
    }
    if (isStampCard && (cardData.stampsRequired || 0) > 20) {
      warnings.push('High stamp requirement - consider lower number for better completion rates')
    }
    return warnings
  }

  // Trigger warning callback
  useEffect(() => {
    const warnings = getDimensionWarnings()
    onDimensionWarning?.(warnings)
  }, [cardData, onDimensionWarning])

  // Card content renderer
  const renderCardContent = () => {
    const cardStyle = {
      width: `${theme.dimensions.card.width}px`,
      height: `${theme.dimensions.card.height}px`,
      transform: `scale(${scale})`,
      background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative mx-auto bg-black rounded-[2rem] p-2 shadow-2xl"
        style={cardStyle}
      >
        <div className="relative w-full h-full overflow-hidden rounded-[1.5rem]" 
             style={{ background: isDarkMode ? '#1a1a1a' : '#f5f5f5' }}>
          
          {/* iPhone-style status bar for Apple */}
          {activePlatform === 'apple' && (
            <div className="absolute top-2 left-4 right-4 flex justify-between items-center text-white text-xs opacity-90 z-10">
              <span>9:41</span>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3 h-1 bg-white rounded-sm"></div>
                </div>
              </div>
            </div>
          )}

          {/* Card Content */}
          <div 
            className="absolute inset-2 top-8 rounded-2xl overflow-hidden text-white"
            style={{
              background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
              ...theme.visual.shadows.card && { boxShadow: theme.visual.shadows.card }
            }}
          >
            {/* Header Section */}
            <div 
              className="px-4 py-3 border-b"
              style={{ borderColor: `rgba(255, 255, 255, ${theme.visual.opacity.divider})` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {cardData.businessLogoUrl ? (
                    <img 
                      src={cardData.businessLogoUrl} 
                      alt={cardData.businessName}
                      className="rounded-lg object-cover"
                      style={{ 
                        width: theme.layout.heights.logoSection, 
                        height: theme.layout.heights.logoSection 
                      }}
                    />
                  ) : (
                    <div 
                      className="rounded-lg bg-white/20 flex items-center justify-center font-medium"
                      style={{ 
                        width: theme.layout.heights.logoSection, 
                        height: theme.layout.heights.logoSection,
                        fontSize: theme.typography.businessName.fontSize
                      }}
                    >
                      {cardData.iconEmoji}
                    </div>
                  )}
                  <div>
                    <div 
                      className="font-medium"
                      style={{ 
                        fontSize: theme.typography.businessName.fontSize,
                        fontWeight: theme.typography.businessName.fontWeight,
                        opacity: theme.typography.businessName.opacity
                      }}
                    >
                      {cardData.businessName}
                    </div>
                    <div 
                      className="opacity-70"
                      style={{ fontSize: theme.typography.subtleText.fontSize }}
                    >
                      {isStampCard ? 'Loyalty Card' : 'Membership Card'}
                    </div>
                  </div>
                </div>
                
                {/* Info button */}
                <button 
                  onClick={() => setShowBackPage(!showBackPage)}
                  className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-xs hover:bg-white/10 transition-colors"
                >
                  <Info size={10} />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-4 py-3 flex-1">
              {/* Card Title */}
              <div 
                className="font-semibold mb-2"
                style={{ 
                  fontSize: theme.typography.cardTitle.fontSize,
                  fontWeight: theme.typography.cardTitle.fontWeight,
                  lineHeight: theme.typography.cardTitle.lineHeight
                }}
              >
                {cardData.cardName}
              </div>
              
              {/* Progress Section */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="font-bold"
                    style={{ 
                      fontSize: theme.typography.progressText.fontSize,
                      fontWeight: theme.typography.progressText.fontWeight
                    }}
                  >
                    {currentValue} / {maxValue}
                  </span>
                  <span style={{ fontSize: theme.typography.cardTitle.fontSize }}>
                    {cardData.iconEmoji}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div 
                  className="w-full bg-white/20 rounded-full"
                  style={{ height: theme.layout.heights.progressBar }}
                >
                  <motion.div 
                    className="bg-white rounded-full h-full transition-all duration-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentValue / maxValue) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                
                {/* Stamp Grid for stamp cards */}
                {isStampCard && theme.cardType.showStampGrid && (
                  <div className="grid grid-cols-5 gap-1 mt-3">
                    {Array.from({ length: maxValue }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded border-2 border-white/30 flex items-center justify-center text-xs transition-all duration-300 ${
                          i < currentValue ? 'bg-white/20' : 'bg-transparent'
                        }`}
                      >
                        {i < currentValue ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reward/Benefit Text */}
              <div 
                className="mb-3"
                style={{ 
                  fontSize: theme.typography.rewardText.fontSize,
                  opacity: theme.typography.rewardText.opacity
                }}
              >
                {isStampCard ? cardData.reward : `${cardData.membershipType} Membership`}
              </div>
            </div>

            {/* Bottom Section */}
            <div 
              className="px-4 py-3 border-t"
              style={{ borderColor: `rgba(255, 255, 255, ${theme.visual.opacity.divider})` }}
            >
              <div className="flex items-center justify-between">
                <div 
                  className="opacity-70"
                  style={{ fontSize: theme.typography.subtleText.fontSize }}
                >
                  {isStampCard ? 'Show to redeem' : 'Show to access'}
                </div>
                <QRCodeDisplay 
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/${isStampCard ? 'stamp' : 'membership'}/preview`}
                  size={parseInt(theme.platform.qrSize)} 
                  walletType={activePlatform}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`${sticky ? 'sticky top-6' : ''} ${className}`}>
      <Card className="p-6 bg-white border border-gray-200 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Live Preview</h3>
            <Badge variant="outline" className="text-xs">
              {cardData.cardType === 'stamp' ? 'Stamp Card' : 'Membership Card'}
            </Badge>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDimensions(!showDimensions)}
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBackPage(!showBackPage)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Platform Switcher */}
        {showControls && (
          <div className="mb-4">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setActivePlatform(platform.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activePlatform === platform.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <platform.icon className="w-4 h-4" />
                  <span>{platform.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dimension Info Panel */}
        {showDimensions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <h4 className="font-medium text-blue-900 mb-2">
              {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Wallet Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Card:</span> {theme.dimensions.card.width}×{theme.dimensions.card.height}px
              </div>
              <div>
                <span className="text-blue-700 font-medium">Aspect Ratio:</span> {theme.dimensions.card.aspectRatio}
              </div>
              {theme.dimensions.logo && (
                <div>
                  <span className="text-blue-700 font-medium">Logo:</span> {theme.dimensions.logo.width}×{theme.dimensions.logo.height}px
                </div>
              )}
              {theme.dimensions.strip && (
                <div>
                  <span className="text-blue-700 font-medium">Strip:</span> {theme.dimensions.strip.width}×{theme.dimensions.strip.height}px
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Warnings */}
        {getDimensionWarnings().length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-1">Optimization Suggestions</h4>
            {getDimensionWarnings().map((warning, i) => (
              <p key={i} className="text-sm text-amber-700">• {warning}</p>
            ))}
          </div>
        )}

        {/* Preview Container */}
        <div 
          className="flex justify-center rounded-2xl p-8 overflow-hidden transition-all duration-500"
          style={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            minHeight: '600px'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activePlatform}-${showBackPage}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {renderCardContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Control */}
        {showControls && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Demo Progress</span>
              <span className="text-sm text-gray-600">{demoProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={demoProgress}
              onChange={(e) => setDemoProgress(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default CardLivePreview