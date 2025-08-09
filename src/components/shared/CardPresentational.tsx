'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import type { CardLivePreviewData } from '@/components/unified/CardLivePreview'

export interface CardPresentationalProps {
  data: CardLivePreviewData
  platform: 'apple' | 'google' | 'pwa'
  progressPercent?: number // 0-100; optional demo control
}

export const CardPresentational: React.FC<CardPresentationalProps> = ({ data, platform, progressPercent }) => {
  const isStamp = data.cardType === 'stamp'
  const maxValue = isStamp ? (data.stampsRequired || 10) : (data.totalSessions || 10)
  const pct = Math.max(0, Math.min(100, progressPercent ?? 40))
  const currentValue = Math.max(0, Math.floor((pct / 100) * maxValue))

  const gradient = useMemo(() => {
    const color = data.cardColor || '#6b7280'
    return `linear-gradient(135deg, ${color}CC, ${color})`
  }, [data.cardColor])

  return (
    <div className="rounded-3xl p-4 shadow-xl border bg-white">
      <div className="rounded-2xl overflow-hidden" style={{ background: gradient }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 text-white/90">
          <div className="flex items-center gap-3">
            {data.businessLogoUrl ? (
              <Image src={data.businessLogoUrl} alt={data.businessName} width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-white/30 flex items-center justify-center text-lg">{data.iconEmoji}</div>
            )}
            <div>
              <div className="text-sm/5 font-medium">{data.businessName}</div>
              <div className="text-xs/4 opacity-75">{isStamp ? 'Loyalty Card' : 'Membership Card'}</div>
            </div>
          </div>
          <div className="text-xs/4 opacity-75">{platform.toUpperCase()}</div>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 text-white">
          <div className="text-lg font-semibold">{data.cardName}</div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{currentValue} / {maxValue}</span>
              <span>{data.iconEmoji}</span>
            </div>
            <div className="w-full h-2 bg-white/30 rounded-full mt-2">
              <div className="h-2 bg-white rounded-full" style={{ width: `${(currentValue / maxValue) * 100}%` }} />
            </div>
          </div>
          <div className="mt-3 text-sm opacity-90">
            {isStamp ? (data.reward || 'Collect stamps to unlock rewards') : `${data.membershipType || 'Membership'} • ${data.totalSessions || 10} sessions`}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardPresentational

