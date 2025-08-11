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
}

export const CardLivePreview: React.FC<CardLivePreviewProps> = ({
  cardData,
  className = '',
  showControls = true,
  defaultPlatform = 'apple',
  sticky = false,
}) => {
  const [platform, setPlatform] = useState<'apple' | 'google' | 'pwa'>(defaultPlatform)
  const [progressPct, setProgressPct] = useState(40)

  useEffect(() => {
    setPlatform(defaultPlatform)
  }, [defaultPlatform])

  const isStamp = cardData.cardType === 'stamp'
  const maxValue = isStamp ? (cardData.stampsRequired || 10) : (cardData.totalSessions || 10)
  const currentValue = Math.max(0, Math.floor((progressPct / 100) * maxValue))

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

