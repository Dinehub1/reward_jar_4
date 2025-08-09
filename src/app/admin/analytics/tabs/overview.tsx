'use client'

import React from 'react'
import useSWR from 'swr'
import { MetricCard } from '@/components/analytics/MetricCard'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function OverviewTab({ timeRange }: { timeRange: string }) {
  const { data, isLoading, error } = useSWR(`/api/analytics?timeRange=${timeRange}`, fetcher)
  const summary = data?.data || {}

  return (
    <div className="space-y-6">
      {isLoading && <Skeleton className="h-28 w-full" />}
      {error && (
        <div className="text-sm text-red-600">{error instanceof Error ? error.message : 'Failed to load analytics'}</div>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Businesses" value={summary.total_businesses ?? '—'} delta={{ value: 2.1, positive: true }} />
            <MetricCard label="Total Customers" value={summary.total_users ?? '—'} delta={{ value: 1.4, positive: true }} />
            <MetricCard label="Total Cards" value={summary.total_cards ?? '—'} delta={{ value: -0.6, positive: false }} />
            <MetricCard label="Events (30d)" value={summary.total_events ?? '—'} />
          </div>

          <div className="rounded-md border bg-white p-4">
            <div className="text-sm text-muted-foreground mb-2">Trends (placeholder)</div>
            <div className="h-56 grid place-items-center text-muted-foreground">Chart coming soon</div>
          </div>
        </>
      )}
    </div>
  )
}

