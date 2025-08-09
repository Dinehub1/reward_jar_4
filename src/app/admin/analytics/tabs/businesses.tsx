'use client'

import React from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BusinessesTab({ timeRange }: { timeRange: string }) {
  const { data, isLoading, error } = useSWR(`/api/analytics?timeRange=${timeRange}&section=businesses`, fetcher)

  return (
    <div className="space-y-6">
      {isLoading && <div className="text-sm text-gray-500">Loading businesses…</div>}
      {error && <div className="text-sm text-red-600">Failed to load businesses analytics</div>}
      <pre className="bg-gray-50 p-4 rounded border text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

