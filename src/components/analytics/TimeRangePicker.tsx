'use client'

import React from 'react'

export type TimeRange = '7d' | '30d' | '90d' | 'custom'

export const TimeRangePicker: React.FC<{
  value: TimeRange
  onChange: (v: TimeRange) => void
  className?: string
}> = ({ value, onChange, className = '' }) => {
  const options: { label: string; value: TimeRange }[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Custom', value: 'custom' }
  ]
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            value === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default TimeRangePicker

