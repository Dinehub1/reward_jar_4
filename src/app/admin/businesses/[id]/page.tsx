'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { BusinessEditForm } from '@/components/admin/BusinessEditForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  ExternalLink, 
  Edit, 
  ArrowLeft, 
  RefreshCw,
  Activity,
  Users,
  CreditCard,
  MapPin,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Download,
  Share,
  Bell,
  Loader2,
  QrCode,
  Copy
} from 'lucide-react'
import Image from 'next/image'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

interface BusinessDetails {
  id: string
  name: string
  contact_email: string
  description: string
  location: string
  website_url: string
  logo_url?: string
  latitude?: number
  longitude?: number
  place_id?: string
  formatted_address?: string
  status: string
  is_flagged: boolean
  card_requested?: boolean
  admin_notes: string
  created_at: string
  updated_at?: string
  owner_id: string
  phone?: string
  category?: string
  business_hours?: string
  established_date?: string
  social_media?: {
    facebook?: string
    instagram?: string
    twitter?: string
  }
  users?: {
    email: string
    created_at: string
  }
  stamp_cards?: Array<{
    id: string
    name: string
    total_stamps: number
    reward_description: string
    status: string
    created_at: string
  }>
  membership_cards?: Array<{
    id: string
    name: string
    membership_type: string
    price: number
    duration_months: number
    status: string
    created_at: string
  }>
  customer_cards?: Array<{
    id: string
    current_stamps: number
    membership_type: string
    created_at: string
    customers?: {
      email: string
      name: string
    }
  }>
}

interface BusinessStats {
  totalCards: number
  activeCards: number
  totalCustomers: number
  monthlyActivity: number
  revenue: number
  recentActivity: Array<{
    id: string
    type: 'stamp' | 'membership' | 'signup'
    description: string
    timestamp: string
    customer?: string
  }>
}

function LegacyBusinessDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const [business, setBusiness] = useState<BusinessDetails | null>(null)
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [businessId, setBusinessId] = useState<string>('')
  const router = useRouter()

  // Handle async params in Next.js 15
  useEffect(() => {
    params.then(({ id }) => {
      setBusinessId(id)
    })
  }, [params])

  const fetchBusiness = useCallback(async () => {
    if (!businessId) return // Wait for businessId to be set
    
    try {
      // Use the specific business endpoint for proper admin access
      const response = await fetch(`/api/admin/businesses/${businessId}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          // Authentication issue - redirect to login
          window.location.href = '/auth/login'
          return
        } else if (response.status === 403) {
          // Permission denied - redirect to admin dashboard
          router.push('/admin')
          return
        } else if (response.status === 404) {
          // Business not found - show error but don't redirect
          setBusiness(null)
          return
        }
        throw new Error('Failed to fetch business details')
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        setBusiness(result.data)
      } else {
        setBusiness(null)
      }
    } catch (error) {
      console.error("Error fetching business:", error)
      setBusiness(null)
    }
  }, [businessId, router])

  const fetchStats = useCallback(async () => {
    if (!businessId) return
    
    try {
      // Fetch cards for this business
      const cardsResponse = await fetch(`/api/admin/cards-simple?business_id=${businessId}`)
      let stampCards = []
      let membershipCards = []
      
      if (cardsResponse.ok) {
        const cardsResult = await cardsResponse.json()
        if (cardsResult.success) {
          stampCards = cardsResult.data.stampCards || []
          membershipCards = cardsResult.data.membershipCards || []
        }
      }
      
      // Calculate real stats from card data
      const totalCards = stampCards.length + membershipCards.length
      const activeCards = stampCards.filter((c: any) => c.status === 'active').length + 
                         membershipCards.filter((c: any) => c.status === 'active').length
      
      const stats: BusinessStats = {
        totalCards,
        activeCards,
        totalCustomers: 0, // TODO: Calculate from customer_cards relationship
        monthlyActivity: 0, // TODO: Implement analytics endpoint
        revenue: 0, // TODO: Implement transaction data endpoint
        recentActivity: [] // TODO: Fetch from activity/transaction logs
      }
      
      setStats(stats)
      
      // Update business object with card data for the BusinessCards component
      if (stampCards.length > 0 || membershipCards.length > 0) {
        setBusiness(prev => prev ? {
          ...prev,
          stamp_cards: stampCards,
          membership_cards: membershipCards
        } : prev)
      }
    } catch (error) {
      console.error("Error fetching business stats:", error)
    }
  }, [businessId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchBusiness(), fetchStats()])
    setRefreshing(false)
  }

  const handleEditSave = async (updatedBusiness: any) => {
    try {
      setLoading(true)
      
      // Update business via API
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBusiness),
      })

      if (!response.ok) {
        throw new Error('Failed to update business')
      }

      const result = await response.json()
      if (result.success) {
        // Update local state
        setBusiness(result.data)
        setIsEditing(false)
        // Refresh data to ensure consistency
        await fetchBusiness()
      } else {
        throw new Error(result.error || 'Failed to update business')
      }
    } catch (error) {
      console.error('Error updating business:', error)
      alert('Failed to update business. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBusiness(), fetchStats()])
      setLoading(false)
    }

    if (businessId) {
      loadData()
    }
  }, [businessId, fetchBusiness, fetchStats])

  const handleBusinessUpdate = (updatedBusiness: BusinessDetails) => {
    setBusiness(updatedBusiness)
    setIsEditing(false)
    fetchStats() // Refresh stats after update
  }

  if (loading) {
    return (
      <AdminLayoutClient>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading business details...</p>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  if (!business) {
    return (
      <AdminLayoutClient>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Business Not Found</h2>
              <p className="text-gray-600 mb-4">The requested business could not be found.</p>
              <Button onClick={() => router.push('/admin/businesses')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Businesses
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/businesses')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Businesses
            </Button>
            
            <div className="flex items-center gap-3">
              {business.logo_url && (
                <Image
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{business.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                    ID: {business.id}
                  </code>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                    {business.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {business.status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                    {business.status === 'pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {business.status}
                  </Badge>
                  {business.is_flagged && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Flagged
                    </Badge>
                  )}
                  {business.card_requested && (
                    <Badge variant="outline">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Card Requested
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>

            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.totalCards}</div>
                    <p className="text-xs text-gray-500">Total Cards</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.activeCards}</div>
                    <p className="text-xs text-gray-500">Active Cards</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats.totalCustomers}</div>
                    <p className="text-xs text-gray-500">Customers</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.monthlyActivity}</div>
                    <p className="text-xs text-gray-500">Monthly Activity</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-700">${stats.revenue}</div>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {false ? ( // Temporarily disable edit mode
          <div className="p-8 text-center">
            <p>Edit functionality temporarily disabled</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <BusinessOverview business={business} />
            </TabsContent>

            <TabsContent value="cards">
              <BusinessCards business={business} />
            </TabsContent>

            <TabsContent value="customers">
              <BusinessCustomers business={business} />
            </TabsContent>

            <TabsContent value="analytics">
              <BusinessAnalytics business={business} stats={stats} />
            </TabsContent>

            <TabsContent value="activity">
              <BusinessActivity business={business} stats={stats} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Edit Business Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Profile</DialogTitle>
          </DialogHeader>
          {business && (
            <BusinessEditForm
              business={business}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayoutClient>
  )
}

// Overview Component
function BusinessOverview({ business }: { business: BusinessDetails }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {business.logo_url && (
            <div>
              <label className="text-sm font-medium text-gray-500">Business Logo</label>
              <div className="mt-2">
                <Image
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500">Business Name</label>
            <div className="font-semibold">{business.name}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Business ID</label>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                {business.id}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(business.id)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Contact Email</label>
            <div className="flex items-center gap-2">
              <span>{business.contact_email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:${business.contact_email}`)}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {business.phone && (
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <div className="flex items-center gap-2">
                <span>{business.phone}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${business.phone}`)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <div>{business.description || 'No description provided'}</div>
          </div>

          {business.category && (
          <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <Badge variant="outline">{business.category}</Badge>
          </div>
          )}

          {business.business_hours && (
            <div>
              <label className="text-sm font-medium text-gray-500">Business Hours</label>
              <div className="whitespace-pre-line text-sm">{business.business_hours}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Address</label>
            <div>{business.location || 'Not provided'}</div>
            {business.latitude && business.longitude && (
              <div className="text-xs text-gray-400 mt-1">
                📍 {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => window.open(`https://maps.google.com/?q=${business.latitude},${business.longitude}`, '_blank')}
                >
                  View on Maps
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Website</label>
            <div className="flex items-center gap-2">
              <span>{business.website_url || 'Not provided'}</span>
              {business.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(business.website_url, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {business.social_media && (
            <div>
              <label className="text-sm font-medium text-gray-500">Social Media</label>
              <div className="flex gap-2 mt-2">
                {business.social_media.facebook && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(business.social_media!.facebook, '_blank')}
                  >
                    Facebook
                  </Button>
                )}
                {business.social_media.instagram && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(business.social_media!.instagram, '_blank')}
                  >
                    Instagram
                  </Button>
                )}
                {business.social_media.twitter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(business.social_media!.twitter, '_blank')}
                  >
                    Twitter
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500">Created</label>
            <div>{new Date(business.created_at).toLocaleDateString()}</div>
          </div>

          {business.updated_at && (
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <div>{new Date(business.updated_at).toLocaleDateString()}</div>
          </div>
          )}
        </CardContent>
      </Card>

      {business.admin_notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {business.admin_notes}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Cards Component
function BusinessCards({ business }: { business: BusinessDetails }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Business Cards</h2>
        <Link href="/admin/cards/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Card
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stamp Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Stamp Cards</CardTitle>
            <CardDescription>Loyalty cards with stamp-based rewards</CardDescription>
          </CardHeader>
          <CardContent>
            {business.stamp_cards && business.stamp_cards.length > 0 ? (
              <div className="space-y-3">
                {business.stamp_cards.map((card) => (
                  <div key={card.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{card.name}</h4>
                        <p className="text-sm text-gray-600">{card.reward_description}</p>
                        <p className="text-xs text-gray-500">
                          {card.total_stamps} stamps required
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                        <Link href={`/admin/cards/stamp/${card.id}`}>
                          <Button variant="outline" size="sm">
                            <QrCode className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No stamp cards created yet</p>
            )}
          </CardContent>
        </Card>

        {/* Membership Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Cards</CardTitle>
            <CardDescription>Subscription-based membership cards</CardDescription>
          </CardHeader>
          <CardContent>
            {business.membership_cards && business.membership_cards.length > 0 ? (
              <div className="space-y-3">
                {business.membership_cards.map((card) => (
                  <div key={card.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{card.name}</h4>
                        <p className="text-sm text-gray-600">{card.membership_type}</p>
                        <p className="text-xs text-gray-500">
                          ${card.price} / {card.duration_months} months
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                          {card.status}
                        </Badge>
                        <Link href={`/admin/cards/membership/${card.id}`}>
                          <Button variant="outline" size="sm">
                            <QrCode className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No membership cards created yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Customers Component
function BusinessCustomers({ business }: { business: BusinessDetails }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customers</h2>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export List
        </Button>
      </div>

        <Card>
          <CardHeader>
          <CardTitle>Customer Cards</CardTitle>
          <CardDescription>Active customer cards for this business</CardDescription>
          </CardHeader>
          <CardContent>
          {business.customer_cards && business.customer_cards.length > 0 ? (
            <div className="space-y-3">
              {business.customer_cards.map((card) => (
                <div key={card.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                  <div>
                      <h4 className="font-semibold">
                        {card.customers?.name || card.customers?.email || 'Unknown Customer'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {card.membership_type ? `${card.membership_type} Member` : `${card.current_stamps} stamps`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(card.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No customers yet</p>
          )}
          </CardContent>
        </Card>
    </div>
  )
}

// Analytics Component
function BusinessAnalytics({ business, stats }: { business: BusinessDetails, stats: BusinessStats | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <Button variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Full Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Card Utilization Rate</span>
                <span className="font-semibold">
                  {stats && stats.totalCards > 0 ? Math.round((stats.activeCards / stats.totalCards) * 100) : 0}%
                </span>
                    </div>
              <div className="flex justify-between">
                <span>Customer Retention</span>
                <span className="font-semibold">85%</span>
                    </div>
              <div className="flex justify-between">
                <span>Average Stamps per Card</span>
                <span className="font-semibold">7.2</span>
                  </div>
              <div className="flex justify-between">
                <span>Conversion Rate</span>
                <span className="font-semibold">12%</span>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Monthly Revenue</span>
                <span className="font-semibold">${stats?.revenue || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Order Value</span>
                <span className="font-semibold">$45.30</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue per Customer</span>
                <span className="font-semibold">$127.50</span>
              </div>
              <div className="flex justify-between">
                <span>Growth Rate</span>
                <span className="font-semibold text-green-600">+15%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Activity Component
function BusinessActivity({ business, stats }: { business: BusinessDetails, stats: BusinessStats | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        <Button variant="outline">
          <Bell className="w-4 h-4 mr-2" />
          View All Notifications
        </Button>
          </div>
          
    <Card>
      <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
        )}
      </CardContent>
    </Card>
      </div>
  )
} 
export default function BusinessDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Detail Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the business detail</p>
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
        <LegacyBusinessDetailsPage params={params} />
      </div>
    </ComponentErrorBoundary>
  )
}