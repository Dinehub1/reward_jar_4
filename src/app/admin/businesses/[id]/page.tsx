import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createClient } from '@/lib/supabase/server-only'

interface BusinessDetails {
  id: string
  name: string
  contact_email: string
  description: string
  location: string
  website_url: string
  status: string
  is_flagged: boolean
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

async function getBusinessDetails(businessId: string): Promise<BusinessDetails | null> {
  const supabase = await createClient()
  
  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        *,
        users!businesses_owner_id_fkey(email, created_at),
        stamp_cards(*),
        customer_cards:stamp_cards(customer_cards(*))
      `)
      .eq('id', businessId)
      .single()

    if (error) {
      console.error('Error fetching business details:', error)
      return null
    }

    return business
  } catch (error) {
    console.error('Error in getBusinessDetails:', error)
    return null
  }
}

async function getBusinessCards(businessId: string) {
  const supabase = await createClient()
  
  try {
    // Get stamp cards
    const { data: stampCards } = await supabase
      .from('stamp_cards')
      .select(`
        *,
        customer_cards(count)
      `)
      .eq('business_id', businessId)

    // Get membership cards  
    const { data: membershipCards } = await supabase
      .from('membership_cards')
      .select(`
        *,
        customer_cards:stamp_cards!inner(customer_cards(count))
      `)
      .eq('business_id', businessId)

    return {
      stampCards: stampCards || [],
      membershipCards: membershipCards || []
    }
  } catch (error) {
    console.error('Error fetching business cards:', error)
    return { stampCards: [], membershipCards: [] }
  }
}

async function getBusinessActivity(businessId: string) {
  const supabase = await createClient()
  
  try {
    const { data: activity } = await supabase
      .from('session_usage')
      .select(`
        *,
        customer_cards(
          customers(name, email)
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20)

    return activity || []
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

async function BusinessCards({ businessId }: { businessId: string }) {
  const { stampCards, membershipCards } = await getBusinessCards(businessId)

  return (
    <div className="space-y-6">
      {/* Stamp Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Stamp Cards ({stampCards.length})
            <Link href={`/admin/cards/stamp/new?businessId=${businessId}`}>
              <Button>Create Stamp Card</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stampCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {stampCards.map((card: any) => (
                <Card key={card.id} className="border">
                  <CardHeader>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <CardDescription>{card.reward_description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">Total Stamps</div>
                        <div className="font-medium">{card.total_stamps}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Customers</div>
                        <div className="font-medium">{card.customer_cards?.length || 0}</div>
                      </div>
                      <Link href={`/admin/cards/stamp/${card.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No stamp cards created for this business
            </div>
          )}
        </CardContent>
      </Card>

      {/* Membership Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Membership Cards ({membershipCards.length})
            <Link href={`/admin/cards/membership/new?businessId=${businessId}`}>
              <Button>Create Membership Card</Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membershipCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {membershipCards.map((card: any) => (
                <Card key={card.id} className="border">
                  <CardHeader>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <CardDescription>{card.membership_type} membership</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500">Sessions</div>
                        <div className="font-medium">{card.total_sessions}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Cost</div>
                        <div className="font-medium">₩{card.cost?.toLocaleString()}</div>
                      </div>
                      <Link href={`/admin/cards/membership/${card.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No membership cards created for this business
            </div>
          )}
        </CardContent>
      </Card>
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

async function BusinessActivity({ businessId }: { businessId: string }) {
  const activity = await getBusinessActivity(businessId)

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

export default async function BusinessDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params
  const businessId = resolvedParams.id
  
  const business = await getBusinessDetails(businessId)

  if (!business) {
    notFound()
  }

  return (
    <AdminLayout>
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
            <Button>Edit Business</Button>
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
            <Suspense fallback={<div>Loading cards...</div>}>
              <BusinessCards businessId={businessId} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="team">
            <BusinessTeam business={business} />
          </TabsContent>
          
          <TabsContent value="activity">
            <Suspense fallback={<div>Loading activity...</div>}>
              <BusinessActivity businessId={businessId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 