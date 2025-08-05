'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Plus, ExternalLink } from 'lucide-react'
// ❌ REMOVED: createAdminClient - use API routes instead

interface BusinessDetails {
  id: string
  name: string
  contact_email: string
  description: string
  location: string
  website_url: string
  status: string
  is_flagged: boolean
  card_requested?: boolean
  admin_notes: string
  created_at: string
  owner_id: string
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
  customer_cards?: Array<{
    id: string
    current_stamps: number
    membership_type: string
    created_at: string
  }>
}

// ✅ SECURE: Fetch business details via API route
async function getBusinessDetails(businessId: string): Promise<BusinessDetails | null> {
  try {
    console.log('🔍 Client: Fetching business details via API for ID:', businessId)
    
    const response = await fetch(`/api/admin/businesses/${businessId}`)
    
    if (!response.ok) {
      console.error('❌ Client: API request failed:', response.status, response.statusText)
      return null
    }
    
    const result = await response.json()
    
    if (!result.success) {
      console.error('❌ Client: API returned error:', result.error)
      return null
    }

    console.log('✅ Client: Business details fetched successfully via API:', result.data?.name)
    return result.data
  } catch (error) {
    console.error('❌ Client: Error in API call:', error)
    return null
  }
}

async function getBusinessCards(businessId: string) {
  try {
    // ✅ Placeholder: Return empty data for now (API route to be created)
    console.log('📋 Fetching cards for business:', businessId)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      stampCards: [],
      membershipCards: []
    }
  } catch (error) {
    console.error('Error fetching business cards:', error)
    return { stampCards: [], membershipCards: [] }
  }
}

async function getBusinessActivity(businessId: string) {
  try {
    // ✅ Placeholder: Return empty data for now (API route to be created)
    console.log('📊 Fetching activity for business:', businessId)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return []
  } catch (error) {
    console.error('Error fetching business activity:', error)
    return []
  }
}

