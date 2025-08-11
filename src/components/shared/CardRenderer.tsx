/**
 * Canonical Card Renderer
 * Single source of truth for wallet pass rendering across all components
 * Used by both customer-facing and admin preview components
 */

'use client'

import React from 'react'

export interface CardRendererData {
  // Core card info
  cardType: 'stamp' | 'membership'
  businessName: string
  cardName: string
  cardColor: string
  iconEmoji: string
  cardDescription?: string
  
  // Progress data
  current: number
  total: number
  
  // Stamp card specific
  reward?: string
  
  // Membership specific
  cost?: number
  sessionsRemaining?: number
  
  // Status
  isCompleted?: boolean
  isExpired?: boolean
}

export interface CardRendererProps {
  data: CardRendererData
  platform: 'apple' | 'google' | 'pwa'
  size?: 'small' | 'medium' | 'large'
  showProgress?: boolean
  className?: string
}

/**
 * Canonical card renderer - all wallet previews should use this
 */
export function CardRenderer({ 
  data, 
  platform, 
  size = 'medium',
  showProgress = true,
  className = '' 
}: CardRendererProps) {
  const progressPercent = Math.min((data.current / data.total) * 100, 100)
  
  // Platform-specific styling
  const platformStyles = {
    apple: {
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    },
    google: {
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      fontFamily: 'Roboto, sans-serif'
    },
    pwa: {
      borderRadius: '8px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
      fontFamily: 'Inter, sans-serif'
    }
  }
  
  // Size variants
  const sizeClasses = {
    small: 'w-64 h-40',
    medium: 'w-80 h-52',
    large: 'w-96 h-64'
  }
  
  const textSizes = {
    small: { title: 'text-sm', subtitle: 'text-xs', emoji: 'text-lg' },
    medium: { title: 'text-base', subtitle: 'text-sm', emoji: 'text-xl' },
    large: { title: 'text-lg', subtitle: 'text-base', emoji: 'text-2xl' }
  }
  
  return (
    <div 
      className={`${sizeClasses[size]} ${className} relative overflow-hidden text-white`}
      style={{
        backgroundColor: data.cardColor,
        ...platformStyles[platform]
      }}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={textSizes[size].emoji}>{data.iconEmoji}</span>
            <div>
              <h3 className={`${textSizes[size].title} font-semibold`}>
                {data.cardName}
              </h3>
              <p className={`${textSizes[size].subtitle} opacity-90`}>
                {data.businessName}
              </p>
            </div>
          </div>
          {platform === 'apple' && (
            <div className="text-right">
              <div className={`${textSizes[size].subtitle} opacity-75`}>
                Wallet
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Section */}
      {showProgress && (
        <div className="px-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <span className={`${textSizes[size].subtitle} font-medium`}>
              {data.cardType === 'stamp' ? 'Stamps' : 'Sessions'}
            </span>
            <span className={`${textSizes[size].subtitle}`}>
              {data.current} / {data.total}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-white/30 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* Status message */}
          <div className="mt-2">
            {data.isCompleted ? (
              <span className={`${textSizes[size].subtitle} text-green-200 font-medium`}>
                🎉 {data.cardType === 'stamp' ? 'Reward Ready!' : 'Membership Complete!'}
              </span>
            ) : data.isExpired ? (
              <span className={`${textSizes[size].subtitle} text-red-200 font-medium`}>
                ⚠️ Expired
              </span>
            ) : (
              <span className={`${textSizes[size].subtitle} opacity-75`}>
                {data.cardType === 'stamp' 
                  ? `${data.total - data.current} more for reward`
                  : `${data.sessionsRemaining || (data.total - data.current)} sessions left`
                }
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        {data.cardType === 'stamp' && data.reward && (
          <div className={`${textSizes[size].subtitle} opacity-75`}>
            🎁 {data.reward}
          </div>
        )}
        {data.cardType === 'membership' && data.cost && (
          <div className={`${textSizes[size].subtitle} opacity-75`}>
            💎 ${(data.cost / 100).toFixed(2)} value
          </div>
        )}
      </div>
      
      {/* Platform indicator */}
      <div className="absolute top-2 right-2">
        <div className={`${textSizes[size].subtitle} opacity-50`}>
          {platform === 'apple' ? '🍎' : platform === 'google' ? '🤖' : '📱'}
        </div>
      </div>
    </div>
  )
}

/**
 * Data transformation helper - converts various data formats to CardRendererData
 */
export function transformToCardRendererData(input: any): CardRendererData {
  // Handle different input formats from various components
  if (input.cardType && input.businessName) {
    // Already in correct format (CardLivePreviewData)
    return {
      cardType: input.cardType,
      businessName: input.businessName,
      cardName: input.cardName,
      cardColor: input.cardColor,
      iconEmoji: input.iconEmoji,
      cardDescription: input.cardDescription,
      current: input.cardType === 'stamp' ? (input.currentStamps || 0) : (input.sessionsUsed || 0),
      total: input.cardType === 'stamp' ? (input.stampsRequired || 10) : (input.totalSessions || 10),
      reward: input.reward,
      cost: input.cost,
      isCompleted: input.isCompleted,
      isExpired: input.isExpired
    }
  }
  
  // Handle database objects (from admin views)
  if (input.stamp_cards || input.membership_cards) {
    const isStamp = !!input.stamp_cards
    const cardData = isStamp ? input.stamp_cards[0] : input.membership_cards[0]
    const businessData = cardData?.businesses?.[0]
    
    return {
      cardType: isStamp ? 'stamp' : 'membership',
      businessName: businessData?.name || 'Business',
      cardName: cardData?.name || 'Card',
      cardColor: cardData?.card_color || '#10b981',
      iconEmoji: cardData?.icon_emoji || '⭐',
      cardDescription: cardData?.card_description,
      current: isStamp ? (input.current_stamps || 0) : (input.sessions_used || 0),
      total: isStamp ? (cardData?.total_stamps || 10) : (cardData?.total_sessions || 10),
      reward: cardData?.reward_description,
      cost: cardData?.cost,
      isCompleted: false, // Calculate based on current/total
      isExpired: false // Calculate based on expiry_date
    }
  }
  
  // Fallback for unknown formats
  console.warn('Unknown card data format, using defaults:', input)
  return {
    cardType: 'stamp',
    businessName: 'Business',
    cardName: 'Card',
    cardColor: '#10b981',
    iconEmoji: '⭐',
    current: 0,
    total: 10
  }
}