"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CardLivePreview } from '@/components/unified/CardLivePreview'

type Template = {
  id: string
  title: string
  desc: string
  iconEmoji: string
  cardColor: string
  cardType: 'stamp' | 'membership'
  stampsRequired?: number
  reward?: string
  membershipType?: string
  totalSessions?: number
}

const templates: Template[] = [
  { id: 'coffee-stamp', title: 'Coffee Shop Stamp', desc: 'Buy 9 get 1 free', iconEmoji: '☕', cardColor: '#8B4513', cardType: 'stamp', stampsRequired: 10, reward: 'Buy 9, get 1 free' },
  { id: 'salon-membership', title: 'Salon Membership', desc: '10 sessions package', iconEmoji: '✂️', cardColor: '#ec4899', cardType: 'membership', membershipType: '10-session pack', totalSessions: 10 },
  { id: 'retail-stamp', title: 'Retail Stamp', desc: 'Spend and earn rewards', iconEmoji: '🛍️', cardColor: '#0ea5e9', cardType: 'stamp', stampsRequired: 12, reward: 'Spend & earn' },
  { id: 'restaurant-stamp', title: 'Restaurant Stamp', desc: 'Dine and collect', iconEmoji: '🍽️', cardColor: '#f97316', cardType: 'stamp', stampsRequired: 10, reward: 'Dine 9, get 1 free' },
  { id: 'fitness-membership', title: 'Fitness Membership', desc: 'Class pack or monthly', iconEmoji: '🏋️', cardColor: '#6366f1', cardType: 'membership', membershipType: 'Monthly', totalSessions: 12 },
  { id: 'healthcare-membership', title: 'Healthcare Membership', desc: 'Session-based', iconEmoji: '🩺', cardColor: '#22c55e', cardType: 'membership', membershipType: '5-session pack', totalSessions: 5 },
]

export default function TemplatesPage() {
  const [businessName, setBusinessName] = useState('Your Business')
  const [cardName, setCardName] = useState('Loyalty Card')
  const [iconEmoji, setIconEmoji] = useState('☕')
  const [cardColor, setCardColor] = useState('#8B4513')
  const [cardType, setCardType] = useState<'stamp' | 'membership'>('stamp')
  const [stampsRequired, setStampsRequired] = useState(10)
  const [reward, setReward] = useState('Buy 9, get 1 free')
  const [membershipType, setMembershipType] = useState('Standard')
  const [totalSessions, setTotalSessions] = useState(10)

  const applyTemplate = (tpl: Template) => {
    setCardName(tpl.title)
    setIconEmoji(tpl.iconEmoji)
    setCardColor(tpl.cardColor)
    setCardType(tpl.cardType)
    if (tpl.cardType === 'stamp') {
      setStampsRequired(tpl.stampsRequired || 10)
      setReward(tpl.reward || 'Reward')
    } else {
      setMembershipType(tpl.membershipType || 'Membership')
      setTotalSessions(tpl.totalSessions || 10)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Templates</h1>
        <p className="text-gray-600">Pick a template and customize it. The live preview updates instantly.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Templates grid */}
        <div className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => applyTemplate(tpl)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{tpl.iconEmoji}</span>
                    {tpl.title}
                  </CardTitle>
                  <CardDescription>{tpl.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Quick controls */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Customize</CardTitle>
              <CardDescription>Adjust a few basics to see your brand reflected in the preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <Label>Card Name</Label>
                  <Input value={cardName} onChange={(e) => setCardName(e.target.value)} />
                </div>
                <div>
                  <Label>Icon Emoji</Label>
                  <Input value={iconEmoji} maxLength={3} onChange={(e) => setIconEmoji(e.target.value)} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Card Color</Label>
                  <Input value={cardColor} onChange={(e) => setCardColor(e.target.value)} placeholder="#8B4513" />
                </div>
                {cardType === 'stamp' ? (
                  <div>
                    <Label>Stamps Required</Label>
                    <Input type="number" min={4} max={20} value={stampsRequired} onChange={(e) => setStampsRequired(parseInt(e.target.value || '10'))} />
                  </div>
                ) : (
                  <div>
                    <Label>Total Sessions</Label>
                    <Input type="number" min={4} max={50} value={totalSessions} onChange={(e) => setTotalSessions(parseInt(e.target.value || '10'))} />
                  </div>
                )}
                {cardType === 'stamp' ? (
                  <div>
                    <Label>Reward</Label>
                    <Input value={reward} onChange={(e) => setReward(e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <Label>Membership Type</Label>
                    <Input value={membershipType} onChange={(e) => setMembershipType(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant={cardType === 'stamp' ? 'default' : 'outline'} onClick={() => setCardType('stamp')}>Stamp</Button>
                <Button variant={cardType === 'membership' ? 'default' : 'outline'} onClick={() => setCardType('membership')}>Membership</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>Switch device view and flip card</CardDescription>
            </CardHeader>
            <CardContent>
              <CardLivePreview
                defaultPlatform="apple"
                showControls={true}
                cardData={{
                  cardType,
                  businessName,
                  cardName,
                  iconEmoji,
                  cardColor,
                  stampsRequired: cardType === 'stamp' ? stampsRequired : undefined,
                  reward: cardType === 'stamp' ? reward : undefined,
                  totalSessions: cardType === 'membership' ? totalSessions : undefined,
                  membershipType: cardType === 'membership' ? membershipType : undefined,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

