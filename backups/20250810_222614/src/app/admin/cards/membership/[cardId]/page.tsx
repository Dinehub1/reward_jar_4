'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Dumbbell, 
  Users, 
  Calendar,
  Building,
  QrCode,
  Download,
  Copy,
  Eye,
  BarChart3,
  RefreshCw,
  DollarSign,
  Clock
} from 'lucide-react'

// Interfaces
interface MembershipCard {
  id: string
  name: string
  total_sessions: number
  cost: number
  duration_days: number
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
  sessions_used: number
  total_sessions: number
  cost: number
  expiry_date: string
  created_at: string
  customer: {
    email: string
    name: string
  }
}

interface CardStats {
  totalCustomers: number
  activeMemberships: number
  totalRevenue: number
  totalSessions: number
  averageUsage: number
  recentActivity: number
}

export default function AdminMembershipCardDetailPage({ 
  params 
}: { 
  params: Promise<{ cardId: string }> 
}) {
  const [card, setCard] = useState<MembershipCard | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CardStats>({
    totalCustomers: 0,
    activeMemberships: 0,
    totalRevenue: 0,
    totalSessions: 0,
    averageUsage: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  const router = useRouter()
  // Unwrap params Promise using React.use()
  const { cardId } = use(params)
  // Initialize Supabase client
  const supabase = createClient()

  const fetchCardDetails = useCallback(async () => {
    if (!cardId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch membership card with business info
      const { data: cardData, error: cardError } = await supabase
        .from('membership_cards')
        .select(`
          id,
          name,
          total_sessions,
          cost,
          duration_days,
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
        throw new Error('Membership card not found')
      }

      setCard({
        ...cardData,
        business: Array.isArray(cardData.businesses) ? cardData.businesses[0] : cardData.businesses
      })

      // Fetch customers for this membership card
      const { data: customersData, error: customersError } = await supabase
        .from('customer_cards')
        .select(`
          id,
          customer_id,
          sessions_used,
          total_sessions,
          cost,
          expiry_date,
          created_at,
          customers!inner(
            email,
            name
          )
        `)
        .eq('stamp_card_id', cardId)
        .eq('membership_type', 'gym')
        .order('created_at', { ascending: false })

      if (customersError) {
        console.error('Error fetching customers:', customersError)
      } else {
        const processedCustomers = (customersData || []).map(customer => ({
          ...customer,
          customer: Array.isArray(customer.customers) ? customer.customers[0] : customer.customers
        }))
        setCustomers(processedCustomers)

        // Calculate stats
        const totalCustomers = processedCustomers.length
        const now = new Date()
        const activeMemberships = processedCustomers.filter(c => 
          c.expiry_date && new Date(c.expiry_date) > now
        ).length
        const totalRevenue = processedCustomers.reduce((sum, c) => sum + (c.cost || 0), 0)
        const totalSessions = processedCustomers.reduce((sum, c) => sum + c.sessions_used, 0)
        const averageUsage = totalCustomers > 0 ? totalSessions / totalCustomers : 0

        // Mock recent activity (would come from session_usage table in production)
        const recentActivity = Math.floor(Math.random() * 15) + 1

        setStats({
          totalCustomers,
          activeMemberships,
          totalRevenue,
          totalSessions,
          averageUsage,
          recentActivity
        })
      }

    } catch (err) {
      console.error('Error fetching card details:', err)
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

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`
  }

  const getJoinUrl = () => {
    if (!card) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${card.id}?guest=true&type=membership`
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
    link.download = `${card?.name || 'membership-card'}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getUsagePercentage = (used: number, total: number) => {
    return Math.min((used / total) * 100, 100)
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
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
                <Dumbbell className="h-6 w-6 mr-2 text-blue-600" />
                {card.name}
              </h1>
              <p className="text-gray-600">Membership Card Details</p>
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
                  <span>Membership Information</span>
                  <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                    {card.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Membership Name</label>
                    <p className="text-lg font-semibold">{card.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Sessions</label>
                    <p className="text-lg font-semibold">{card.total_sessions}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Membership Cost</label>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(card.cost)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-lg font-semibold">{card.duration_days} days</p>
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeMemberships}</div>
              <p className="text-xs text-muted-foreground">Not expired</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All memberships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions Used</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Total sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageUsage.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Sessions/member</p>
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

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Members ({customers.length})</span>
              <Link href={`/business/memberships/${card.id}`}>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
                <p className="text-gray-600">No customers have purchased this membership.</p>
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
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {customer.sessions_used}/{customer.total_sessions || card.total_sessions}
                        </p>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${getUsagePercentage(
                                customer.sessions_used, 
                                customer.total_sessions || card.total_sessions
                              )}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(customer.cost || card.cost)}
                        </p>
                        <p className="text-xs text-gray-500">Paid</p>
                      </div>
                      <div className="text-center">
                        {customer.expiry_date ? (
                          <>
                            <Badge variant={isExpired(customer.expiry_date) ? 'destructive' : 'default'}>
                              {isExpired(customer.expiry_date) ? 'Expired' : 'Active'}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {isExpired(customer.expiry_date) ? 'Expired' : 'Expires'} {formatDate(customer.expiry_date)}
                            </p>
                          </>
                        ) : (
                          <Badge variant="secondary">No Expiry</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Joined
                        </div>
                        <div>{formatDate(customer.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {customers.length > 10 && (
                  <div className="text-center pt-4">
                    <Link href={`/business/memberships/${card.id}`}>
                      <Button variant="outline">
                        View All {customers.length} Members
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
                    alt="QR Code for joining membership program"
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
                
                <div className="text-left bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Membership Details:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {card.total_sessions} sessions included</li>
                    <li>• {formatCurrency(card.cost)} membership fee</li>
                    <li>• {card.duration_days} days validity</li>
                    <li>• Scan QR to purchase membership</li>
                  </ul>
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