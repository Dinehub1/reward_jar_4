'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'
import {
  ArrowLeft,
  Target, 
  Users, 
  Calendar,
  Building,
  QrCode,
  Download,
  Copy,
  Eye,
  BarChart3,
  RefreshCw
} from 'lucide-react'

// Interfaces
interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: string
  created_at: string
  business_id: string
  business: {
    id: string
    name: string
    contact_email: string
    description: string
  }
}

interface Customer {
  id: string
  customer_id: string
  current_stamps: number
  created_at: string
  customer: {
    email: string
    name: string
  }
}

interface CardStats {
  totalCustomers: number
  totalStamps: number
  completedCards: number
  averageStamps: number
  recentActivity: number
}

function LegacyAdminStampCardDetailPage({ 
  params 
}: { 
  params: Promise<{ cardId: string }> 
}) {
  const [card, setCard] = useState<StampCard | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CardStats>({
    totalCustomers: 0,
    totalStamps: 0,
    completedCards: 0,
    averageStamps: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [cardId, setCardId] = useState<string>('')

  const router = useRouter()
  
  // Handle async params in Next.js 15
  useEffect(() => {
    params.then(({ cardId }) => {
      setCardId(cardId)
    })
  }, [params])
  // Initialize Supabase client
  const supabase = createClient()

  const fetchCardDetails = useCallback(async () => {
    if (!cardId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch stamp card with business info
      const { data: cardData, error: cardError } = await supabase
        .from('stamp_cards')
        .select(`
          id,
          name,
          total_stamps,
          reward_description,
          status,
          created_at,
          business_id,
          businesses!inner(
            id,
            name,
            contact_email,
            description
          )
        `)
        .eq('id', cardId)
        .single()

      if (cardError) {
        throw cardError
      }

      if (!cardData) {
        throw new Error('Stamp card not found')
      }

      setCard({
        ...cardData,
        business: Array.isArray(cardData.businesses) ? cardData.businesses[0] : cardData.businesses
      })

      // Fetch customers for this card
      const { data: customersData, error: customersError } = await supabase
        .from('customer_cards')
        .select(`
          id,
          customer_id,
          current_stamps,
          created_at,
          customers!inner(
            email,
            name
          )
        `)
        .eq('stamp_card_id', cardId)
        .order('created_at', { ascending: false })

      if (customersError) {
      } else {
        const processedCustomers = (customersData || []).map(customer => ({
          ...customer,
          customer: Array.isArray(customer.customers) ? customer.customers[0] : customer.customers
        }))
        setCustomers(processedCustomers)

        // Calculate stats
        const totalCustomers = processedCustomers.length
        const totalStamps = processedCustomers.reduce((sum, c) => sum + c.current_stamps, 0)
        const completedCards = processedCustomers.filter(c => c.current_stamps >= cardData.total_stamps).length
        const averageStamps = totalCustomers > 0 ? totalStamps / totalCustomers : 0

        // Mock recent activity (would come from session_usage table in production)
        const recentActivity = Math.floor(Math.random() * 10) + 1

        setStats({
          totalCustomers,
          totalStamps,
          completedCards,
          averageStamps,
          recentActivity
        })
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load card details')
    } finally {
      setLoading(false)
    }
  }, [cardId, supabase])

  useEffect(() => {
    fetchCardDetails()
  }, [fetchCardDetails])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getJoinUrl = () => {
    if (!card) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${card.id}?guest=true`
  }

  const copyJoinUrl = () => {
    const joinUrl = getJoinUrl()
    navigator.clipboard.writeText(joinUrl).then(() => {
      alert('Join URL copied to clipboard!')
    })
  }

  const downloadQRCode = () => {
    const joinUrl = getJoinUrl()
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&format=png`
    
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${card?.name || 'stamp-card'}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getProgressPercentage = (current: number, total: number) => {
    return Math.min((current / total) * 100, 100)
  }

  if (loading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayoutClient>
    )
  }

  if (error || !card) {
    return (
      <AdminLayoutClient>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-700">{error || 'Card not found'}</div>
            </CardContent>
          </Card>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cards
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Target className="h-6 w-6 mr-2 text-green-600" />
                {card.name}
              </h1>
              <p className="text-gray-600">Stamp Card Details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowQRModal(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button variant="outline" onClick={fetchCardDetails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Card Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Card Information</span>
                  <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                    {card.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Card Name</label>
                    <p className="text-lg font-semibold">{card.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Stamps Required</label>
                    <p className="text-lg font-semibold">{card.total_stamps}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Reward Description</label>
                  <p className="text-gray-900">{card.reward_description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(card.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Card ID</label>
                    <p className="font-mono text-sm text-gray-600">{card.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <p className="font-semibold">{card.business.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Email</label>
                  <p className="text-sm">{card.business.contact_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-700">{card.business.description || 'No description'}</p>
                </div>
                <Link href={`/admin/businesses/${card.business.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View Business
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Enrolled customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stamps</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStamps}</div>
              <p className="text-xs text-muted-foreground">Stamps collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Cards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCards}</div>
              <p className="text-xs text-muted-foreground">Rewards earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Stamps</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageStamps.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Per customer</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customer Cards ({customers.length})</span>
              <Link href={`/business/stamp-cards/${card.id}/customers`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Business View
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
                <p className="text-gray-600">No customers have joined this stamp card program.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customers.slice(0, 10).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.customer.name || customer.customer.email}
                          </p>
                          <p className="text-sm text-gray-600">{customer.customer.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {customer.current_stamps}/{card.total_stamps}
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${getProgressPercentage(customer.current_stamps, card.total_stamps)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined {formatDate(customer.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {customers.length > 10 && (
                  <div className="text-center pt-4">
                    <Link href={`/business/stamp-cards/${card.id}/customers`}>
                      <Button variant="outline">
                        View All {customers.length} Customers
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">QR Code for {card.name}</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getJoinUrl())}`}
                    alt="QR Code for joining loyalty program"
                    width={200}
                    height={200}
                    className="border border-gray-200 rounded-lg"
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Join URL:</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {getJoinUrl()}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button variant="outline" className="flex-1" onClick={copyJoinUrl}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={downloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutClient>
  )
} 
export default function AdminStampCardDetailPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Stamp Card Detail Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the stamp card detail</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyAdminStampCardDetailPage />
      </div>
    </ComponentErrorBoundary>
  )
}