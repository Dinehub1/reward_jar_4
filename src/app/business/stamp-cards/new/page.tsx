'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import BusinessLayout from '@/components/layouts/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Smartphone, Wallet, Globe } from 'lucide-react'
import Link from 'next/link'

// Form validation schema
const stampCardSchema = z.object({
  name: z.string().min(1, 'Card name is required').max(100, 'Card name must be under 100 characters'),
  total_stamps: z.number().min(1, 'Must require at least 1 stamp').max(50, 'Maximum 50 stamps allowed'),
  reward_description: z.string().min(1, 'Reward description is required').max(500, 'Description must be under 500 characters'),
  preferred_wallet_type: z.enum(['apple', 'google', 'pwa'])
})

type StampCardForm = z.infer<typeof stampCardSchema>

export default function NewStampCard() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<StampCardForm>({
    resolver: zodResolver(stampCardSchema),
    defaultValues: {
      name: '',
      total_stamps: 10,
      reward_description: '',
      preferred_wallet_type: 'pwa'
    }
  })

  const onSubmit = async (data: StampCardForm) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('Not authenticated')
      }

      // Get business ID for current user
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', session.user.id)
        .single()

      if (!business) {
        throw new Error('Business not found')
      }

      // Insert new stamp card
      const { error: insertError } = await supabase
        .from('stamp_cards')
        .insert({
          business_id: business.id,
          name: data.name,
          total_stamps: data.total_stamps,
          reward_description: data.reward_description,
          preferred_wallet_type: data.preferred_wallet_type,
          status: 'active'
        })

      if (insertError) {
        throw insertError
      }

      // Redirect to dashboard with success
      router.push('/business/dashboard?success=card_created')
    } catch (err) {
      console.error('Error creating stamp card:', err)
      setError(err instanceof Error ? err.message : 'Failed to create stamp card')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BusinessLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/business/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Stamp Card</h1>
            <p className="text-gray-600">Set up a new loyalty program for your customers</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Stamp Card Details</CardTitle>
            <CardDescription>
              Configure your loyalty program settings. Customers will collect stamps and receive rewards when they complete the card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Card Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Card Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Coffee Loyalty Card"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Total Stamps */}
              <div className="space-y-2">
                <Label htmlFor="total_stamps">Number of Stamps Required *</Label>
                <Input
                  id="total_stamps"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="10"
                  {...form.register('total_stamps', { valueAsNumber: true })}
                />
                {form.formState.errors.total_stamps && (
                  <p className="text-sm text-red-600">{form.formState.errors.total_stamps.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  How many stamps do customers need to collect to earn the reward?
                </p>
              </div>

              {/* Reward Description */}
              <div className="space-y-2">
                <Label htmlFor="reward_description">Reward Description *</Label>
                <textarea
                  id="reward_description"
                  rows={3}
                  placeholder="e.g., Free coffee of your choice"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register('reward_description')}
                />
                {form.formState.errors.reward_description && (
                  <p className="text-sm text-red-600">{form.formState.errors.reward_description.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Describe what reward customers will receive when they complete their card.
                </p>
              </div>

              {/* Preferred Wallet Type */}
              <div className="space-y-2">
                <Label htmlFor="preferred_wallet_type">Preferred Wallet Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <input
                      type="radio"
                      id="apple"
                      value="apple"
                      {...form.register('preferred_wallet_type')}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="apple"
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        form.watch('preferred_wallet_type') === 'apple'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Apple Wallet</div>
                        <div className="text-sm text-gray-500">iOS native wallet</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="google"
                      value="google"
                      {...form.register('preferred_wallet_type')}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="google"
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        form.watch('preferred_wallet_type') === 'google'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Wallet className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Google Wallet</div>
                        <div className="text-sm text-gray-500">Android native wallet</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="radio"
                      id="pwa"
                      value="pwa"
                      {...form.register('preferred_wallet_type')}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="pwa"
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        form.watch('preferred_wallet_type') === 'pwa'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">Web App</div>
                        <div className="text-sm text-gray-500">Universal compatibility</div>
                      </div>
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Choose the default wallet type for new customers. They can still use other wallet types if available.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/business/dashboard">
                  <Button type="button" variant="outline" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? (
                    'Creating...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Stamp Card
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>This is how your stamp card will appear to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">
                {form.watch('name') || 'Your Card Name'}
              </h3>
              <div className="flex items-center space-x-2 mb-4">
                {Array.from({ length: form.watch('total_stamps') || 10 }, (_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/50" />
                ))}
              </div>
              <p className="text-sm opacity-90">
                Collect {form.watch('total_stamps') || 10} stamps to earn:
              </p>
              <p className="font-medium">
                {form.watch('reward_description') || 'Your reward description'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
} 