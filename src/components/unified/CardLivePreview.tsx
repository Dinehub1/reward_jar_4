'use client'

import React, { useEffect, useMemo, useState } from 'react'
import CardPresentational from '@/components/shared/CardPresentational'

export interface CardLivePreviewData {
  cardType: 'stamp' | 'membership'
  businessId?: string
  businessName: string
  businessLogoUrl?: string
  cardName: string
  cardColor: string
  iconEmoji: string
  cardDescription?: string
  // Stamp
  stampsRequired?: number
  reward?: string
  // Membership
  totalSessions?: number
  membershipType?: string
}

export interface CardLivePreviewProps {
  cardData: CardLivePreviewData
  className?: string
  showControls?: boolean
  defaultPlatform?: 'apple' | 'google' | 'pwa'
  sticky?: boolean
  // Preview state toggles
  simulateRewardReady?: boolean
  simulateExpirySoon?: boolean
  // Debug mode - use real platform builders
  debugMode?: boolean
}

export function CardLivePreview({ 
  cardData,
  className = '',
  showControls = true,
  defaultPlatform = 'apple',
  sticky = false,
  simulateRewardReady = false,
  simulateExpirySoon = false,
  debugMode = false,
 }: CardLivePreviewProps) {
  const [platform, setPlatform] = useState<'apple' | 'google' | 'pwa'>(defaultPlatform)
  const [progressPct, setProgressPct] = useState(40)

  useEffect(() => {
    setPlatform(defaultPlatform)
  }, [defaultPlatform])

  const isStamp = cardData.cardType === 'stamp'
  const maxValue = isStamp ? (cardData.stampsRequired || 10) : (cardData.totalSessions || 10)
  const currentValueBase = Math.max(0, Math.floor((progressPct / 100) * maxValue))
  
  // In debug mode, use real wallet builders for pixel-perfect previews
  const [realPassData, setRealPassData] = useState<any>(null)
  
  useEffect(() => {
    if (debugMode) {
      generateRealPassData()
    }
  }, [debugMode, platform, cardData, progressPct])
  
  const generateRealPassData = async () => {
    try {
      // Prepare input data for builders
      const builderInput = {
        customerCardId: 'preview-' + Date.now(),
        isMembershipCard: cardData.type === 'membership',
        cardData: {
          name: cardData.cardName || 'Preview Card',
          total_stamps: cardData.type === 'stamp' ? maxValue : undefined,
          reward_description: cardData.reward || 'Preview reward',
          card_color: cardData.cardColor || '#10b981'
        },
        businessData: {
          name: cardData.businessName || 'Preview Business',
          description: 'Preview business description'
        },
        derived: {
          progressLabel: `${currentValue}/${maxValue}`,
          remainingLabel: `${maxValue - currentValue} remaining`,
          primaryValue: currentValue.toString(),
          progressPercent: progressPct,
          remainingCount: maxValue - currentValue,
          isCompleted: currentValue >= maxValue,
          isExpired: false,
          membershipCost: cardData.type === 'membership' ? 50 : undefined,
          membershipTotalSessions: cardData.type === 'membership' ? maxValue : undefined,
          membershipExpiryDate: cardData.type === 'membership' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
        }
      }
      
      // Import and use real builders
      if (platform === 'apple') {
        const { buildApplePassJson } = await import('@/lib/wallet/builders/apple-pass-builder')
        const passData = buildApplePassJson(builderInput)
        setRealPassData(passData)
      } else if (platform === 'google') {
        const { buildGooglePassJson } = await import('@/lib/wallet/builders/google-pass-builder')
        const passData = buildGooglePassJson(builderInput)
        setRealPassData(passData)
      } else if (platform === 'pwa') {
        const { buildPWAPassData } = await import('@/lib/wallet/builders/pwa-pass-builder')
        const passData = buildPWAPassData(builderInput)
        setRealPassData(passData)
      }
    } catch (error) {
        console.error("Error:", error)
      }
  }
  const currentValue = simulateRewardReady ? maxValue : currentValueBase

  const gradient = useMemo(() => {
    const color = cardData.cardColor || '#6b7280'
    return `linear-gradient(135deg, ${color}CC, ${color})`
  }, [cardData.cardColor])

  return (
    <div className={`${sticky ? 'sticky top-8' : ''} ${className}`}>
      {showControls && (
        <div className="mb-3 flex items-center gap-2">
          {(['apple','google','pwa'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-md text-sm border ${platform===p ? 'bg-white shadow-sm' : 'bg-gray-50'} border-gray-200`}
            >
              {p === 'apple' && 'Apple'}
              {p === 'google' && 'Google'}
              {p === 'pwa' && 'PWA'}
            </button>
          ))}
        </div>
      )}

      <CardPresentational data={cardData} platform={platform} progressPercent={progressPct} />

      {showControls && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span>Demo Progress</span>
            <span className="text-gray-500">{progressPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progressPct}
            onChange={(e) => setProgressPct(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

export default CardLivePreview

