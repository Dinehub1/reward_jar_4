'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
// Import the enhanced LivePreview component from card creation
import React, { useState as usePreviewState, useEffect as usePreviewEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Activity,
  TrendingUp,
  Star,
  Clock,
  Building,
  QrCode,
  Apple,
  Chrome,
  Globe
} from 'lucide-react'

// Enhanced QR Code Display Component (from card creation)
const QRCodeDisplay = React.memo(({ 
  value, 
  size = 120, 
  walletType = 'default' 
}: { 
  value: string, 
  size?: number,
  walletType?: 'apple' | 'google' | 'pwa' | 'default'
}) => {
  const [qrCodeUrl, setQrCodeUrl] = usePreviewState<string>('')
  
  // Dynamic sizing based on wallet type for optimal user experience
  const getOptimalSize = () => {
    switch (walletType) {
      case 'apple': return Math.min(size, 60) // Compact for Apple's design
      case 'google': return Math.min(size, 50) // Smaller for Google's header
      case 'pwa': return Math.max(size, 80) // Larger for better PWA visibility
      default: return size
    }
  }

  const optimalSize = getOptimalSize()
  
  usePreviewEffect(() => {
    const generateQR = async () => {
      try {
        const qrcode = await import('qrcode')
        const url = await qrcode.toDataURL(value, {
          width: optimalSize * 2, // Higher resolution for crisp display
          margin: walletType === 'google' ? 0 : 1, // Minimal margin for Google
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M' // Medium error correction for better scanning
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    }
    
    if (value) generateQR()
  }, [value, optimalSize, walletType])

  if (qrCodeUrl) {
    return (
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        width={optimalSize} 
        height={optimalSize} 
        className={`transition-all duration-200 ${
          walletType === 'google' ? 'rounded-sm' : 'rounded'
        }`}
        style={{ imageRendering: 'crisp-edges' }} // Ensure crisp QR code rendering
      />
    )
  }

  return (
    <div 
      className={`bg-white flex items-center justify-center border-2 border-dashed border-gray-300 animate-pulse ${
        walletType === 'google' ? 'rounded-sm' : 'rounded'
      }`}
      style={{ width: optimalSize, height: optimalSize }}
    >
      <QrCode className="w-6 h-6 text-gray-400" />
    </div>
  )
})

// Enhanced LivePreview Component (from card creation)
const EnhancedLivePreview = React.memo(({ 
  cardData, 
  activeView = 'apple',
  showBackPage = false
}: { 
  cardData: any
  activeView?: 'apple' | 'google' | 'pwa'
  showBackPage?: boolean
}) => {
  const qrCodeData = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rewardjar.xyz'}/join/${cardData.id}`
  
  // Calculate demo progress (show about 40% completion for preview)
  const totalStamps = cardData.stamps_required || cardData.total_stamps || 10
  const demoFilledStamps = Math.max(1, Math.floor(totalStamps * 0.4))
  
  // Generate stamp grid for visual representation
  const generateStampGrid = (total: number, filled: number = demoFilledStamps, walletType: 'apple' | 'google' | 'pwa' = 'apple') => {
    const stamps = []
    const maxCols = 5
    
    for (let i = 0; i < total; i++) {
      const isFilled = i < filled
      
      stamps.push(
        <div
          key={i}
          className={`relative w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold transition-all duration-500 ${
            isFilled 
              ? 'bg-white bg-opacity-30 border-white text-white scale-105' 
              : 'border-white border-opacity-40 text-white text-opacity-60'
          }`}
        >
          <span className={isFilled ? 'animate-bounce-in' : ''}>{cardData.icon_emoji || '☕'}</span>
        </div>
      )
    }
    
    return stamps
  }
  
  const AppleWalletView = () => (
    <div className="w-64 h-[420px] bg-black rounded-[2rem] p-2 shadow-xl">
      <div className="relative w-full h-full bg-gray-900 rounded-[1.5rem] overflow-hidden">
        {!showBackPage ? (
          // Front Page
          <div className="h-full p-4 text-white relative" style={{ 
            background: `linear-gradient(135deg, ${cardData.card_color || '#8B4513'}, ${cardData.card_color || '#8B4513'}dd)` 
          }}>
            {/* Header */}
            <div className="text-sm opacity-80 mb-1">{cardData.businesses?.name || cardData.business_name || 'Business Name'}</div>
            <div className="text-lg font-semibold mb-4">{cardData.card_name || cardData.name || 'Card Name'}</div>
            
            {/* Stamp Grid */}
            <div className="mb-4">
              <div className="grid grid-cols-5 gap-1 justify-center">
                {generateStampGrid(totalStamps, demoFilledStamps, 'apple')}
              </div>
            </div>
            
            {/* Reward Progress */}
            <div className="mb-4 text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {demoFilledStamps} / {totalStamps}
              </div>
              <div className="text-sm opacity-80">{cardData.reward || cardData.reward_description || 'Reward'}</div>
            </div>
            
            {/* QR Code */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="bg-white p-2 rounded inline-block">
                <QRCodeDisplay value={qrCodeData} size={60} walletType="apple" />
              </div>
              <div className="text-xs opacity-60 mt-2">Tap ••• for details</div>
            </div>
          </div>
        ) : (
          // Back Page
          <div className="h-full p-4 text-white bg-gray-800">
            <div className="text-center mb-6">
              <div className="text-lg font-semibold mb-2">Card Information</div>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-gray-300 mb-1">Description</div>
                <div>{cardData.card_description || 'Collect stamps to get rewards'}</div>
              </div>
              
              <div>
                <div className="text-gray-300 mb-1">How to Earn</div>
                <div>{cardData.how_to_earn_stamp || 'Buy anything to get a stamp'}</div>
              </div>
              
              <div>
                <div className="text-gray-300 mb-1">Reward Details</div>
                <div>{cardData.reward_details || cardData.reward_description || 'Reward details'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const GoogleWalletView = () => (
    <div className="w-80 bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4" style={{ backgroundColor: cardData.card_color || '#8B4513' }}>
        <div className="flex justify-between items-start text-white mb-4">
          <div>
            <div className="text-sm opacity-90">{cardData.businesses?.name || cardData.business_name || 'Business Name'}</div>
            <div className="text-xl font-semibold mt-1">{cardData.card_name || cardData.name || 'Card Name'}</div>
          </div>
          <div className="bg-white p-1 rounded">
            <QRCodeDisplay value={qrCodeData} size={40} walletType="google" />
          </div>
        </div>
        
        {/* Stamp Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-5 gap-1">
            {generateStampGrid(totalStamps, demoFilledStamps, 'google')}
          </div>
        </div>
        
        {/* Reward Progress */}
        <div className="text-center text-white">
          <div className="text-xl font-bold mb-2">
            {demoFilledStamps} / {totalStamps}
          </div>
          <div className="text-sm opacity-90">{cardData.reward || cardData.reward_description || 'Reward'}</div>
        </div>
      </div>
      
      {showBackPage && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium text-gray-700 mb-1">Card Description</div>
              <div className="text-gray-600">{cardData.card_description || 'Collect stamps to get rewards'}</div>
            </div>
            
            <div>
              <div className="font-medium text-gray-700 mb-1">How to Earn Stamps</div>
              <div className="text-gray-600">{cardData.how_to_earn_stamp || 'Buy anything to get a stamp'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const PWACardView = () => (
    <div className="w-72 bg-white rounded-xl shadow-lg overflow-hidden border">
      <div className="p-6" style={{ backgroundColor: `${cardData.card_color || '#8B4513'}20` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-900">{cardData.businesses?.name || cardData.business_name || 'Business Name'}</div>
          <div className="text-2xl">{cardData.icon_emoji || '☕'}</div>
        </div>
        
        <div className="mb-4">
          <div className="text-xl font-bold text-gray-900 mb-3">{cardData.card_name || cardData.name || 'Card Name'}</div>
          
          {/* Enhanced Stamp Grid for PWA with Progress Visualization */}
          <div className="mb-4">
            <div className="grid grid-cols-5 gap-1 mb-3">
              {generateStampGrid(totalStamps, demoFilledStamps, 'pwa').map((stamp, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index < demoFilledStamps 
                      ? 'border-2 text-white transform scale-105' 
                      : 'border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                  style={{ 
                    backgroundColor: index < demoFilledStamps ? cardData.card_color || '#8B4513' : 'transparent',
                    borderColor: index < demoFilledStamps ? cardData.card_color || '#8B4513' : '#d1d5db',
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {cardData.icon_emoji || '☕'}
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.round((demoFilledStamps / totalStamps) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {Math.round((demoFilledStamps / totalStamps) * 100)}% Complete
            </div>
          </div>
          
          {/* Reward Progress */}
          <div className="text-center mb-4">
            <div className="text-xl font-bold" style={{ color: cardData.card_color || '#8B4513' }}>
              {demoFilledStamps} / {totalStamps}
            </div>
            <div className="text-sm text-gray-600">{cardData.reward || cardData.reward_description || 'Reward'}</div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 border-t flex justify-center">
        <QRCodeDisplay value={qrCodeData} size={80} walletType="pwa" />
      </div>
      
      {showBackPage && (
        <div className="p-6">
          <div className="space-y-4 text-sm">
            <div>
              <div className="font-semibold text-gray-700 mb-2">Card Information</div>
              <div className="text-gray-600">{cardData.card_description || 'Collect stamps to get rewards'}</div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-2">How to Earn Stamps</div>
              <div className="text-gray-600">{cardData.how_to_earn_stamp || 'Buy anything to get a stamp'}</div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-2">Reward Details</div>
              <div className="text-gray-600">{cardData.reward_details || cardData.reward_description || 'Reward details'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render the appropriate wallet view
  switch (activeView) {
    case 'google':
      return <GoogleWalletView />
    case 'pwa':
      return <PWACardView />
    default:
      return <AppleWalletView />
  }
})

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  business_id: string
  businesses: {
    id: string
    name: string
  } | null
  customer_cards: Array<{
    id: string
    current_stamps: number
    customers: {
      name: string
      email: string
    }
  }>
}

interface MembershipCard {
  id: string
  name: string
  total_sessions: number
  cost: number
  duration_days: number
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  business_id: string
  businesses: {
    id: string
    name: string
  } | null
  customer_cards: Array<{
    id: string
    sessions_used: number
    expiry_date: string
    customers: {
      name: string
      email: string
    }
  }>
}

export default function AdminCardsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stamp' | 'membership'>('stamp')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [previewCard, setPreviewCard] = useState<any>(null)
  const [previewWalletType, setPreviewWalletType] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [showBackPage, setShowBackPage] = useState(false)
  
  const [stampCards, setStampCards] = useState<StampCard[]>([])
  const [membershipCards, setMembershipCards] = useState<MembershipCard[]>([])
  const [stats, setStats] = useState({
    totalStampCards: 0,
    totalMembershipCards: 0,
    totalCustomers: 0,
    activeCards: 0
  })

  // Load cards data using API endpoint
  useEffect(() => {
    async function loadCards() {
      setIsLoading(true)
      try {
        console.log('🔄 ADMIN CARDS - Loading card data via API...')
        
        // Use the unified API endpoint for consistent data (get all data for customer count)
        const response = await fetch('/api/admin/dashboard-unified')
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📊 ADMIN CARDS - API Response:', data)
        
        if (data.success === false) {
          throw new Error(data.error || 'Failed to load card data')
        }

        // Use the unified API response format
        const unifiedData = data.data
        const stampCards = unifiedData.cards?.stampCards || []
        const membershipCards = unifiedData.cards?.membershipCards || []
        const stats = {
          totalStampCards: unifiedData.stats?.totalStampCards || stampCards.length,
          totalMembershipCards: unifiedData.stats?.totalMembershipCards || membershipCards.length,
          totalCustomers: unifiedData.stats?.totalCustomers || 0,
          activeCards: unifiedData.stats?.totalCards || 0
        }
        
        console.log('📊 ADMIN CARDS - Processed data:', {
          stampCards: stampCards.length,
          membershipCards: membershipCards.length,
          stats
        })

        setStampCards(stampCards)
        setMembershipCards(membershipCards)
        setStats(stats)

      } catch (error) {
        console.error('❌ ADMIN CARDS - Error loading cards:', error)
        
        // Fallback: create some sample data to show the UI is working
        console.log('🔄 ADMIN CARDS - Using fallback sample data...')
        
        const sampleStampCards: StampCard[] = [
          {
            id: '1',
            name: 'Sample Coffee Card',
            total_stamps: 10,
            reward_description: 'Free coffee after 10 stamps',
            status: 'active',
            created_at: new Date().toISOString(),
            business_id: '1',
            businesses: { id: '1', name: 'Sample Coffee Shop' },
            customer_cards: []
          }
        ]
        
        const sampleMembershipCards: MembershipCard[] = [
          {
            id: '1',
            name: 'Sample Gym Membership',
            total_sessions: 20,
            cost: 100,
            duration_days: 365,
            status: 'active',
            created_at: new Date().toISOString(),
            business_id: '1',
            businesses: { id: '1', name: 'Sample Gym' },
            customer_cards: []
          }
        ]
        
        setStampCards(sampleStampCards)
        setMembershipCards(sampleMembershipCards)
        setStats({
          totalStampCards: sampleStampCards.length,
          totalMembershipCards: sampleMembershipCards.length,
          totalCustomers: 0,
          activeCards: sampleStampCards.length + sampleMembershipCards.length
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCards()
  }, [])

  const filteredStampCards = stampCards.filter(card => {
    if (!card) return false
    const matchesSearch = (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (card.businesses?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredMembershipCards = membershipCards.filter(card => {
    if (!card) return false
    const matchesSearch = (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (card.businesses?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePreviewCard = (card: StampCard | MembershipCard, type: 'stamp' | 'membership') => {
    const cardData = {
      id: card.id,
      name: card.name,
      business_name: card.businesses?.name || 'Unknown Business',
      card_type: type,
      theme: {
        background: type === 'stamp' ? '#4F46E5' : '#DC2626',
        primaryColor: type === 'stamp' ? '#4F46E5' : '#DC2626',
        secondaryColor: type === 'stamp' ? '#E0E7FF' : '#FEE2E2',
        textColor: '#FFFFFF',
        font: 'Inter'
      },
      values: type === 'stamp' ? {
        stamps_used: 3,
        total_stamps: (card as StampCard).total_stamps || 10
      } : {
        sessions_used: 5,
        total_sessions: (card as MembershipCard).total_sessions || 20,
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cost: (card as MembershipCard).cost || 100
      },
      reward_description: type === 'stamp' ? 
        (card as StampCard).reward_description : 
        `${(card as MembershipCard).total_sessions} sessions for $${(card as MembershipCard).cost}`
    }
    
    setPreviewCard(cardData)
  }

  return (
    <AdminLayoutClient>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Card Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Create and manage loyalty and membership cards</p>
            </div>
            <Button onClick={() => router.push('/admin/cards/new')}>
              <Plus className="mr-2 h-4 w-4" /> Create New Card
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stamp Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStampCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Membership Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMembershipCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Tabs for Stamp and Membership Cards */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'stamp' | 'membership')} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stamp" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                📮 Stamp Cards ({filteredStampCards.length})
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                🎟️ Membership Cards ({filteredMembershipCards.length})
              </TabsTrigger>
            </TabsList>

            {/* Stamp Cards Tab Content */}
            <TabsContent value="stamp" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">📮 Stamp Cards</h2>
                <Badge variant="outline">{filteredStampCards.length} cards</Badge>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading stamp cards...</p>
                </div>
              ) : filteredStampCards.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No stamp cards found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchTerm ? 'No cards match your search criteria.' : 'Create your first stamp card to get started.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => router.push('/admin/cards/new')}>
                        Create Stamp Card
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStampCards.map((card) => (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{card.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{card.reward_description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {card.businesses?.name || "Unknown Business"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {card.customer_cards.length} customers
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewCard(card, 'stamp')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/cards/stamp/${card.id}`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Membership Cards Tab */}
            <TabsContent value="membership" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🎟️ Membership Cards</h2>
                <Badge variant="outline">{filteredMembershipCards.length} cards</Badge>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading membership cards...</p>
                </div>
              ) : filteredMembershipCards.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No membership cards found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchTerm ? 'No cards match your search criteria.' : 'Create your first membership card to get started.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => router.push('/admin/cards/new')}>
                        Create Membership Card
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembershipCards.map((card) => (
                    <Card key={card.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{card.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                              {card.total_sessions} sessions • ${card.cost} • {card.duration_days} days
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {card.businesses?.name || "Unknown Business"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {card.customer_cards.length} customers
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewCard(card, 'membership')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/cards/membership/${card.id}`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Enhanced Live Preview Panel */}
          <Card className="sticky top-6">
            <CardContent className="p-6">
              {!previewCard ? (
                <div className="text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Live Preview</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Click the preview button on any card to see how it will look in different wallets.
              </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Preview</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCard(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  {/* Wallet Type Selector */}
                  <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => setPreviewWalletType('apple')}
                      className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                        previewWalletType === 'apple' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Apple className="w-4 h-4" />
                      Apple
                    </button>
                    <button 
                      onClick={() => setPreviewWalletType('google')}
                      className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                        previewWalletType === 'google' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Chrome className="w-4 h-4" />
                      Google
                    </button>
                    <button 
                      onClick={() => setPreviewWalletType('pwa')}
                      className={`px-3 py-2 rounded-md transition-all text-sm flex items-center gap-2 ${
                        previewWalletType === 'pwa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      PWA
                    </button>
                  </div>
                  
                  {/* Front/Back Toggle */}
                  <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <button 
                      onClick={() => setShowBackPage(false)}
                      className={`px-3 py-2 rounded-md transition-all text-sm ${
                        !showBackPage ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      Front
                    </button>
                    <button 
                      onClick={() => setShowBackPage(true)}
                      className={`px-3 py-2 rounded-md transition-all text-sm ${
                        showBackPage ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      Back
                    </button>
                  </div>
                  
                  {/* Enhanced Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg min-h-[400px] flex items-center justify-center">
                    <EnhancedLivePreview
                    cardData={previewCard}
                      activeView={previewWalletType}
                      showBackPage={showBackPage}
                    />
                  </div>
                  
                  {/* Card Info */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Card:</strong> {previewCard.card_name || previewCard.name}</div>
                    <div><strong>Business:</strong> {previewCard.businesses?.name || 'Unknown'}</div>
                    <div><strong>Stamps:</strong> {previewCard.stamps_required || previewCard.total_stamps || 0}</div>
                    <div><strong>Status:</strong> <Badge variant={previewCard.status === 'active' ? 'default' : 'secondary'}>{previewCard.status}</Badge></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutClient>
  )
} 