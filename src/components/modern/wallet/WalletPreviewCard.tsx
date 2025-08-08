'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { designTokens } from '@/lib/design-tokens'
import { QRCodeDisplay, generateStampGrid, BackPageContent } from './WalletPassFrame'
import { WALLET_DIMENSIONS } from '@/lib/wallet-dimensions'
import type { Database } from '@/lib/supabase/types'

// Unified StampCard type from database
export type StampCard = Database['public']['Tables']['stamp_cards']['Row'] & {
  business?: {
    name: string
    logo_url?: string
  }
}

// Settings for customizing card layout
export interface WalletPreviewSettings {
  showBackPage?: boolean
  screenshotMode?: boolean
  isDarkMode?: boolean
  demoFilledStamps?: number
  showControls?: boolean
  debugOverlay?: boolean
}

// Main component props
export interface WalletPreviewCardProps {
  platform: 'apple' | 'google' | 'web'
  card: StampCard
  settings?: WalletPreviewSettings
  onToggleBack?: (show: boolean) => void
  className?: string
}

/**
 * Unified WalletPreviewCard component that renders platform-specific wallet previews
 * Consolidates AppleWalletView, GoogleWalletView, and WebPassView into a single reusable component
 */
export const WalletPreviewCard: React.FC<WalletPreviewCardProps> = ({
  platform,
  card,
  settings = {},
  onToggleBack,
  className = ''
}) => {
  const {
    showBackPage = false,
    screenshotMode = false,
    isDarkMode = false,
    demoFilledStamps = 3,
    debugOverlay = false
  } = settings

  // Generate QR code data for the card
  const qrCodeData = `${process.env.NEXT_PUBLIC_APP_URL}/stamp/${card.id}`
  
  // Map database fields to display data
  const cardData = {
    businessName: card.business?.name || 'Business',
    cardName: card.card_name,
    businessLogoUrl: card.business?.logo_url,
    cardColor: card.card_color || designTokens.colors.primary[600],
    iconEmoji: card.icon_emoji || '⭐',
    stampsRequired: card.stamps_required,
    reward: card.reward,
    rewardDescription: card.reward_description,
    cardDescription: card.card_description,
    howToEarnStamp: card.how_to_earn_stamp,
    rewardDetails: card.reward_details
  }

  // Platform-specific rendering
  switch (platform) {
    case 'apple':
      return (
        <AppleWalletPreview
          cardData={cardData}
          qrCodeData={qrCodeData}
          showBackPage={showBackPage}
          onToggleBack={onToggleBack}
          demoFilledStamps={demoFilledStamps}
          screenshotMode={screenshotMode}
          debugOverlay={debugOverlay}
          className={className}
        />
      )
    case 'google':
      return (
        <GoogleWalletPreview
          cardData={cardData}
          qrCodeData={qrCodeData}
          showBackPage={showBackPage}
          onToggleBack={onToggleBack}
          demoFilledStamps={demoFilledStamps}
          screenshotMode={screenshotMode}
          debugOverlay={debugOverlay}
          className={className}
        />
      )
    case 'web':
      return (
        <WebWalletPreview
          cardData={cardData}
          qrCodeData={qrCodeData}
          showBackPage={showBackPage}
          onToggleBack={onToggleBack}
          demoFilledStamps={demoFilledStamps}
          screenshotMode={screenshotMode}
          debugOverlay={debugOverlay}
          className={className}
        />
      )
    default:
      return null
  }
}

// Internal component props
interface WalletPreviewProps {
  cardData: ReturnType<typeof mapCardData>
  qrCodeData: string
  showBackPage: boolean
  onToggleBack?: (show: boolean) => void
  demoFilledStamps: number
  screenshotMode: boolean
  debugOverlay: boolean
  className: string
}

// Helper function to map card data
function mapCardData(card: StampCard) {
  return {
    businessName: card.business?.name || 'Business',
    cardName: card.card_name,
    businessLogoUrl: card.business?.logo_url,
    cardColor: card.card_color || designTokens.colors.primary[600],
    iconEmoji: card.icon_emoji || '⭐',
    stampsRequired: card.stamps_required,
    reward: card.reward,
    rewardDescription: card.reward_description,
    cardDescription: card.card_description,
    howToEarnStamp: card.how_to_earn_stamp,
    rewardDetails: card.reward_details
  }
}

/**
 * Apple Wallet Preview - iOS native design with flip animation
 */
const AppleWalletPreview: React.FC<WalletPreviewProps> = ({
  cardData,
  qrCodeData,
  showBackPage,
  onToggleBack,
  demoFilledStamps,
  screenshotMode,
  debugOverlay,
  className
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Debug overlay */}
      {debugOverlay && (
        <div className="absolute -top-6 left-0 text-xs text-gray-500 font-mono">
          Apple Wallet • 375×563px (2:3) • {showBackPage ? 'Back' : 'Front'}
        </div>
      )}
      
      {/* iPhone-style container with proper Apple Wallet dimensions */}
      <div 
        className="relative mx-auto bg-black rounded-[2rem] p-2 shadow-2xl"
        style={{ 
          width: `${WALLET_DIMENSIONS.apple.card.width}px`, 
          height: `${WALLET_DIMENSIONS.apple.card.height}px`
        }}
      >
        <div className="relative w-full h-full overflow-hidden rounded-[1.5rem] bg-gray-900">
          {/* Apple Wallet Pass with correct layout */}
          <div 
            className="absolute top-8 left-4 right-4 transition-transform duration-700"
            style={{
              height: '208px', // Proper Apple Wallet pass height
              transformStyle: 'preserve-3d',
              transform: showBackPage ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front Side */}
            <div 
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{ 
                backfaceVisibility: 'hidden',
                borderRadius: designTokens.wallet.pass.borderRadius,
                boxShadow: designTokens.wallet.shadows.card
              }}
            >
              {/* Background */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${cardData.cardColor}, ${cardData.cardColor}dd)`
                }}
              />
              
              {/* Subtle texture overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  background: `
                    radial-gradient(circle at 20% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), 
                    radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)
                  `
                }}
              />
              
              {/* Apple Wallet Pass Layout - Matches actual iOS design */}
              <div className="h-full text-white relative">
                {/* Info Button */}
                {!screenshotMode && onToggleBack && (
                  <button 
                    onClick={() => onToggleBack(true)}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-xs hover:bg-white/10 transition-colors"
                    style={{ fontSize: '10px' }}
                  >
                    i
                  </button>
                )}

                {/* Header Section - Logo and Business Name */}
                <div className="px-4 py-3 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {cardData.businessLogoUrl ? (
                        <img 
                          src={cardData.businessLogoUrl} 
                          alt={cardData.businessName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-medium">
                          {cardData.iconEmoji}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium opacity-90">
                          {cardData.businessName}
                        </div>
                        <div className="text-xs opacity-70">
                          Loyalty Card
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Section */}
                <div className="px-4 py-3 flex-1">
                  {/* Card Title */}
                  <div className="text-lg font-semibold mb-2">
                    {cardData.cardName}
                  </div>
                  
                  {/* Progress Bar and Stamps */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">
                        {demoFilledStamps} / {cardData.stampsRequired}
                      </span>
                      <span className="text-lg">{cardData.iconEmoji}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ 
                          width: `${(demoFilledStamps / cardData.stampsRequired) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Reward Description */}
                  <div className="text-sm opacity-90 mb-3">
                    {cardData.reward}
                  </div>
                </div>

                {/* Bottom Section - QR Code */}
                <div className="px-4 py-3 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="text-xs opacity-70">
                      Show to redeem
                    </div>
                    <QRCodeDisplay 
                      value={qrCodeData} 
                      size={40} 
                      walletType="apple"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Back Side */}
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRadius: designTokens.wallet.pass.borderRadius,
                boxShadow: designTokens.wallet.shadows.card
              }}
            >
              <div className="h-full p-4 bg-gray-800 text-white">
                {!screenshotMode && onToggleBack && (
                  <button 
                    onClick={() => onToggleBack(false)}
                    className="absolute top-4 right-4 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                  >
                    Done
                  </button>
                )}
                
                <BackPageContent 
                  cardData={cardData}
                  walletType="apple"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Google Wallet Preview - Material Design with expansion animation
 */
