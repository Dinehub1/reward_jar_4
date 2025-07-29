'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Apple, CreditCard, Smartphone, Coffee } from 'lucide-react'

export default function WalletPreviewDebug() {
  const [sessionMarking, setSessionMarking] = useState(false)
  
  // Hardcoded test data
  const testCard = {
    id: '3e234610-9953-4a8b-950e-b03a1924a1fe',
    membership_type: 'loyalty' as const,
    current_stamps: 3,
    stamp_cards: {
      id: '45271341-69f1-4505-984e-14af0ac5b85c',
      name: 'Test Loyalty Card',
      total_stamps: 10,
      reward_description: 'Free coffee after 10 stamps',
      businesses: {
        name: 'Test Business',
        description: 'A great coffee shop'
      }
    },
    customers: {
      name: 'Test Customer',
      email: 'test@example.com'
    }
  }

  // Generate specific wallet type with enhanced error handling
  const generateSpecificWallet = useCallback(async (cardId: string, platform: 'apple' | 'google' | 'pwa', cardType: 'loyalty' | 'membership') => {
    if (sessionMarking) return
    
    setSessionMarking(true)
    
    try {
      console.log(`🎫 Generating ${platform} wallet for ${cardType} card: ${cardId}`)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TEST_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_TEST_TOKEN}`
      }
      
      const response = await fetch(`/api/wallet/${platform}/${cardId}?type=${cardType}`, {
        method: 'GET',
        headers
      })
      
      if (response.ok) {
        console.log(`✅ ${platform} wallet generation successful`)
        
        if (platform === 'apple') {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${cardType === 'loyalty' ? 'Stamp' : 'Membership'}_Card_${cardId.substring(0, 8)}.pkpass`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          alert(`✅ Apple Pass generated successfully! Download should start automatically.`)
        } else {
          window.open(`/api/wallet/${platform}/${cardId}?type=${cardType}`, '_blank')
          alert(`✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)} Pass generated successfully!`)
        }
      } else {
        const errorText = await response.text()
        throw new Error(`${platform} wallet generation failed: ${response.status} ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error generating ${platform} wallet:`, error)
      alert(`❌ Error generating ${platform} pass: ${errorMessage}`)
    }
    
    setTimeout(() => setSessionMarking(false), 1000)
  }, [sessionMarking])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              🎫 Wallet Generation Debug Page
            </CardTitle>
            <p className="text-center text-gray-600">
              Test individual wallet generation buttons
            </p>
          </CardHeader>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-green-700">
                  {testCard.stamp_cards.businesses.name}
                </h3>
                <p className="text-sm text-gray-600">{testCard.stamp_cards.name}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                {testCard.current_stamps}/{testCard.stamp_cards.total_stamps} stamps
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              {testCard.stamp_cards.reward_description}
            </div>
            
            {/* Individual Wallet Generation Tests */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Generate Wallet Passes:</h4>
              
              <Button
                onClick={() => generateSpecificWallet(testCard.id, 'apple', 'loyalty')}
                disabled={sessionMarking}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white flex items-center justify-center gap-2"
              >
                <Apple size={16} />
                Generate Apple Pass
              </Button>
              
              <Button
                onClick={() => generateSpecificWallet(testCard.id, 'google', 'loyalty')}
                disabled={sessionMarking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Generate Google Pass
              </Button>
              
              <Button
                onClick={() => generateSpecificWallet(testCard.id, 'pwa', 'loyalty')}
                disabled={sessionMarking}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
              >
                <Smartphone size={16} />
                Generate PWA Pass
              </Button>
            </div>

            {/* Test Info */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <strong>Test Card ID:</strong> {testCard.id}<br/>
              <strong>Card Type:</strong> {testCard.membership_type}<br/>
              <strong>Stamps:</strong> {testCard.current_stamps}/{testCard.stamp_cards.total_stamps}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 