'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { BarcodePreview } from '@/components/shared/BarcodePreview'
import type { CardLivePreviewData } from '@/components/unified/CardLivePreview'

export interface CardPresentationalProps {
  data: CardLivePreviewData
  platform: 'apple' | 'google' | 'pwa'
  progressPercent?: number // 0-100; optional demo control
}

export function CardPresentational({ data, platform, progressPercent }: CardPresentationalProps) {
  const isStamp = data.cardType === 'stamp'
  const maxValue = isStamp ? (data.stampsRequired || 10) : (data.totalSessions || 10)
  const pct = Math.max(0, Math.min(100, progressPercent ?? 40))
  const currentValue = Math.max(0, Math.floor((pct / 100) * maxValue))

  const gradient = useMemo(() => {
    const color = data.cardColor || '#6b7280'
    return `linear-gradient(135deg, ${color}CC, ${color})`
  }, [data.cardColor])

  // Platform-specific sizing nuances
  const wrapperWidthClass = platform === 'apple'
    ? 'w-[86%] max-w-[360px] rounded-3xl'
    : platform === 'google'
    ? 'w-[92%] max-w-[390px] rounded-xl'
    : 'w-[90%] max-w-[380px] rounded-2xl'

  // Stamp grid metrics
  const rewardsAvailable = isStamp ? Math.floor(currentValue / (maxValue || 1)) : 0
  const stampsUntilReward = isStamp ? Math.max(0, maxValue - (currentValue % maxValue || 0)) : 0
  const progressLabel = isStamp
    ? `${currentValue}/${maxValue} stamps`
    : `${currentValue}/${maxValue} sessions`

  return (
    <div className={`mx-auto mt-6 mb-4 ${wrapperWidthClass} p-0 shadow-xl border bg-white overflow-hidden`}>
      {/* Top strip / header */}
      <div className="px-4 py-3" style={{ background: gradient }}>
        <div className="flex items-center justify-between text-white/90">
          <div className="flex items-center gap-3">
            {data.businessLogoUrl ? (
              <Image src={data.businessLogoUrl} alt={data.businessName} width={28} height={28} className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-white/30 flex items-center justify-center text-base">{data.iconEmoji}</div>
            )}
            <div>
              <div className="text-sm/5 font-medium">{data.businessName}</div>
              <div className="text-xs/4 opacity-75">{isStamp ? 'Loyalty Card' : 'Membership Card'}</div>
            </div>
          </div>
          <div className="text-[10px] opacity-75 tracking-wider">{platform.toUpperCase()}</div>
        </div>
        <div className="text-white mt-2 text-lg font-semibold">{data.cardName}</div>
      </div>

      {/* Body */}
      {isStamp ? (
        <div className="px-4 pt-3 pb-4">
          {/* Reward summary / name (front side) */}
          {data.reward && (
            <div className="mb-2 text-[11px] text-gray-600">
              <span className="font-semibold">Reward:</span> {data.reward}
            </div>
          )}
          {/* Stamp grid */}
          {(() => {
            const total = maxValue
            const cols = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(total))))
            const rows = Math.ceil(total / cols)
            const cells = Array.from({ length: total }).map((_, i) => i < currentValue)
            return (
              <div className="mb-3">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {cells.map((filled, idx) {
                    <div key={idx} className={`aspect-square rounded-xl border flex items-center justify-center text-gray-400 ${filled ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-200'}`}>
                      <span className={`text-lg ${filled ? 'opacity-70' : 'opacity-40'}`}>{data.iconEmoji}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Metrics (concise progress format) */}
          <div className="text-gray-900">
            <div className="text-[10px] font-semibold tracking-wide text-gray-500">PROGRESS</div>
            <div className="text-2xl font-medium mt-1">{progressLabel}</div>
            {rewardsAvailable > 0 && (
              <div className="mt-1 text-xs text-gray-500">Rewards available: {rewardsAvailable}</div>
            )}
          </div>

          {/* Barcode preview */}
          <div className="mt-4">
            <BarcodePreview type={'QR_CODE'} value={`${data.businessName}-${data.cardName}-DEMO`} />
            <div className="text-center text-sm text-gray-500 mt-2">Tap … for details</div>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-3">
          {/* Reward summary / name (front side) */}
          {(data.reward || data.membershipType) && (
            <div className="mb-2 text-[11px] text-gray-600">
              <span className="font-semibold">{data.reward ? 'Reward' : 'Pass'}:</span> {data.reward || data.membershipType}
            </div>
          )}
          <div className="mt-1">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span className="font-semibold">{currentValue} / {maxValue} sessions</span>
              <span className="text-base">{data.iconEmoji}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div className="h-2 bg-gray-700 rounded-full" style={{ width: `${(currentValue / maxValue) * 100}%` }} />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-700">
            {`${data.membershipType || 'Membership'} • ${data.totalSessions || 10} sessions`}
          </div>
        </div>
      )}
    </div>
  )
}

export default CardPresentational