const GoogleWalletPreview: React.FC<WalletPreviewProps> = ({
  cardData,
  qrCodeData,
  showBackPage,
  onToggleBack,
  demoFilledStamps,
  screenshotMode,
  debugOverlay,
  className
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Debug overlay */}
      {debugOverlay && (
        <div className="absolute -top-6 left-0 text-xs text-gray-500 font-mono">
          Google Wallet • Material Design • {showBackPage ? 'Expanded' : 'Collapsed'}
        </div>
      )}
      
      {/* Android-style container */}
      <div className="w-80 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative">
          {/* Main card area */}
          <motion.div 
            className="transition-all duration-300"
            animate={{ height: showBackPage ? '400px' : '220px' }}
          >
            {/* Front/Header section */}
            <div 
              className="h-[220px] p-6 relative"
              style={{ backgroundColor: cardData.cardColor }}
            >
              <div className="flex justify-between items-start text-white">
                <div className="flex-1">
                  {/* Business info */}
                  <div className="flex items-center space-x-2 mb-2">
                    {cardData.businessLogoUrl && (
                      <img 
                        src={cardData.businessLogoUrl} 
                        alt={cardData.businessName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="text-sm opacity-90 font-medium">
                      {cardData.businessName}
                    </div>
                  </div>
                  
                  {/* Card name */}
                  <div className="text-xl font-semibold mb-4">
                    {cardData.cardName}
                  </div>
                  
                  {/* Progress */}
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold">
                      {demoFilledStamps} / {cardData.stampsRequired}
                    </div>
                    <div className="text-xl">{cardData.iconEmoji}</div>
                  </div>
                  
                  {/* Reward */}
                  <div className="text-sm opacity-90 mt-2">
                    {cardData.reward}
                  </div>
                </div>
                
                {/* QR Code */}
                <div className="ml-4">
                  <QRCodeDisplay 
                    value={qrCodeData} 
                    size={44} 
                    walletType="google"
                  />
                </div>
              </div>
            </div>
            
            {/* Expandable details */}
            {showBackPage && (
              <motion.div 
                className="p-6 bg-gray-50 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-sm">
                  <strong className="text-gray-700">Description:</strong>
                  <p className="text-gray-600 mt-1">{cardData.cardDescription}</p>
                </div>
                
                <div className="text-sm">
                  <strong className="text-gray-700">How to Earn:</strong>
                  <p className="text-gray-600 mt-1">{cardData.howToEarnStamp}</p>
                </div>
                
                <div className="text-sm">
                  <strong className="text-gray-700">Reward Details:</strong>
                  <p className="text-gray-600 mt-1">{cardData.rewardDetails}</p>
                </div>
                
                <div className="text-sm">
                  <strong className="text-gray-700">Support:</strong>
                  <p className="text-gray-600 mt-1">support@rewardjar.xyz</p>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Expand/Collapse Button */}
          {!screenshotMode && onToggleBack && (
            <button 
              onClick={() => onToggleBack(!showBackPage)}
              className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <motion.svg 
                className="w-4 h-4 text-gray-600"
                animate={{ rotate: showBackPage ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </motion.svg>
            </button>
          )}
        </div>
        
        {/* Branding */}
        <div className="px-4 pb-2 text-xs text-gray-500 text-center">
          Powered by RewardJar
        </div>
      </div>
    </div>
  )
}

/**
 * Web/PWA Wallet Preview - Modern glassmorphism design
 */
const WebWalletPreview: React.FC<WalletPreviewProps> = ({
  cardData,
  qrCodeData,
  showBackPage,
  onToggleBack,
  demoFilledStamps,
  screenshotMode,
  debugOverlay,
  className
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Debug overlay */}
      {debugOverlay && (
        <div className="absolute -top-6 left-0 text-xs text-gray-500 font-mono">
          PWA Web Card • Glassmorphism • Responsive
        </div>
      )}
      
      {/* PWA-style container */}
      <div className="w-72 bg-white rounded-xl shadow-lg overflow-hidden border backdrop-blur-sm">
        {/* Header with gradient */}
        <div 
          className="p-6 relative"
          style={{ 
            background: `linear-gradient(135deg, ${cardData.cardColor}20, ${cardData.cardColor}10)`
          }}
        >
          {/* Business header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {cardData.businessLogoUrl ? (
                <img 
                  src={cardData.businessLogoUrl} 
                  alt={cardData.businessName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: cardData.cardColor }}
                >
                  {cardData.businessName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="text-lg font-semibold text-gray-900">
                {cardData.businessName}
              </div>
            </div>
            <div className="text-2xl">{cardData.iconEmoji}</div>
          </div>
          
          {/* Card details */}
          <div className="mb-4">
            <div className="text-xl font-bold text-gray-900 mb-2">
              {cardData.cardName}
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="text-3xl font-bold"
                style={{ color: cardData.cardColor }}
              >
                {demoFilledStamps} / {cardData.stampsRequired}
              </div>
              
              {/* Progress bar */}
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    backgroundColor: cardData.cardColor,
                    width: `${(demoFilledStamps / cardData.stampsRequired) * 100}%`
                  }}
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {cardData.reward}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            {!screenshotMode && (
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                onClick={() => onToggleBack && onToggleBack(!showBackPage)}
              >
                {showBackPage ? 'Hide Details' : 'Show QR Code'}
              </button>
            )}
            <div className="text-xs text-gray-500">
              Powered by RewardJar
            </div>
          </div>
        </div>
        
        {/* QR Code section */}
        <motion.div 
          className="bg-gray-50 border-t"
          animate={{ height: showBackPage ? 'auto' : '100px' }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 flex flex-col items-center">
            <QRCodeDisplay 
              value={qrCodeData} 
              size={showBackPage ? 100 : 80} 
              walletType="pwa"
            />
            
            {/* Additional details when expanded */}
            {showBackPage && (
              <motion.div 
                className="mt-4 space-y-3 text-sm w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <strong className="text-gray-700">How to Earn:</strong>
                  <p className="text-gray-600 mt-1">{cardData.howToEarnStamp}</p>
                </div>
                
                <div>
                  <strong className="text-gray-700">Reward Details:</strong>
                  <p className="text-gray-600 mt-1">{cardData.rewardDetails}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}