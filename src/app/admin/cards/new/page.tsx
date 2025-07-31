'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import LivePreviewBuilder from '@/components/wallet/LivePreviewBuilder'
import { createClient } from '@/lib/supabase/client'

import { ArrowLeft, Save, Eye, Palette, Settings, Zap } from 'lucide-react'

interface Business {
  id: string
  name: string
  contact_email: string
}

interface CardTemplate {
  id: string
  name: string
  description: string
  category: string
  theme: {
    background: string
    primaryColor: string
    secondaryColor: string
    textColor: string
    font: string
  }
  defaultValues: {
    total_stamps?: number
    total_sessions?: number
    cost?: number
    duration_days?: number
  }
}

export default function NewCardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<CardTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // Fetch businesses using admin API
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        console.log('🏢 CARD CREATION - Fetching businesses...')
        const response = await fetch('/api/admin/all-data')
        const result = await response.json()
        
        if (result.success && result.data?.businesses) {
          const activeBusinesses = result.data.businesses.filter(b => b.status === 'active')
          setBusinesses(activeBusinesses)
          console.log('🏢 CARD CREATION - Businesses loaded:', activeBusinesses.length)
        } else {
          console.error('🏢 CARD CREATION - Failed to load businesses:', result)
        }
      } catch (error) {
        console.error('🏢 CARD CREATION - Error fetching businesses:', error)
      }
    }
    
    fetchBusinesses()
  }, [])

  // Card creation form data
  const [cardType, setCardType] = useState<'stamp' | 'membership'>('stamp')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null)
  const [cardData, setCardData] = useState({
    name: '',
    description: '',
    reward_description: '',
    business_name: '',
    card_type: 'stamp' as 'stamp' | 'membership',
    theme: {
      background: '#4F46E5',
      primaryColor: '#4F46E5',
      secondaryColor: '#E0E7FF',
      textColor: '#FFFFFF',
      font: 'Inter'
    },
    values: {
      stamps_used: 0,
      total_stamps: 10,
      sessions_used: 0,
      total_sessions: 30,
      cost: 0,
      duration_days: 365
    },
    status: 'draft' as 'draft' | 'active'
  })

  // Load templates
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {

        // Load card templates (mock data for now)
        setTemplates([
          {
            id: 'coffee-loyalty',
            name: 'Coffee Shop Loyalty',
            description: 'Perfect for cafes and coffee shops',
            category: 'Food & Beverage',
            theme: {
              background: '#8B4513',
              primaryColor: '#8B4513',
              secondaryColor: '#D2B48C',
              textColor: '#FFFFFF',
              font: 'Inter'
            },
            defaultValues: { total_stamps: 10 }
          },
          {
            id: 'gym-membership',
            name: 'Fitness Membership',
            description: 'Ideal for gyms and fitness centers',
            category: 'Health & Fitness',
            theme: {
              background: '#DC2626',
              primaryColor: '#DC2626',
              secondaryColor: '#FEE2E2',
              textColor: '#FFFFFF',
              font: 'Inter'
            },
            defaultValues: { total_sessions: 30, cost: 59.99, duration_days: 30 }
          },
          {
            id: 'beauty-loyalty',
            name: 'Beauty & Spa',
            description: 'Great for salons and spas',
            category: 'Beauty & Wellness',
            theme: {
              background: '#EC4899',
              primaryColor: '#EC4899',
              secondaryColor: '#FCE7F3',
              textColor: '#FFFFFF',
              font: 'Inter'
            },
            defaultValues: { total_stamps: 8 }
          },
          {
            id: 'restaurant-loyalty',
            name: 'Restaurant Rewards',
            description: 'Perfect for restaurants and dining',
            category: 'Food & Beverage',
            theme: {
              background: '#059669',
              primaryColor: '#059669',
              secondaryColor: '#D1FAE5',
              textColor: '#FFFFFF',
              font: 'Inter'
            },
            defaultValues: { total_stamps: 12 }
          }
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleTemplateSelect = (template: CardTemplate) => {
    setSelectedTemplate(template)
    setCardData(prev => ({
      ...prev,
      card_type: template.defaultValues.total_stamps ? 'stamp' : 'membership',
      theme: template.theme,
      values: {
        ...prev.values,
        ...template.defaultValues
      }
    }))
    setCardType(template.defaultValues.total_stamps ? 'stamp' : 'membership')
  }

  const handleBusinessSelect = (businessId: string) => {
    setSelectedBusinessId(businessId)
    const business = businesses.find(b => b.id === businessId)
    if (business) {
      setCardData(prev => ({
        ...prev,
        business_name: business.name
      }))
    }
  }

  const handleSaveCard = async (status: 'draft' | 'active') => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      
      const cardPayload = {
        business_id: selectedBusinessId,
        name: cardData.name,
        reward_description: cardData.reward_description,
        status: status,
        ...(cardType === 'stamp' ? {
          total_stamps: cardData.values.total_stamps
        } : {
          total_sessions: cardData.values.total_sessions,
          cost: cardData.values.cost,
          duration_days: cardData.values.duration_days,
          membership_type: 'premium'
        })
      }

      const tableName = cardType === 'stamp' ? 'stamp_cards' : 'membership_cards'
      const { data, error } = await supabase
        .from(tableName)
        .insert([cardPayload])
        .select()
        .single()

      if (error) {
        console.error('Error saving card:', error)
        alert('Failed to save card. Please try again.')
        return
      }

      // Log admin action
      await supabase
        .from('admin_support_logs')
        .insert([{
          action: 'create_card',
          target_type: 'card',
          target_id: data.id,
          target_name: cardData.name,
          comment: `Created ${cardType} card: ${cardData.name}`,
          metadata: {
            card_type: cardType,
            business_id: selectedBusinessId,
            template_id: selectedTemplate?.id,
            status: status
          }
        }])

      alert(`Card ${status === 'draft' ? 'saved as draft' : 'created and activated'} successfully!`)
      router.push('/admin/cards')
    } catch (error) {
      console.error('Error saving card:', error)
      alert('Failed to save card. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }



  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/cards')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Cards
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Create New Card</h1>
                <p className="text-muted-foreground">Design and configure a new loyalty or membership card</p>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Step {step} of 4
            </Badge>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {[
              { num: 1, title: 'Card Type', icon: Settings },
              { num: 2, title: 'Template', icon: Palette },
              { num: 3, title: 'Configuration', icon: Zap },
              { num: 4, title: 'Preview & Save', icon: Eye }
            ].map(({ num, title, icon: Icon }) => (
              <div key={num} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= num 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted text-muted-foreground'
                }`}>
                  {step > num ? '✓' : <Icon className="h-4 w-4" />}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= num ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {title}
                </span>
                {num < 4 && <div className="w-8 h-px bg-border mx-4" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Step 1: Card Type Selection */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Card Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setCardType('stamp')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          cardType === 'stamp' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <h3 className="font-semibold">Stamp Card</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Collect stamps to earn rewards
                        </p>
                      </button>
                      <button
                        onClick={() => setCardType('membership')}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          cardType === 'membership' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <h3 className="font-semibold">Membership Card</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Session-based memberships
                        </p>
                      </button>
                    </div>
                    <Button 
                      onClick={() => setStep(2)} 
                      disabled={!cardType}
                      className="w-full"
                    >
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Template Selection */}
              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {templates
                        .filter(t => cardType === 'stamp' ? t.defaultValues.total_stamps : t.defaultValues.total_sessions)
                        .map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{template.name}</h3>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {template.category}
                              </Badge>
                            </div>
                            <div 
                              className="w-8 h-8 rounded-full"
                              style={{ backgroundColor: template.theme.primaryColor }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep(3)} 
                        disabled={!selectedTemplate}
                        className="flex-1"
                      >
                        Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Configuration */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Card Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="business">Business</Label>
                      <Select value={selectedBusinessId} onValueChange={handleBusinessSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business" />
                        </SelectTrigger>
                        <SelectContent>
                          {businesses.length === 0 ? (
                            <SelectItem value="empty" disabled>
                              No businesses found
                            </SelectItem>
                          ) : (
                            businesses.map((business) => (
                              <SelectItem key={business.id} value={business.id}>
                                {business.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="card-name">Card Name</Label>
                      <Input
                        id="card-name"
                        value={cardData.name}
                        onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter card name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reward-description">Reward Description</Label>
                      <Textarea
                        id="reward-description"
                        value={cardData.reward_description}
                        onChange={(e) => setCardData(prev => ({ ...prev, reward_description: e.target.value }))}
                        placeholder="Describe the reward customers will receive"
                        rows={3}
                      />
                    </div>

                    {cardType === 'stamp' ? (
                      <div>
                        <Label htmlFor="total-stamps">Total Stamps Required</Label>
                        <Input
                          id="total-stamps"
                          type="number"
                          value={cardData.values.total_stamps}
                          onChange={(e) => setCardData(prev => ({
                            ...prev,
                            values: { ...prev.values, total_stamps: parseInt(e.target.value) || 10 }
                          }))}
                          min="1"
                          max="50"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="total-sessions">Total Sessions</Label>
                          <Input
                            id="total-sessions"
                            type="number"
                            value={cardData.values.total_sessions}
                            onChange={(e) => setCardData(prev => ({
                              ...prev,
                              values: { ...prev.values, total_sessions: parseInt(e.target.value) || 30 }
                            }))}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cost">Cost ($)</Label>
                          <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            value={cardData.values.cost}
                            onChange={(e) => setCardData(prev => ({
                              ...prev,
                              values: { ...prev.values, cost: parseFloat(e.target.value) || 0 }
                            }))}
                            min="0"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep(4)} 
                        disabled={!selectedBusinessId || !cardData.name || !cardData.reward_description}
                        className="flex-1"
                      >
                        Continue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Save Actions */}
              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Save Card</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Review your card in the preview panel and save when ready.
                    </p>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep(3)}>
                        Back
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleSaveCard('draft')}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? 'Saving...' : 'Save as Draft'}
                      </Button>
                      <Button 
                        onClick={() => handleSaveCard('active')}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        {isSaving ? 'Saving...' : 'Create & Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Live Preview Panel */}
            <div className="lg:sticky lg:top-6">
              {step >= 2 && selectedTemplate && (
                <LivePreviewBuilder
                  cardData={{
                    id: 'preview',
                    ...cardData
                  }}
                  onCardDataChange={(data) => setCardData(prev => ({ ...prev, ...data }))}
                  isEditable={step >= 3}
                  showControls={step >= 3}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  )
} 