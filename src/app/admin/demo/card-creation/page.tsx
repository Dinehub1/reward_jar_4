'use client'

import { useState } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  PlayCircle, 
  CreditCard, 
  Palette, 
  Eye, 
  Download,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

interface DemoStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

function LegacyCardCreationDemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [demoStarted, setDemoStarted] = useState(false)

  const demoSteps: DemoStep[] = [
    {
      id: 'setup',
      title: 'Setup & Business Selection',
      description: 'Choose your business and configure basic settings',
      completed: currentStep > 0,
      current: currentStep === 0
    },
    {
      id: 'design',
      title: 'Card Design & Branding',
      description: 'Design your loyalty card with colors, icons, and branding',
      completed: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: 'rewards',
      title: 'Rewards Configuration',
      description: 'Set up stamp requirements and reward descriptions',
      completed: currentStep > 2,
      current: currentStep === 2
    },
    {
      id: 'preview',
      title: 'Live Preview & Testing',
      description: 'See how your card looks across different devices',
      completed: currentStep > 3,
      current: currentStep === 3
    },
    {
      id: 'deploy',
      title: 'Deployment & Sharing',
      description: 'Generate QR codes and wallet integrations',
      completed: currentStep > 4,
      current: currentStep === 4
    }
  ]

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const startDemo = () => {
    setDemoStarted(true)
    setCurrentStep(0)
  }

  const resetDemo = () => {
    setDemoStarted(false)
    setCurrentStep(0)
  }

  if (!demoStarted) {
    return (
      <AdminLayoutClient>
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <PlayCircle className="h-12 w-12 text-blue-600" />
              <h1 className="text-4xl font-bold">Card Creation Demo</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Interactive demonstration of RewardJar's complete card creation workflow
            </p>
          </div>

          {/* Demo Overview */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Sparkles className="h-6 w-6" />
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-700">Complete Workflow</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Business setup and configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Card design and customization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Reward structure definition
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-700">Integration Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Apple Wallet integration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Google Wallet compatibility
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      PWA and web wallet support
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Steps Preview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {demoSteps.map((step, index) => (
              <Card key={step.id} className="text-center">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button onClick={startDemo} size="lg" className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Start Interactive Demo
            </Button>
            <Link href="/admin/cards/new">
              <Button variant="outline" size="lg" className="gap-2">
                <CreditCard className="h-5 w-5" />
                Go to Real Card Creation
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayoutClient>
    )
  }

  return (
    <AdminLayoutClient>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header with Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Card Creation Demo</h1>
            <Button onClick={resetDemo} variant="outline">
              Reset Demo
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {demoSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / demoSteps.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentStep + 1) / demoSteps.length) * 100} className="h-2" />
          </div>
        </div>

        {/* Current Step */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {currentStep + 1}
              </div>
              {demoSteps[currentStep].title}
            </CardTitle>
            <p className="text-muted-foreground">{demoSteps[currentStep].description}</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="demo" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="code">Implementation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="demo" className="space-y-6 mt-6">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Business Setup
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Demo Business Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Business Name</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">Coffee Corner Café</div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Industry</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">Food & Beverage</div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Location</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">Downtown District</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Configuration Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Multi-location support</span>
                            <Badge variant="secondary">Enabled</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Digital wallet integration</span>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Analytics tracking</span>
                            <Badge variant="secondary">On</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Palette className="h-5 w-5 text-pink-500" />
                      Card Design & Branding
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Visual Elements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded"></div>
                            <span className="text-sm">Primary Color: Orange (#F97316)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">☕</span>
                            <span className="text-sm">Icon: Coffee Cup Emoji</span>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Card Name</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">Coffee Loyalty Card</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Brand Assets</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="border-2 border-dashed border-gray-200 p-4 text-center">
                            <div className="w-16 h-16 bg-orange-500 rounded mx-auto mb-2 flex items-center justify-center text-white text-2xl">
                              ☕
                            </div>
                            <p className="text-sm text-muted-foreground">Business Logo Preview</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-green-500" />
                      Rewards Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Stamp Requirements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Stamps Required</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">10 stamps</div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">How to Earn</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">Purchase any coffee drink</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Reward Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Reward</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">Free large coffee</div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Expiry</label>
                            <div className="p-2 bg-gray-50 rounded text-sm">30 days from issue</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-500" />
                      Live Preview & Testing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Mobile Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-[2/3] bg-orange-500 rounded-lg p-4 text-white text-center">
                            <div className="space-y-2">
                              <div className="text-2xl">☕</div>
                              <div className="font-semibold">Coffee Loyalty Card</div>
                              <div className="text-sm opacity-90">Coffee Corner Café</div>
                              <div className="mt-4 space-y-1">
                                <div className="grid grid-cols-5 gap-1">
                                  {[...Array(10)].map((_, i) => (
                                    <div key={i} className={`aspect-square rounded-sm ${i < 3 ? 'bg-white' : 'bg-white/30'}`} />
                                  ))}
                                </div>
                                <div className="text-xs">3 of 10 stamps</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Apple Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-[2/3] bg-gradient-to-b from-orange-400 to-orange-600 rounded-lg p-3 text-white">
                            <div className="text-xs opacity-75 mb-1">LOYALTY CARD</div>
                            <div className="font-semibold text-sm">Coffee Corner Café</div>
                            <div className="text-xs opacity-90 mb-3">Coffee Loyalty Card</div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <div className="text-xs">Progress: 3/10</div>
                              <div className="w-full bg-white/30 rounded-full h-1 mt-1">
                                <div className="bg-white h-1 rounded-full" style={{width: '30%'}}></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Google Wallet</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-[2/3] bg-white border-2 border-orange-200 rounded-lg p-3">
                            <div className="text-orange-600 text-xs font-medium mb-1">LOYALTY</div>
                            <div className="font-semibold text-sm text-gray-800">Coffee Corner Café</div>
                            <div className="text-xs text-gray-600 mb-3">Coffee Loyalty Card</div>
                            <div className="text-center text-2xl mb-2">☕</div>
                            <div className="text-center">
                              <div className="text-xs text-gray-600">Stamps collected</div>
                              <div className="text-lg font-semibold text-orange-600">3 / 10</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-500" />
                      Deployment & Sharing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Deployment Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">QR Code Generation</span>
                            <Badge variant="default">Ready</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Apple Wallet Integration</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Google Wallet Support</span>
                            <Badge variant="default">Configured</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Web Sharing</span>
                            <Badge variant="default">Live</Badge>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Success Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <div className="font-semibold text-green-800">Demo Complete!</div>
                            <div className="text-sm text-green-600">Card ready for deployment</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4 mt-6">
                <div className="text-center p-8 border border-dashed border-gray-200 rounded-lg">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Live Preview Mode</h3>
                  <p className="text-muted-foreground mb-4">See how your card looks in real wallet apps</p>
                  <Button variant="outline">
                    Open in New Tab
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="space-y-4 mt-6">
                <div className="text-center p-8 border border-dashed border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Implementation Details</h3>
                  <p className="text-muted-foreground mb-4">Code snippets and API integration examples</p>
                  <Link href="/admin/cards/new">
                    <Button>
                      View Real Implementation
                    </Button>
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button onClick={prevStep} disabled={currentStep === 0} variant="outline">
            Previous Step
          </Button>
          <div className="flex gap-2">
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          {currentStep === demoSteps.length - 1 ? (
            <Link href="/admin/cards/new">
              <Button className="gap-2">
                Create Real Card
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button onClick={nextStep}>
              Next Step
            </Button>
          )}
        </div>
      </div>
    </AdminLayoutClient>
  )
}
export default function CardCreationDemoPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Card Creation Demo Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the card creation demo</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyCardCreationDemoPage />
      </div>
    </ComponentErrorBoundary>
  )
}