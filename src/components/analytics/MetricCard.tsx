'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export const MetricCard: React.FC<{
  label: string
  value: string | number
  delta?: { value: number; positive?: boolean }
  icon?: React.ReactNode
}> = ({ label, value, delta, icon }) => {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            {delta && (
              <div className={`text-xs ${delta.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta.positive ? '▲' : '▼'} {Math.abs(delta.value).toFixed(1)}%
              </div>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export default MetricCard

