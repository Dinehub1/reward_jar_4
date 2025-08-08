'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  RefreshCw, 
  Play, 
  X, 
  RotateCcw,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useSWR from 'swr'

interface QueueInspectorProps {
  className?: string
}

interface QueueItem {
  id: string
  card_id: string
  customer_id?: string
  platform: string
  priority: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  processed_at?: string
  error_message?: string
  retry_count: number
  wallet_pass_id?: string
  metadata?: any
}

interface QueueData {
  queue: {
    pending: QueueItem[]
    processing: QueueItem[]
    completed: QueueItem[]
    failed: QueueItem[]
  }
  statistics: {
    totalItems: number
    successRate: number
    averageProcessingTime: number
    peakHours: Array<{ hour: number; count: number }>
    platformBreakdown: Record<string, number>
    errorFrequency: Array<{ error: string; count: number }>
  }
  health: {
    queueLength: number
    oldestPendingAge: number
    processingCapacity: number
    recommendedActions: string[]
  }
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch queue data')
  }
  return response.json()
}

export function QueueInspector({ className = '' }: QueueInspectorProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [actionResult, setActionResult] = useState<string | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>('')

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: QueueData }>(
    '/api/admin/wallet-chain/queue',
    fetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true
    }
  )

  const handleRefresh = () => {
    mutate()
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = (items: QueueItem[]) => {
    const itemIds = items.map(item => item.id)
    setSelectedItems(prev => {
      const allSelected = itemIds.every(id => prev.includes(id))
      return allSelected ? prev.filter(id => !itemIds.includes(id)) : [...new Set([...prev, ...itemIds])]
    })
  }

  const handleExecuteAction = async (action: string, priority: string = 'normal') => {
    if (selectedItems.length === 0) {
      setActionResult('No items selected')
      return
    }

    setIsProcessingAction(true)
    setActionResult(null)

    try {
      const response = await fetch('/api/admin/wallet-chain/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          itemIds: selectedItems,
          priority
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Action failed')
      }

      if (!result.success) {
        throw new Error(result.error || 'Action request failed')
      }

      setActionResult(`${action} completed: ${result.data.message}`)
      setSelectedItems([])
      mutate() // Refresh data
    } catch (err) {
      setActionResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsProcessingAction(false)
      setShowActionDialog(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const renderQueueTable = (items: QueueItem[], title: string, allowActions: boolean = false) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title} ({items.length})</span>
            {allowActions && items.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={items.every(item => selectedItems.includes(item.id))}
                  onCheckedChange={() => handleSelectAll(items)}
                  disabled={isProcessingAction}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {title.toLowerCase()} items
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    selectedItems.includes(item.id) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  {allowActions && (
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                      disabled={isProcessingAction}
                    />
                  )}
                  
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{item.card_id.substring(0, 8)}...</span>
                      <Badge variant="outline" className="text-xs">
                        {item.platform}
                      </Badge>
                      <Badge variant={item.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatTimeAgo(item.created_at)}
                      {item.processed_at && ` • Processed ${formatTimeAgo(item.processed_at)}`}
                      {item.retry_count > 0 && ` • Retries: ${item.retry_count}`}
                    </div>
                    {item.error_message && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {item.error_message}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(item.status)}
                    {item.customer_id && (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Queue Inspector</h2>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Queue Inspector</h2>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load queue data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const queueData = data?.data
  if (!queueData) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Queue Inspector</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage the wallet generation queue
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedItems.length > 0 && (
            <Badge variant="outline">
              {selectedItems.length} selected
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Result */}
      {actionResult && (
        <Alert variant={actionResult.startsWith('Error') ? 'destructive' : 'default'}>
          <AlertDescription>{actionResult}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Length</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueData.health.queueLength}</div>
            <p className="text-xs text-muted-foreground">
              Active items in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueData.statistics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueData.statistics.averageProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(queueData.health.oldestPendingAge / 60)}m</div>
            <p className="text-xs text-muted-foreground">
              Oldest pending item age
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Queue Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    onClick={() => { setSelectedAction('retry'); setShowActionDialog(true) }}
                    disabled={isProcessingAction}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Selected
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Retry Queue Items</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>Retry {selectedItems.length} selected items with priority:</p>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleExecuteAction('retry', 'normal')}>
                        Retry Items
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleExecuteAction('force')}
                disabled={isProcessingAction}
              >
                <Play className="h-4 w-4 mr-2" />
                Force Complete
              </Button>

              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleExecuteAction('fail')}
                disabled={isProcessingAction}
              >
                <X className="h-4 w-4 mr-2" />
                Mark Failed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({queueData.queue.pending.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({queueData.queue.processing.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({queueData.queue.completed.length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({queueData.queue.failed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {renderQueueTable(queueData.queue.pending, 'Pending Items', true)}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {renderQueueTable(queueData.queue.processing, 'Processing Items')}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {renderQueueTable(queueData.queue.completed.slice(0, 50), 'Completed Items')}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExecuteAction('clear_completed')}
              disabled={isProcessingAction}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old Completed (7+ days)
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {renderQueueTable(queueData.queue.failed, 'Failed Items', true)}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExecuteAction('clear_failed')}
              disabled={isProcessingAction}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Old Failed (30+ days)
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Health Recommendations */}
      {queueData.health.recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queueData.health.recommendedActions.map((action, index) => (
                <Alert key={index}>
                  <AlertDescription>{action}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}