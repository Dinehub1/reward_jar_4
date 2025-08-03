'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { 
  ArrowRight, 
  CheckCircle, 
  Smartphone,
  Apple,
  Chrome,
  Globe,
  Star,
  Clock,
  Zap,
  Users,
  Eye,
  QrCode
} from 'lucide-react'

export default function CardCreationDemo() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)

  const demoSteps = [
    {
      id: 1,
      title: 'Card Type Selection',
      description: 'Choose between stamp cards and membership cards',
      icon: Star,
      color: 'bg-green-500',
      features: ['QR scanning', 'Progress tracking', 'Reward completion']
    },
    {
      id: 2,
      title: 'Template Selection',
      description: 'Select from RewardJar professional templates',
      icon: Eye,
      color: 'bg-blue-500',
      features: ['8 premium templates', 'Category-specific designs', 'Instant preview']
    },
    {
      id: 3,
      title: 'Branding Customization',
      description: 'Customize colors, logos, and visual theme',
      icon: Zap,
      color: 'bg-purple-500',
      features: ['8 color swatches', 'Custom color picker', 'Logo integration']
    },
    {
      id: 4,
      title: 'Rules Configuration',
      description: 'Set up reward logic and business assignment',
      icon: Users,
      color: 'bg-orange-500',
      features: ['Business selection', 'Reward rules', 'Tier configuration']
    },
    {
      id: 5,
      title: 'QR & Customer Info',
      description: 'Configure QR code and customer information display',
      icon: QrCode,
      color: 'bg-pink-500',
      features: ['QR code settings', 'Customer data display', 'Privacy controls']
    },
    {
      id: 6,
      title: 'Live Wallet Preview',
      description: 'Preview across Apple, Google, and PWA wallets',
      icon: Smartphone,
      color: 'bg-indigo-500',
      features: ['Apple Wallet preview', 'Google Wallet preview', 'PWA preview']
    },
    {
      id: 7,
      title: 'Deploy to Wallets',
      description: 'Push to all wallet platforms simultaneously',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      features: ['Multi-platform deployment', 'Wallet queue integration', 'Real-time sync']
    }
  ]

  const handleNextStep = () => {
    if (currentStep < demoSteps.length) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 300)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 300)
    }
  }

  const currentStepData = demoSteps.find(step => step.id === currentStep)

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced Card Creation System
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive 7-step flow for creating professional loyalty and membership cards with live wallet previews
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                Admin-Only Creation
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Multi-Wallet Support
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Live Preview
              </Badge>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-4">
            {demoSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="text-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    currentStep >= step.id 
                      ? `${step.color} border-transparent text-white shadow-lg` 
                      : currentStep === step.id - 1
                      ? 'border-primary/50 text-primary animate-pulse'
                      : 'border-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? '✓' : <step.icon className="h-4 w-4" />}
                  </div>
                  <div className="mt-2">
                    <span className={`text-xs font-medium block ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      Step {step.id}
                    </span>
                  </div>
                </div>
                {index < demoSteps.length - 1 && <div className="w-6 h-px bg-border mx-2 mt-6" />}
              </div>
            ))}
          </div>

          {/* Main Demo Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Step Details */}
            <Card className={`transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${currentStepData?.color} text-white`}>
                    {currentStepData && <currentStepData.icon className="h-6 w-6" />}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
                    <p className="text-muted-foreground">{currentStepData?.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    {currentStepData?.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-specific content */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                      <Star className="h-8 w-8 text-green-600 mb-2" />
                      <h5 className="font-semibold">Stamp Card</h5>
                      <p className="text-xs text-muted-foreground">Collect stamps for rewards</p>
                    </div>
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <Clock className="h-8 w-8 text-blue-600 mb-2" />
                      <h5 className="font-semibold">Membership Card</h5>
                      <p className="text-xs text-muted-foreground">Session-based memberships</p>
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center p-3 border rounded-lg">
                      <Apple className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-xs font-medium">Apple Wallet</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <Chrome className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-xs font-medium">Google Wallet</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <Globe className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-xs font-medium">PWA Wallet</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visual Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="w-80 h-48 rounded-xl shadow-lg relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600">
                    {/* Mock Card Preview */}
                    <div className="p-4 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">Demo Business</h3>
                          <p className="text-sm opacity-90">Premium Loyalty Card</p>
                        </div>
                        <span className="text-2xl">☕</span>
                      </div>
                    </div>

                    <div className="px-4 py-2">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex space-x-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full border ${
                                i < currentStep ? 'bg-white' : 'bg-transparent border-white'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm">{currentStep}/10</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white text-xs opacity-90">
                        Step {currentStep}: {currentStepData?.title}
                      </p>
                    </div>

                    <div className="absolute bottom-4 right-4">
                      <div className="w-8 h-8 bg-white/20 rounded border border-white/40 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-white/60" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-sm font-medium mb-2">
                    Progress: {Math.round((currentStep / demoSteps.length) * 100)}% Complete
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(currentStep / demoSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              Previous Step
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {demoSteps.length}
              </div>
            </div>

            {currentStep < demoSteps.length ? (
              <Button onClick={handleNextStep}>
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => window.open('/admin/cards/new', '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                Try Card Creation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Feature Summary */}
          <Card>
            <CardHeader>
              <CardTitle>System Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Admin-Only Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    Centralized card creation ensures quality control and consistency across all business cards.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Multi-Wallet Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Simultaneous deployment to Apple Wallet, Google Wallet, and PWA with device detection.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Live Preview</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time preview updates as you customize colors, branding, and card configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutClient>
  )
}