'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download, 
  Eye, 
  Loader2, 
  QrCode,
  Smartphone,
  AlertTriangle,
  ExternalLink,
  Apple,
  FileDown,
  Link as LinkIcon
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface OneClickWalletPreviewProps {
  className?: string
}

interface PreviewResult {
  cardId: string
  customerId?: string
  cardType: 'stamp' | 'membership'
  previews: {
    apple?: {
      success: boolean
      data?: any
      downloadUrl?: string
      error?: string
    }
    google?: {
      success: boolean
      data?: any
      downloadUrl?: string
      qrCodeUrl?: string
      error?: string
    }
    pwa?: {
      success: boolean
      data?: any
      previewUrl?: string
      error?: string
    }
  }
  timestamp: string
  processingTime: number
}

export function OneClickWalletPreview({ className = '' }: OneClickWalletPreviewProps) {
  const [cardId, setCardId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['apple', 'google', 'pwa'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [activePreview, setActivePreview] = useState<{ platform: string; data: any } | null>(null)

  const platforms = [
    { id: 'apple', name: 'Apple Wallet', icon: Apple, description: 'Generate .pkpass file' },
    { id: 'google', name: 'Google Wallet', icon: () => <span className="text-lg font-bold">G</span>, description: 'Generate JWT & QR code' },
    { id: 'pwa', name: 'PWA Card', icon: Smartphone, description: 'Generate PWA JSON' }
  ]

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handlePreview = async () => {
    await generateWallet('preview')
  }

  const handleDownload = async () => {
    await generateWallet('download')
  }

  const generateWallet = async (format: 'preview' | 'download') => {
    if (!cardId.trim()) {
      setError('Card ID is required')
      return
    }

    if (selectedPlatforms.length === 0) {
      setError('At least one platform must be selected')
      return
    }

    setIsGenerating(true)
    setError(null)
    setPreviewResult(null)

    try {
      const response = await fetch('/api/admin/wallet-chain/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardId.trim(),
          customerId: customerId.trim() || undefined,
          platforms: selectedPlatforms,
          format
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Preview generation failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'Preview request failed')
      }

      setPreviewResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShowPreview = (platform: string, data: any) => {
    setActivePreview({ platform, data })
    setShowPreviewModal(true)
  }

  const handleDownloadFile = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderPreviewData = () => {
    if (!activePreview) return null

    const { platform, data } = activePreview

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{platform.charAt(0).toUpperCase() + platform.slice(1)} Wallet Data</h4>
          <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">One-Click Wallet Preview</h2>
        <p className="text-sm text-muted-foreground">
          Generate and download wallet passes for Apple, Google, and PWA platforms
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Generate Wallet Passes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Card and Customer IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardId">Card ID *</Label>
              <Input
                id="cardId"
                type="text"
                placeholder="Enter card ID"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID (Optional)</Label>
              <Input
                id="customerId"
                type="text"
                placeholder="Enter customer ID for personalized passes"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>Select Platforms</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                    disabled={isGenerating}
                  />
                  <div className="flex items-center flex-1">
                    <platform.icon className="h-5 w-5 mr-2" />
                    <div>
                      <Label htmlFor={platform.id} className="text-sm font-medium">
                        {platform.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button onClick={handlePreview} disabled={isGenerating || !cardId.trim() || selectedPlatforms.length === 0}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={isGenerating || !cardId.trim() || selectedPlatforms.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {previewResult && (
        <div className="space-y-4">
          {/* Result Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generation Results</span>
                <Badge variant="outline">
                  {previewResult.cardType} card • {previewResult.processingTime}ms
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Generated at {new Date(previewResult.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Platform Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Apple Wallet */}
            {previewResult.previews.apple && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Apple className="h-5 w-5 mr-2" />
                    Apple Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {previewResult.previews.apple.success ? (
                    <>
                      <Badge variant="default" className="w-full justify-center">
                        ✅ Generated Successfully
                      </Badge>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleShowPreview('apple', previewResult.previews.apple?.data)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Data
                        </Button>
                        {previewResult.previews.apple.downloadUrl && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleDownloadFile(previewResult.previews.apple!.downloadUrl!, 'apple-wallet-pass.pkpass')}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Download .pkpass
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="destructive" className="w-full justify-center">
                        ❌ Generation Failed
                      </Badge>
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          {previewResult.previews.apple.error}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Google Wallet */}
            {previewResult.previews.google && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <span className="text-lg font-bold mr-2">G</span>
                    Google Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {previewResult.previews.google.success ? (
                    <>
                      <Badge variant="default" className="w-full justify-center">
                        ✅ Generated Successfully
                      </Badge>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleShowPreview('google', previewResult.previews.google?.data)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Data
                        </Button>
                        {previewResult.previews.google.downloadUrl && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open(previewResult.previews.google!.downloadUrl!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Save to Wallet
                          </Button>
                        )}
                        {previewResult.previews.google.qrCodeUrl && (
                          <div className="text-center">
                            <img 
                              src={previewResult.previews.google.qrCodeUrl} 
                              alt="QR Code for Google Wallet"
                              className="mx-auto w-20 h-20 border rounded"
                            />
                            <p className="text-xs text-muted-foreground mt-1">QR Code</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="destructive" className="w-full justify-center">
                        ❌ Generation Failed
                      </Badge>
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          {previewResult.previews.google.error}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PWA */}
            {previewResult.previews.pwa && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    PWA Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {previewResult.previews.pwa.success ? (
                    <>
                      <Badge variant="default" className="w-full justify-center">
                        ✅ Generated Successfully
                      </Badge>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleShowPreview('pwa', previewResult.previews.pwa?.data)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Data
                        </Button>
                        {previewResult.previews.pwa.previewUrl && (
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.open(previewResult.previews.pwa!.previewUrl!, '_blank')}
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Open PWA
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Badge variant="destructive" className="w-full justify-center">
                        ❌ Generation Failed
                      </Badge>
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          {previewResult.previews.pwa.error}
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {activePreview?.platform.charAt(0).toUpperCase() + activePreview?.platform.slice(1)} Wallet Preview
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {renderPreviewData()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}