'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TimeRangePicker, { type TimeRange } from '@/components/analytics/TimeRangePicker'

const OverviewTab = dynamic(() => import('./tabs/overview'), { ssr: false })
const BusinessesTab = dynamic(() => import('./tabs/businesses'), { ssr: false })
const CardsTab = dynamic(() => import('./tabs/cards'), { ssr: false })
const AnomaliesTab = dynamic(() => import('./tabs/anomalies'), { ssr: false })

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'cards' | 'anomalies'>('overview')

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Business performance, funnels, and anomalies</p>
          </div>
          <TimeRangePicker value={timeRange} onChange={setTimeRange} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab timeRange={timeRange} />
          </TabsContent>
          <TabsContent value="businesses">
            <BusinessesTab timeRange={timeRange} />
          </TabsContent>
          <TabsContent value="cards">
            <CardsTab timeRange={timeRange} />
          </TabsContent>
          <TabsContent value="anomalies">
            <AnomaliesTab timeRange={timeRange} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
}

