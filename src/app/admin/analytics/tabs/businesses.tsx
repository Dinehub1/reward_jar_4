'use client'

import React from 'react'
import useSWR from 'swr'
import { MetricCard } from '@/components/analytics/MetricCard'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BusinessesTab({ timeRange }: { timeRange: string }) {
  const { data, isLoading, error } = useSWR(`/api/analytics?timeRange=${timeRange}&section=businesses`, fetcher)

  return (
    <div className="space-y-6">
      {isLoading && <Skeleton className="h-28 w-full" />}
      {error && (
        <div className="text-sm text-red-600">{error instanceof Error ? error.message : 'Failed to load businesses analytics'}</div>
      )}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard label="Active Businesses" value={data?.data?.active ?? '—'} />
            <MetricCard label="Flagged" value={data?.data?.flagged ?? '—'} />
            <MetricCard label="Requests" value={data?.data?.requests ?? '—'} />
          </div>
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm text-muted-foreground mb-2">Top Businesses (placeholder)</div>
            <div className="h-56 grid place-items-center text-muted-foreground">Table coming soon</div>
          </div>
        </>
      )}
    </div>
  )
}