function BusinessOverview({ business }: { business: BusinessDetails }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Business Information
            <Button variant="outline" size="sm">Edit Profile</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Business Name</label>
            <div className="font-medium">{business.name}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Contact Email</label>
            <div>{business.contact_email || 'Not provided'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Description</label>
            <div className="text-sm text-gray-600">
              {business.description || 'No description provided'}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Location</label>
            <div>{business.location || 'Not provided'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Website</label>
            <div>{business.website_url || 'Not provided'}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div>
              <Badge className={business.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {business.status}
              </Badge>
              {business.is_flagged && (
                <Badge className="ml-2 bg-red-100 text-red-800">🚩 Flagged</Badge>
              )}
              {business.card_requested && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800">🎯 Card Requested</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Owner Email</label>
            <div className="font-medium">{business.users?.email}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Account Created</label>
            <div>{new Date(business.users?.created_at || business.created_at).toLocaleDateString()}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Business Registered</label>
            <div>{new Date(business.created_at).toLocaleDateString()}</div>
          </div>
          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full">
              Impersonate Business
            </Button>
            <Button variant="outline" className="w-full text-blue-600">
              Send Email to Owner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card Request Action - Only show if card_requested is true */}
      {business.card_requested && (
        <Card className="md:col-span-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              🎯 Card Creation Required
            </CardTitle>
            <CardDescription>
              This business has requested cards. Create their stamp cards and membership cards to complete the onboarding process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.open('/admin/cards/new?business_id=' + business.id + '&type=stamp', '_blank')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Create Stamp Card
                </Button>
                <Button 
                  onClick={() => window.open('/admin/cards/new?business_id=' + business.id + '&type=membership', '_blank')}
                  variant="outline"
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                >
                  Create Membership Card
                </Button>
                <Button 
                  variant="outline"
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  onClick={async () => {
                    if (confirm('Mark this business as having their cards created? This will clear the card request flag.')) {
                      try {
                        const response = await fetch(`/api/admin/businesses/${business.id}/clear-card-request`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                        })
                        
                        const result = await response.json()
                        
                        if (result.success) {
                          alert('✅ Card request marked as complete! The business will no longer appear in the card requests list.')
                          // Refresh the page to show updated status
                          window.location.reload()
                        } else {
                          alert('❌ Failed to clear card request: ' + result.error)
                        }
                      } catch (error) {
                        console.error('Error clearing card request:', error)
                        alert('❌ Failed to clear card request. Please try again.')
                      }
                    }
                  }}
                >
                  Mark Cards Created
                </Button>
              </div>
              <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md">
                <strong>Next Steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Create appropriate card types for this business</li>
                  <li>Configure card settings (stamps, rewards, expiry, etc.)</li>
                  <li>Test the cards work correctly</li>
                  <li>Click "Mark Cards Created" to clear this request</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
          <CardDescription>Internal notes for tracking and support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <textarea
              className="w-full p-3 border rounded-md resize-none"
              rows={4}
              placeholder="Add internal notes about this business..."
              defaultValue={business.admin_notes || ''}
            />
            <div className="flex justify-between">
              <Button variant="outline">Clear Notes</Button>
              <Button>Save Notes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



function BusinessCards({ businessId }: { businessId: string }) {
  const [cards, setCards] = useState<{
    stampCards: any[]
    membershipCards: any[]
  }>({ stampCards: [], membershipCards: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCards() {
      try {
        setLoading(true)
        
        // Fetch both stamp cards and membership cards for this business
        const [stampResponse, membershipResponse] = await Promise.all([
          fetch(`/api/admin/cards-simple?business_id=${businessId}&type=stamp`),
          fetch(`/api/admin/cards-simple?business_id=${businessId}&type=membership`)
        ])
        
        const stampResult = await stampResponse.json()
        const membershipResult = await membershipResponse.json()
        
        setCards({
          stampCards: stampResult.success ? (stampResult.data.stampCards || []) : [],
          membershipCards: membershipResult.success ? (membershipResult.data.membershipCards || []) : []
        })
      } catch (error) {
        console.error('Error fetching business cards:', error)
        setCards({ stampCards: [], membershipCards: [] })
      } finally {
        setLoading(false)
      }
    }
    
    fetchCards()
  }, [businessId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">Loading cards...</div>
        </CardContent>
      </Card>
    )
  }

  const totalCards = (cards?.stampCards?.length || 0) + (cards?.membershipCards?.length || 0)

  return (
    <div className="space-y-6">
      {/* Cards Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stamp Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards?.stampCards?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Membership Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards?.membershipCards?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Card Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Business Cards</h3>
        <Button onClick={() => window.open(`/admin/cards/new?business_id=${businessId}`, '_blank')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Card
        </Button>
      </div>

      {/* Stamp Cards */}
      {cards.stampCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🎫 Stamp Cards ({cards.stampCards.length})
            </CardTitle>
            <CardDescription>Loyalty cards with stamp-based rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cards.stampCards.map((card: any) => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{card.name}</div>
                    <div className="text-sm text-gray-500">
                      {card.total_stamps || card.stamps_required || 0} stamps required • {card.reward || card.reward_description}
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {new Date(card.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                      {card.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/admin/cards/stamp/${card.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Cards */}
      {cards.membershipCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              💪 Membership Cards ({cards.membershipCards.length})
            </CardTitle>
            <CardDescription>Time-based membership cards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cards.membershipCards.map((card: any) => (
                <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{card.name}</div>
                    <div className="text-sm text-gray-500">
                      ${card.cost} • {card.duration_days} days • {card.total_sessions} sessions
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {new Date(card.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                      {card.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/admin/cards/membership/${card.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Cards State */}
      {totalCards === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <div className="text-lg font-medium">No Cards Created</div>
              <div className="text-sm">This business hasn't created any cards yet.</div>
            </div>
            <Button onClick={() => window.open(`/admin/cards/new?business_id=${businessId}`, '_blank')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Card
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BusinessTeam({ business }: { business: BusinessDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Team Members
          <Button>Add Team Member</Button>
        </CardTitle>
        <CardDescription>Manage team access and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-medium">{business.users?.email}</div>
              <div className="text-sm text-gray-500">Owner</div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Owner</Badge>
          </div>
          
          {/* Placeholder for team members */}
          <div className="text-center py-8 text-gray-500">
            No additional team members added
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BusinessActivity({ businessId }: { businessId: string }) {
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true)
      const activityData = await getBusinessActivity(businessId)
      setActivity(activityData)
      setLoading(false)
    }
    fetchActivity()
  }, [businessId])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">Loading activity...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Customer interactions and usage patterns</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length > 0 ? (
          <div className="space-y-4">
            {activity.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {item.usage_type === 'stamp' ? '🎫 Stamp Added' : '💪 Session Marked'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.customer_cards?.customers?.name || 'Unknown Customer'} • {item.customer_cards?.customers?.email}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function BusinessDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [business, setBusiness] = useState<BusinessDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  // Unwrap params Promise using React.use()
  const { id: businessId } = use(params)

  useEffect(() => {
    async function fetchBusiness() {
      try {
        setLoading(true)
        console.log('🔍 Fetching business details for ID:', businessId)
        const businessData = await getBusinessDetails(businessId)
        
        if (!businessData) {
          console.error('❌ Business not found:', businessId)
          // Don't redirect immediately - show error state instead
          setBusiness(null)
          return
        }
        
        console.log('✅ Business data loaded:', businessData.name)
        setBusiness(businessData)
      } catch (error) {
        console.error('❌ Error fetching business:', error)
        // Don't redirect on error - show error state
        setBusiness(null)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have a valid businessId
    if (businessId && businessId !== 'undefined') {
      fetchBusiness()
    } else {
      console.error('❌ Invalid business ID:', businessId)
      setLoading(false)
      setBusiness(null)
    }
  }, [businessId])

  if (loading) {
    return (
      <AdminLayoutClient>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading business details...</div>
        </div>
      </AdminLayoutClient>
    )
  }

  if (!business) {
    return (
      <AdminLayoutClient>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-2xl font-semibold text-red-600">Business Not Found</div>
          <div className="text-muted-foreground">
            The business with ID "{businessId}" could not be found.
          </div>
          <Button 
            onClick={() => router.push('/admin/businesses?error=business_not_found&id=' + encodeURIComponent(businessId))}
            variant="outline"
          >
            ← Back to Businesses
          </Button>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>
            <p className="text-muted-foreground">
              Business details and management
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              {business.is_flagged ? 'Unflag Business' : 'Flag Business'}
            </Button>
            <Button variant="outline">Impersonate</Button>
            <Button onClick={() => router.push('/admin/businesses')}>
              ← Back to Businesses
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <BusinessOverview business={business} />
          </TabsContent>
          
          <TabsContent value="cards">
              <BusinessCards businessId={businessId} />
          </TabsContent>
          
          <TabsContent value="team">
            <BusinessTeam business={business} />
          </TabsContent>
          
          <TabsContent value="activity">
              <BusinessActivity businessId={businessId} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutClient>
  )
} 