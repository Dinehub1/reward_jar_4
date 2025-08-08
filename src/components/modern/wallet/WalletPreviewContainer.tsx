'use client'

/**
 * 🧪 LEGACY WALLET PREVIEW CONTAINER
 * 
 * ⚠️  DEPRECATED: This component is kept for development/testing only.
 * ⚠️  For PRODUCTION use, always use CardLivePreview from @/components/unified/CardLivePreview
 * 
 * Status: Legacy system - Use CardLivePreview for all new implementations
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Monitor, RotateCcw, Camera, Sun, Moon, Ruler } from 'lucide-react'
import { WalletPreviewCard } from './WalletPreviewCard'
import type { StampCard } from './WalletPreviewCard'
import { designTokens } from '@/lib/design-tokens'
import type { WalletCardData } from './WalletPassFrame'
import { WALLET_DIMENSIONS, calculatePreviewDimensions } from '@/lib/wallet-dimensions'

export interface WalletPreviewContainerProps {
  cardData: WalletCardData
  defaultView?: 'apple' | 'google' | 'web'
  showControls?: boolean
  demoFilledStamps?: number
  className?: string
}

export const WalletPreviewContainer: React.FC<WalletPreviewContainerProps> = ({
  cardData,
  defaultView = 'apple',
  showControls = true,
  demoFilledStamps = 3,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<'apple' | 'google' | 'web'>(defaultView)
  const [showBackPage, setShowBackPage] = useState(false)
  const [screenshotMode, setScreenshotMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)

  const deviceOptions = [
    { id: 'apple' as const, label: 'iPhone', icon: Smartphone },
    { id: 'google' as const, label: 'Android', icon: Smartphone },
    { id: 'web' as const, label: 'Web', icon: Monitor }
  ]

  // Convert WalletCardData to StampCard format
  const convertToStampCard = (walletData: WalletCardData): StampCard => ({
    id: 'preview-card',
    business_id: 'preview-business',
    card_name: walletData.cardName || 'Preview Card',
    reward: walletData.reward || 'Free Item',
    reward_description: walletData.rewardDescription || 'Reward description',
    stamps_required: walletData.stampsRequired || 10,
    status: 'active',
    card_color: walletData.cardColor || designTokens.colors.primary[600],
    icon_emoji: walletData.iconEmoji || '⭐',
    barcode_type: 'QR_CODE' as const,
    card_expiry_days: 60,
    reward_expiry_days: 15,
    stamp_config: {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: 'none' as const
    },
    card_description: walletData.cardDescription || 'Collect stamps to get rewards',
    how_to_earn_stamp: walletData.howToEarnStamp || 'Buy anything to get a stamp',
    reward_details: walletData.rewardDetails || 'Reward details',
    earned_stamp_message: 'You earned a stamp!',
    earned_reward_message: 'You unlocked a reward!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business: {
      name: walletData.businessName || 'Preview Business',
      logo_url: walletData.businessLogoUrl
    }
  })

  const renderWalletView = () => {
    const stampCard = convertToStampCard(cardData)
    
    const previewSettings = {
      showBackPage,
      screenshotMode,
      isDarkMode,
      demoFilledStamps,
      debugOverlay: false
    }

    return (
      <WalletPreviewCard
        platform={activeView}
        card={stampCard}
        settings={previewSettings}
        onToggleBack={setShowBackPage}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Device & Mode Selector */}
      {showControls && !screenshotMode && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Device Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
            {deviceOptions.map(device => (
              <motion.button
                key={device.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveView(device.id)
                  setShowBackPage(false) // Reset to front page when switching devices
                }}
                className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all ${
                  activeView === device.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <device.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{device.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* Flip Card */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBackPage(!showBackPage)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Flip Card</span>
            </motion.button>

            {/* Dimensions Info */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                showDimensions
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Show Wallet Dimensions"
            >
              <Ruler className="w-4 h-4" />
              <span className="text-sm">Dimensions</span>
            </motion.button>

            {/* Screenshot Mode */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreenshotMode(!screenshotMode)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                screenshotMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Screenshot</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Dimensions Info Panel */}
      {showDimensions && !screenshotMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Platform Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Ruler className="w-4 h-4 text-green-600" />
                {activeView === 'apple' ? 'Apple Wallet' : activeView === 'google' ? 'Google Wallet' : 'PWA Wallet'} Specs
              </h3>
              
              {(() => {
                const currentDimensions = WALLET_DIMENSIONS[activeView as keyof typeof WALLET_DIMENSIONS]
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Card Size:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {currentDimensions.card.width}×{currentDimensions.card.height}px
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Aspect Ratio:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {currentDimensions.card.aspectRatio}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Logo Size:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {currentDimensions.logo.width}×{currentDimensions.logo.height}px
                      </span>
                    </div>
                    {'strip' in currentDimensions && currentDimensions.strip && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Strip Size:</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {currentDimensions.strip.width}×{currentDimensions.strip.height}px
                        </span>
                      </div>
                    )}
                    {'hero' in currentDimensions && currentDimensions.hero && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Hero Size:</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {currentDimensions.hero.width}×{currentDimensions.hero.height}px
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Compliance Status */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Compliance Status</h3>
              <div className="space-y-2">
                {Object.entries(WALLET_DIMENSIONS).map(([platform, dims]) => (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600 dark:text-gray-300">
                      {platform === 'apple' ? 'Apple Wallet' : platform === 'google' ? 'Google Wallet' : 'PWA'}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">Compatible</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Design Guidelines */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Design Guidelines</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {activeView === 'apple' && (
                  <>
                    <div>• Use high contrast logos</div>
                    <div>• Maintain 2:3 aspect ratio</div>
                    <div>• Optimize for Retina displays</div>
                  </>
                )}
                {activeView === 'google' && (
                  <>
                    <div>• Square logos work best</div>
                    <div>• Follow Material Design</div>
                    <div>• Use adequate padding</div>
                  </>
                )}
                {activeView === 'web' && (
                  <>
                    <div>• Progressive enhancement</div>
                    <div>• Responsive design</div>
                    <div>• Fast loading images</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Preview Container */}
      <div 
        className="flex justify-center rounded-2xl p-8 overflow-hidden transition-all duration-500"
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          boxShadow: isDarkMode 
            ? 'inset 0 2px 10px rgba(0, 0, 0, 0.3)'
            : 'inset 0 2px 10px rgba(0, 0, 0, 0.08)',
          minHeight: '600px' // Increased to accommodate proper 2:3 aspect ratio
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeView}-${showBackPage}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 0.3, 
              ease: designTokens.animation.easing.out 
            }}
          >
            {renderWalletView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Screenshot Mode Instructions */}
      {screenshotMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <p className="text-sm text-blue-700 dark:text-blue-300">
            📸 Screenshot mode enabled - All controls are hidden for clean captures
          </p>
        </motion.div>
      )}
    </div>
  )
}