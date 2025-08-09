'use client'

import React from 'react'
import useSWR from 'swr'
import { MetricCard } from '@/components/analytics/MetricCard'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CardsTab({ timeRange }: { timeRange: string }) {
  const { data, isLoading, error } = useSWR(`/api/analytics?timeRange=${timeRange}&section=cards`, fetcher)

  return (
    <div className="space-y-6">
      {isLoading && <Skeleton className="h-28 w-full" />}
      {error && (
        <div className="text-sm text-red-600">{error instanceof Error ? error.message : 'Failed to load cards analytics'}</div>
      )}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label="Stamp Cards" value={data?.data?.stampCards ?? '—'} />
            <MetricCard label="Membership Cards" value={data?.data?.membershipCards ?? '—'} />
            <MetricCard label="Active Wallets" value={data?.data?.activeWallets ?? '—'} />
            <MetricCard label="Redemptions" value={data?.data?.redemptions ?? '—'} />
          </div>
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm text-muted-foreground mb-2">Funnel (placeholder)</div>
            <div className="h-56 grid place-items-center text-muted-foreground">Chart coming soon</div>
          </div>
        </>
      )}
    </div>
  )
}

