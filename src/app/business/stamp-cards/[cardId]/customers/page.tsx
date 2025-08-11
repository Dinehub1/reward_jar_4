'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Users, 
  Eye, 
  Calendar,
  Award,
  Smartphone,
  CreditCard,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  business: {
    name: string
  }
}

interface Customer {
  id: string
  customer_id: string
  name: string
  email: string
  current_stamps: number
  joined_date: string
  is_completed: boolean
}

export default function StampCardCustomersPage() {
  const [stampCard, setStampCard] = useState<StampCard | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const cardId = params.cardId as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        // Verify business ownership and get stamp card details
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .single()

        if (!business) {
          setError('Business not found')
          return
        }

        // Get stamp card details with business name
        const { data: cardData, error: cardError } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            businesses!inner (
              name
            )
          `)
          .eq('id', cardId)
          .eq('business_id', business.id)
          .eq('status', 'active')
          .single()

        if (cardError || !cardData) {
          setError('Stamp card not found or access denied')
          return
        }

        setStampCard({
          ...cardData,
          business: (cardData.businesses as { name: string }[])[0]
        })

        // Get customers for this stamp card
        const { data: customerData, error: customerError } = await supabase
          .from('customer_cards')
          .select(`
            id,
            customer_id,
            current_stamps,
            created_at,
            customers!inner (
              name,
              email
            )
          `)
          .eq('stamp_card_id', cardId)
          .order('created_at', { ascending: false })

        if (customerError) {
          setError('Failed to load customers')
          return
        }

        if (customerData) {
          const formattedCustomers: Customer[] = customerData.map(cc => {
            const customer = (cc.customers as { name: string; email: string }[])[0]
            return {
            id: cc.id,
            customer_id: cc.customer_id,
              name: customer.name,
              email: customer.email,
            current_stamps: cc.current_stamps,
            joined_date: cc.created_at,
            is_completed: cc.current_stamps >= cardData.total_stamps
            }
          })

          setCustomers(formattedCustomers)
          setFilteredCustomers(formattedCustomers)
        }
      } catch (err) {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cardId, supabase, router])

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCustomers(filtered)
    }
  }, [searchTerm, customers])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }



  const getProgressPercentage = (current: number, total: number) => {
    return Math.min((current / total) * 100, 100)
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading customers...</div>
        </div>
      </BusinessLayout>
    )
  }

  if (error) {
    return (
      <BusinessLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="text-center py-8">
              <div className="text-red-600 mb-4">⚠️</div>
              <h3 className="font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Link href="/business/stamp-cards">
                <Button variant="outline">Back to Stamp Cards</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/business/stamp-cards">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cards
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {stampCard?.name} - Customers
            </h1>
            <p className="text-gray-600 mt-1">
              Track customer progress and engagement for this stamp card
            </p>
          </div>
        </div>

        {/* Card Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">{stampCard?.name}</p>
                <p className="text-sm text-blue-700">
                  {stampCard?.total_stamps} stamps required • {stampCard?.reward_description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
                <div className="text-sm text-blue-700">Total Customers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.is_completed).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.length > 0 && stampCard
                  ? Math.round(
                      (customers.reduce((sum, c) => sum + c.current_stamps, 0) / customers.length / stampCard.total_stamps) * 100
                    )
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Wallets</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredCustomers.length} of {customers.length} customers
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Share your QR code to get customers to join this stamp card'}
              </p>
              {!searchTerm && (
                <Link href="/business/stamp-cards">
                  <Button>View QR Code</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          {customer.is_completed && (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              <Award className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                          <span className="text-lg">💳</span>
                        </div>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="text-sm text-gray-500">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Joined {formatDate(customer.joined_date)}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="text-center min-w-[120px]">
                        <div className="text-lg font-bold text-blue-600">
                          {customer.current_stamps}/{stampCard?.total_stamps}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">stamps</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              customer.is_completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ 
                              width: `${getProgressPercentage(customer.current_stamps, stampCard?.total_stamps || 1)}%` 
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <Link href={`/business/stamp-cards/${cardId}/customers/${customer.customer_id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/business/stamp-cards/${cardId}/rewards`}>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  View Completed Rewards
                </Button>
              </Link>
              <Link href="/business/stamp-cards">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Back to All Cards
                </Button>
              </Link>
              <Link href="/business/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
} 