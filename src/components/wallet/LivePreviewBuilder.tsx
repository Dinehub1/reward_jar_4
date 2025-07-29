'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Smartphone, Apple, Chrome, Globe } from 'lucide-react'

interface CardTheme {
  background: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  textColor: string
  font: string
}

interface CardValues {
  stamps_used?: number
  total_stamps?: number
  sessions_used?: number
  total_sessions?: number
  expiry_date?: string
  cost?: number
}

interface CardData {
  id: string
  name: string
  business_name: string
  card_type: 'stamp' | 'membership'
  theme: CardTheme
  values: CardValues
  reward_description?: string
}

interface LivePreviewBuilderProps {
  cardData: CardData
  onCardDataChange?: (data: CardData) => void
  isEditable?: boolean
  showControls?: boolean
}

export default function LivePreviewBuilder({ 
  cardData, 
  onCardDataChange, 
  isEditable = false,
  showControls = true 
}: LivePreviewBuilderProps) {
  const [selectedWallet, setSelectedWallet] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [isGenerating, setIsGenerating] = useState(false)

  const updateCardData = (updates: Partial<CardData>) => {
    const newData = { ...cardData, ...updates }
    onCardDataChange?.(newData)
  }

  const updateTheme = (themeUpdates: Partial<CardTheme>) => {
    updateCardData({
      theme: { ...cardData.theme, ...themeUpdates }
    })
  }

  const updateValues = (valueUpdates: Partial<CardValues>) => {
    updateCardData({
      values: { ...cardData.values, ...valueUpdates }
    })
  }

  const generateWalletPass = async (walletType: 'apple' | 'google' | 'pwa') => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/wallet/${walletType}/${cardData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (walletType === 'apple' && response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${cardData.name.replace(/\s+/g, '_')}.pkpass`
        a.click()
        URL.revokeObjectURL(url)
      } else if (walletType === 'google' && response.ok) {
        const html = await response.text()
        const newWindow = window.open('', '_blank')
        newWindow?.document.write(html)
      } else if (walletType === 'pwa' && response.ok) {
        const html = await response.text()
        const newWindow = window.open('', '_blank')
        newWindow?.document.write(html)
      }
    } catch (error) {
      console.error(`Error generating ${walletType} wallet:`, error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Preview Controls */}
      {isEditable && showControls && (
        <Card>
          <CardHeader>
            <CardTitle>Card Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-name">Card Name</Label>
                <Input
                  id="card-name"
                  value={cardData.name}
                  onChange={(e) => updateCardData({ name: e.target.value })}
                  placeholder="Enter card name"
                />
              </div>
              <div>
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={cardData.business_name}
                  onChange={(e) => updateCardData({ business_name: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>
            </div>

            {/* Theme Controls */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <Input
                  id="primary-color"
                  type="color"
                  value={cardData.theme.primaryColor}
                  onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <Input
                  id="secondary-color"
                  type="color"
                  value={cardData.theme.secondaryColor}
                  onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="background">Background</Label>
                <Input
                  id="background"
                  type="color"
                  value={cardData.theme.background}
                  onChange={(e) => updateTheme({ background: e.target.value })}
                />
              </div>
            </div>

            {/* Card Values */}
            {cardData.card_type === 'stamp' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stamps-used">Current Stamps</Label>
                  <Input
                    id="stamps-used"
                    type="number"
                    value={cardData.values.stamps_used || 0}
                    onChange={(e) => updateValues({ stamps_used: parseInt(e.target.value) || 0 })}
                    min="0"
                    max={cardData.values.total_stamps || 10}
                  />
                </div>
                <div>
                  <Label htmlFor="total-stamps">Total Stamps</Label>
                  <Input
                    id="total-stamps"
                    type="number"
                    value={cardData.values.total_stamps || 10}
                    onChange={(e) => updateValues({ total_stamps: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sessions-used">Sessions Used</Label>
                  <Input
                    id="sessions-used"
                    type="number"
                    value={cardData.values.sessions_used || 0}
                    onChange={(e) => updateValues({ sessions_used: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="total-sessions">Total Sessions</Label>
                  <Input
                    id="total-sessions"
                    type="number"
                    value={cardData.values.total_sessions || 30}
                    onChange={(e) => updateValues({ total_sessions: parseInt(e.target.value) || 30 })}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={cardData.values.cost || 0}
                    onChange={(e) => updateValues({ cost: parseFloat(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reward-description">Reward Description</Label>
              <Input
                id="reward-description"
                value={cardData.reward_description || ''}
                onChange={(e) => updateCardData({ reward_description: e.target.value })}
                placeholder="Enter reward description"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Preview Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Live Wallet Preview
            </CardTitle>
            <Badge variant="outline">
              {cardData.card_type === 'stamp' ? 'Stamp Card' : 'Membership Card'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedWallet} onValueChange={(value) => setSelectedWallet(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apple" className="flex items-center gap-2">
                <Apple className="h-4 w-4" />
                Apple Wallet
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-2">
                <Chrome className="h-4 w-4" />
                Google Wallet
              </TabsTrigger>
              <TabsTrigger value="pwa" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                PWA Wallet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apple" className="mt-6">
              <AppleWalletPreview cardData={cardData} />
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={() => generateWalletPass('apple')}
                  disabled={isGenerating}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isGenerating ? 'Generating...' : 'Add to Apple Wallet'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="google" className="mt-6">
              <GoogleWalletPreview cardData={cardData} />
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={() => generateWalletPass('google')}
                  disabled={isGenerating}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isGenerating ? 'Generating...' : 'Add to Google Wallet'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pwa" className="mt-6">
              <PWAWalletPreview cardData={cardData} />
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={() => generateWalletPass('pwa')}
                  disabled={isGenerating}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {isGenerating ? 'Generating...' : 'Open PWA Wallet'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Apple Wallet Preview Component
function AppleWalletPreview({ cardData }: { cardData: CardData }) {
  const progress = cardData.card_type === 'stamp' 
    ? (cardData.values.stamps_used || 0) / (cardData.values.total_stamps || 10)
    : (cardData.values.sessions_used || 0) / (cardData.values.total_sessions || 30)

  return (
    <div className="flex justify-center">
      <div 
        className="w-80 h-48 rounded-xl shadow-lg relative overflow-hidden"
        style={{ backgroundColor: cardData.theme.background }}
      >
        {/* Card Header */}
        <div className="p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{cardData.business_name}</h3>
              <p className="text-sm opacity-90">{cardData.name}</p>
            </div>
            {cardData.theme.logo && (
              <img src={cardData.theme.logo} alt="Logo" className="w-8 h-8 rounded" />
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-4 py-2">
          {cardData.card_type === 'stamp' ? (
            <div className="flex items-center justify-between text-white">
              <div className="flex space-x-1">
                {Array.from({ length: cardData.values.total_stamps || 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border ${
                      i < (cardData.values.stamps_used || 0)
                        ? 'bg-white'
                        : 'bg-transparent border-white'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">
                {cardData.values.stamps_used || 0}/{cardData.values.total_stamps || 10}
              </span>
            </div>
          ) : (
            <div className="text-white">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Sessions Remaining</span>
                <span className="font-bold">
                  {(cardData.values.total_sessions || 30) - (cardData.values.sessions_used || 0)}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Reward Section */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white text-xs opacity-90">
            {cardData.reward_description || 'Complete your card for rewards!'}
          </p>
        </div>

        {/* QR Code Placeholder */}
        <div className="absolute bottom-4 right-4">
          <div className="w-8 h-8 bg-white/20 rounded border border-white/40 flex items-center justify-center">
            <div className="w-6 h-6 bg-white/60 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Google Wallet Preview Component  
function GoogleWalletPreview({ cardData }: { cardData: CardData }) {
  const progress = cardData.card_type === 'stamp' 
    ? (cardData.values.stamps_used || 0) / (cardData.values.total_stamps || 10)
    : (cardData.values.sessions_used || 0) / (cardData.values.total_sessions || 30)

  return (
    <div className="flex justify-center">
      <div className="w-80 h-48 bg-white rounded-lg shadow-lg border border-gray-200 relative overflow-hidden">
        {/* Header Bar */}
        <div 
          className="h-16 flex items-center justify-between px-4 text-white"
          style={{ backgroundColor: cardData.theme.primaryColor }}
        >
          <div>
            <h3 className="font-semibold">{cardData.business_name}</h3>
            <p className="text-sm opacity-90">{cardData.name}</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">G</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-3">
          {cardData.card_type === 'stamp' ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {cardData.values.stamps_used || 0}/{cardData.values.total_stamps || 10}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: Math.min(cardData.values.total_stamps || 10, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${
                      i < (cardData.values.stamps_used || 0)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Sessions</span>
                <span className="text-sm text-gray-600">
                  {(cardData.values.total_sessions || 30) - (cardData.values.sessions_used || 0)} left
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progress * 100}%`,
                    backgroundColor: cardData.theme.primaryColor 
                  }}
                />
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            {cardData.reward_description || 'Complete your card for rewards!'}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-2 right-2">
          <div className="w-6 h-6 bg-gray-100 rounded border flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-300 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

// PWA Wallet Preview Component
function PWAWalletPreview({ cardData }: { cardData: CardData }) {
  const progress = cardData.card_type === 'stamp' 
    ? (cardData.values.stamps_used || 0) / (cardData.values.total_stamps || 10)
    : (cardData.values.sessions_used || 0) / (cardData.values.total_sessions || 30)

  return (
    <div className="flex justify-center">
      <div className="w-80 h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-gray-200 relative overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">{cardData.business_name}</h3>
              <p className="text-sm text-gray-600">{cardData.name}</p>
            </div>
            <Badge 
              className="text-xs"
              style={{ backgroundColor: cardData.theme.primaryColor }}
            >
              PWA
            </Badge>
          </div>
        </div>

        {/* Progress Display */}
        <div className="p-4">
          {cardData.card_type === 'stamp' ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Stamps Collected</span>
                <span className="font-bold text-lg" style={{ color: cardData.theme.primaryColor }}>
                  {cardData.values.stamps_used || 0}/{cardData.values.total_stamps || 10}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: cardData.values.total_stamps || 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < (cardData.values.stamps_used || 0)
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Sessions</span>
                <span className="font-bold text-lg" style={{ color: cardData.theme.primaryColor }}>
                  {(cardData.values.total_sessions || 30) - (cardData.values.sessions_used || 0)} left
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{ 
                    width: `${Math.max(progress * 100, 10)}%`,
                    backgroundColor: cardData.theme.primaryColor 
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500 bg-white/50 p-2 rounded">
            {cardData.reward_description || 'Complete your card for rewards!'}
          </div>
        </div>
      </div>
    </div>
  )
} 