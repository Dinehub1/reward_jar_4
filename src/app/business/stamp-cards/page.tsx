'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Target, Calendar, QrCode } from 'lucide-react'

interface StampCard {
  id: string
  name: string
  total_stamps: number
  reward_description: string
  status: string
  created_at: string
  customer_count?: number
}

export default function StampCardsPage() {
  const [stampCards, setStampCards] = useState<StampCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<StampCard | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchStampCards = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Get business ID
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .single()

        if (!business) return

        // Get stamp cards with customer counts
        const { data: cards } = await supabase
          .from('stamp_cards')
          .select(`
            id,
            name,
            total_stamps,
            reward_description,
            status,
            created_at
          `)
          .eq('business_id', business.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (cards) {
          // Get customer counts for each card
          const cardsWithCounts = await Promise.all(
            cards.map(async (card) => {
              const { count } = await supabase
                .from('customer_cards')
                .select('*', { count: 'exact', head: true })
                .eq('stamp_card_id', card.id)

              return {
                ...card,
                customer_count: count || 0
              }
            })
          )

          setStampCards(cardsWithCounts)
        }
      } catch (error) {
        console.error('Error fetching stamp cards:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStampCards()
  }, [supabase])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewQRCode = (cardId: string) => {
    const card = stampCards.find(c => c.id === cardId)
    if (card) {
      setSelectedCard(card)
      setShowQRModal(true)
    }
  }

  const handleViewCustomers = (cardId: string) => {
    router.push(`/business/stamp-cards/${cardId}/customers`)
  }

  const getJoinUrl = (cardId: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${cardId}`
  }

  const downloadQRCode = (cardId: string) => {
    const joinUrl = getJoinUrl(cardId)
    // Generate QR code download
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&format=png`
    
    // Create download link
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${selectedCard?.name || 'stamp-card'}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyJoinUrl = (cardId: string) => {
    const joinUrl = getJoinUrl(cardId)
    navigator.clipboard.writeText(joinUrl).then(() => {
      // You could add a toast notification here
      alert('Join URL copied to clipboard!')
    })
  }

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading stamp cards...</div>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stamp Cards</h1>
            <p className="text-gray-600 mt-2">
              Manage your loyalty programs and track customer engagement
            </p>
          </div>
          <Link href="/business/stamp-cards/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Card
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stampCards.length}</div>
              <p className="text-xs text-muted-foreground">
                Active loyalty programs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stampCards.reduce((sum, card) => sum + (card.customer_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Customers enrolled across all cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(...stampCards.map(card => card.customer_count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest customer enrollment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stamp Cards Grid */}
        {stampCards.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stamp cards yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create your first loyalty program to start engaging customers and driving repeat business.
              </p>
              <Link href="/business/stamp-cards/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Card
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stampCards.map((card) => (
              <Card key={card.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {card.total_stamps} stamps required
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {card.customer_count || 0}
                      </div>
                      <div className="text-xs text-gray-500">customers</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stamp Progress Visual */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(card.total_stamps, 10) }, (_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-blue-200 bg-blue-50"
                        />
                      ))}
                      {card.total_stamps > 10 && (
                        <span className="text-sm text-gray-500 ml-2">
                          +{card.total_stamps - 10} more
                        </span>
                      )}
                    </div>

                    {/* Reward Description */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Reward:</h4>
                      <p className="text-sm text-gray-600">{card.reward_description}</p>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      Created {formatDate(card.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewQRCode(card.id)}
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        QR Code
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewCustomers(card.id)}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        View Customers
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {stampCards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/business/stamp-cards/new">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Card
                  </Button>
                </Link>
                <Link href="/business/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/business/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Dashboard Overview
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Modal */}
        {showQRModal && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">QR Code for {selectedCard.name}</h3>
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
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getJoinUrl(selectedCard.id))}`}
                    alt="QR Code for joining loyalty program"
                    width={200}
                    height={200}
                    className="border border-gray-200 rounded-lg"
                  />
                </div>
                
                {/* Join URL */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Join URL:</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {getJoinUrl(selectedCard.id)}
                  </p>
                </div>
                
                {/* Instructions */}
                <div className="text-left bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Print this QR code or display it on a screen</li>
                    <li>2. Place it where customers can easily scan it</li>
                    <li>3. Customers scan to join your loyalty program</li>
                    <li>4. They&apos;ll automatically get a digital stamp card</li>
                  </ol>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => copyJoinUrl(selectedCard.id)}
                  >
                    Copy URL
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => downloadQRCode(selectedCard.id)}
                  >
                    Download QR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  )
} 