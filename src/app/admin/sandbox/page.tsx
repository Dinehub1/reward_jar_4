import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createServerClient } from '@/lib/supabase/server-only'

interface TestCard {
  id: string
  name: string
  type: 'stamp' | 'membership'
  business_name: string
  total_stamps?: number
  total_sessions?: number
  reward_description?: string
  cost?: number
}

async function getTestCards() {
  const supabase = await createServerClient()
  
  try {
    // Get stamp cards for testing
    const { data: stampCards } = await supabase
      .from('stamp_cards')
      .select(`
        id,
        name,
        total_stamps,
        reward_description,
        businesses(name)
      `)
      .eq('status', 'active')
      .limit(5)

    // Get membership cards for testing
    const { data: membershipCards } = await supabase
      .from('membership_cards')
      .select(`
        id,
        name,
        total_sessions,
        cost,
        businesses(name)
      `)
      .eq('status', 'active')
      .limit(5)

    const testCards: TestCard[] = [
      ...(stampCards?.map(card => ({
        id: card.id,
        name: card.name,
        type: 'stamp' as const,
        business_name: (card.businesses as any)?.name || 'Unknown Business',
        total_stamps: card.total_stamps,
        reward_description: card.reward_description
      })) || []),
      ...(membershipCards?.map(card => ({
        id: card.id,
        name: card.name,
        type: 'membership' as const,
        business_name: (card.businesses as any)?.name || 'Unknown Business',
        total_sessions: card.total_sessions,
        cost: card.cost
      })) || [])
    ]

    return testCards
  } catch (error) {
    console.error('Error fetching test cards:', error)
    return []
  }
}

function WalletPreview({ card, walletType }: { card: TestCard, walletType: 'apple' | 'google' | 'pwa' }) {
  const isStampCard = card.type === 'stamp'
  const themeColor = isStampCard ? '#10b981' : '#6366f1'
  const themeGradient = isStampCard 
    ? 'from-green-500 to-green-600' 
    : 'from-indigo-500 to-indigo-600'

  return (
    <div className={`bg-gradient-to-br ${themeGradient} rounded-lg p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-bold">{card.name}</div>
        <div className="text-sm opacity-80">{walletType.toUpperCase()}</div>
      </div>
      
      <div className="text-sm opacity-90 mb-4">{card.business_name}</div>
      
      <div className="space-y-2">
        {isStampCard ? (
          <>
            <div className="text-2xl font-bold">0/{card.total_stamps}</div>
            <div className="text-sm opacity-80">Stamps Collected</div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">0/{card.total_sessions}</div>
            <div className="text-sm opacity-80">Sessions Used</div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <div className="text-sm opacity-80">
              Value: ₩{card.cost?.toLocaleString()}
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="text-xs opacity-70">
          {walletType === 'apple' && 'Add to Apple Wallet'}
          {walletType === 'google' && 'Save to Google Pay'}
          {walletType === 'pwa' && 'PWA Wallet Card'}
        </div>
      </div>
    </div>
  )
}

async function CardSelector() {
  const cards = await getTestCards()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Selection</CardTitle>
        <CardDescription>Choose a card to preview across wallet types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Card Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select card type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stamp">Stamp Cards</SelectItem>
                <SelectItem value="membership">Membership Cards</SelectItem>
                <SelectItem value="all">All Cards</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Business</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select business" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Set(cards.map(card => card.business_name))).map(businessName => (
                  <SelectItem key={businessName} value={businessName}>
                    {businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Specific Card</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select card to preview" />
            </SelectTrigger>
            <SelectContent>
              {cards.map(card => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} ({card.business_name}) - {card.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button className="w-full">Load Card Preview</Button>
      </CardContent>
    </Card>
  )
}

async function WalletPreviews() {
  const cards = await getTestCards()
  const sampleCard = cards[0] // Use first card as sample

  if (!sampleCard) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No cards available for preview
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Wallet Previews</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">Copy Test QR</Button>
          <Button variant="outline" size="sm">Generate Test Data</Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <span>🍎</span>
            <span>Apple Wallet</span>
          </h4>
          <WalletPreview card={sampleCard} walletType="apple" />
        </div>
        
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <span>🤖</span>
            <span>Google Wallet</span>
          </h4>
          <WalletPreview card={sampleCard} walletType="google" />
        </div>
        
        <div>
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <span>🌐</span>
            <span>PWA Wallet</span>
          </h4>
          <WalletPreview card={sampleCard} walletType="pwa" />
        </div>
      </div>
    </div>
  )
}

function TestActions() {
  const actions = [
    {
      title: 'Simulate Stamp Action',
      description: 'Add a stamp to test card and trigger wallet update',
      icon: '🎫',
      action: 'stamp'
    },
    {
      title: 'Simulate Session Mark',
      description: 'Mark a session for membership card testing',
      icon: '💪',
      action: 'session'
    },
    {
      title: 'Trigger Reward Unlock',
      description: 'Complete card and unlock reward for testing',
      icon: '🎉',
      action: 'reward'
    },
    {
      title: 'Test QR Generation',
      description: 'Generate and display test QR codes',
      icon: '📱',
      action: 'qr'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Actions</CardTitle>
        <CardDescription>Simulate customer interactions and system responses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <div key={action.action} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Execute
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SystemStatus() {
  const systems = [
    { name: 'Apple Wallet API', status: 'operational', icon: '🍎' },
    { name: 'Google Wallet API', status: 'operational', icon: '🤖' },
    { name: 'PWA Generation', status: 'operational', icon: '🌐' },
    { name: 'Database', status: 'operational', icon: '🗄️' },
    { name: 'QR Generation', status: 'operational', icon: '📱' },
    { name: 'Notification System', status: 'degraded', icon: '📧' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>Real-time status of all system components</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {systems.map((system) => (
            <div key={system.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{system.icon}</span>
                <span className="font-medium">{system.name}</span>
              </div>
              <Badge 
                className={
                  system.status === 'operational' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }
              >
                {system.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminSandbox() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testing Sandbox</h1>
          <p className="text-muted-foreground">
            Global preview mode for cards, wallets, and system flows
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="preview">Card Preview</TabsTrigger>
            <TabsTrigger value="testing">Flow Testing</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-6">
            {/* Card Selection */}
            <Suspense fallback={<div>Loading card selector...</div>}>
              <CardSelector />
            </Suspense>
            
            {/* Wallet Previews */}
            <Suspense fallback={<div>Loading wallet previews...</div>}>
              <WalletPreviews />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="testing" className="space-y-6">
            {/* Test Actions */}
            <TestActions />
            
            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Results from recent test executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  No recent test results
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="status">
            <SystemStatus />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 