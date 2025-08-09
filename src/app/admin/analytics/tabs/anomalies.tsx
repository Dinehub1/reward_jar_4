'use client'

import React from 'react'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AnomaliesTab({ timeRange }: { timeRange: string }) {
  const { data, isLoading, error } = useSWR(`/api/analytics/anomalies?timeRange=${timeRange}`, fetcher)

  return (
    <div className="space-y-6">
      {isLoading && <Skeleton className="h-28 w-full" />}
      {error && (
        <div className="text-sm text-red-600">{error instanceof Error ? error.message : 'Failed to load anomalies'}</div>
      )}
      {!isLoading && !error && (
        <div className="rounded-md border bg-white p-4">
          <div className="text-sm text-muted-foreground mb-2">Anomalies (placeholder)</div>
          <div className="h-56 grid place-items-center text-muted-foreground">Anomaly table coming soon</div>
        </div>
      )}
    </div>
  )
}

