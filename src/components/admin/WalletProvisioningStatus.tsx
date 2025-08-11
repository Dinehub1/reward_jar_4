'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Apple, Chrome, Globe, Check, X, RefreshCw, Smartphone } from 'lucide-react'
import { adminNotifications } from '@/lib/admin-events'
import ClientDate from '@/components/shared/ClientDate'

interface WalletStatus {
  type: 'apple' | 'google' | 'pwa'
  status: 'pending' | 'provisioned' | 'failed' | 'not_supported'
  lastUpdated?: string
  error?: string
}

interface WalletProvisioningStatusProps {
  cardId: string
  cardName: string
  onStatusUpdate?: (statuses: WalletStatus[]) => void
}

export function WalletProvisioningStatus({ 
  cardId, 
  cardName, 
  onStatusUpdate 
}: WalletProvisioningStatusProps) {
  const [walletStatuses, setWalletStatuses] = useState<WalletStatus[]>([
    { type: 'apple', status: 'pending' },
    { type: 'google', status: 'pending' },
    { type: 'pwa', status: 'pending' }
  ])
  const [isProvisioning, setIsProvisioning] = useState(false)

  useEffect(() => {
    // Check initial status
    checkWalletStatuses()
  }, [cardId])

  useEffect(() => {
    onStatusUpdate?.(walletStatuses)
  }, [walletStatuses, onStatusUpdate])

  const checkWalletStatuses = async () => {
    try {
      const response = await fetch(`/api/admin/wallet-status/${cardId}`)
      if (response.ok) {
        const data = await response.json()
        setWalletStatuses(data.statuses || walletStatuses)
      }
    } catch (error) {
        console.error("Error:", error)
      }`
      )
    }
  }

  const provisionToWallets = async () => {
    setIsProvisioning(true)
    try {
      const response = await fetch('/api/admin/wallet-provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, cardName })
      })

      if (response.ok) {
        const data = await response.json()
        setWalletStatuses(data.statuses)
      } else {
        const errorText = await response.text()
        throw new Error(`Provisioning failed: ${errorText}`)
      }
    } catch (error) {
        console.error("Error:", error)
      }`
      )
      // Update statuses to show failures
      setWalletStatuses(prev => prev.map(status => ({
        ...status,
        status: 'failed',
        error: 'Provisioning failed'
      })))
    } finally {
      setIsProvisioning(false)
    }
  }

  const getStatusIcon = (status: WalletStatus['status']) => {
    switch (status) {
      case 'provisioned':
        return <Check className="w-4 h-4 text-green-600" />
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />
      case 'pending':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: WalletStatus['status']) => {
    switch (status) {
      case 'provisioned':
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Provisioning...</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getWalletIcon = (type: WalletStatus['type']) => {
    switch (type) {
      case 'apple':
        return <Apple className="w-5 h-5" />
      case 'google':
        return <Chrome className="w-5 h-5" />
      case 'pwa':
        return <Globe className="w-5 h-5" />
    }
  }

  const getWalletName = (type: WalletStatus['type']) => {
    switch (type) {
      case 'apple':
        return 'Apple Wallet'
      case 'google':
        return 'Google Wallet'
      case 'pwa':
        return 'PWA Wallet'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Wallet Provisioning Status
        </CardTitle>
        <p className="text-sm text-gray-600">
          Multi-platform wallet support for {cardName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {walletStatuses.map((wallet) => (
          <div 
            key={wallet.type}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getWalletIcon(wallet.type)}
              <div>
                <p className="font-medium">{getWalletName(wallet.type)}</p>
                {wallet.error && (
                  <p className="text-sm text-red-600">{wallet.error}</p>
                )}
                {wallet.lastUpdated && (
                  <p className="text-xs text-gray-500">
                    Updated: <ClientDate format="datetime" />
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(wallet.status)}
              {getStatusBadge(wallet.status)}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              onClick={provisionToWallets}
              disabled={isProvisioning}
              className="flex-1"
            >
              {isProvisioning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Provision to All Wallets
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={checkWalletStatuses}
              disabled={isProvisioning}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Provisioning Summary */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Provisioning Status Summary:</p>
          <div className="space-y-1">
            <p>✅ Ready: {walletStatuses.filter(w => w.status === 'provisioned').length}/3</p>
            <p>⏳ Pending: {walletStatuses.filter(w => w.status === 'pending').length}/3</p>
            <p>❌ Failed: {walletStatuses.filter(w => w.status === 'failed').length}/3</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}