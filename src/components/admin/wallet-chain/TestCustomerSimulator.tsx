'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Play, 
  Users, 
  CreditCard, 
  Wallet, 
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

interface TestCustomerSimulatorProps {
  className?: string
}

interface SimulationResult {
  action: string
  success: boolean
  data?: any
  testEntities?: {
    customers: string[]
    cards: string[]
    walletRequests: string[]
  }
  metrics?: {
    totalTime: number
    successRate: number
    errors: string[]
  }
  cleanup?: {
    entitiesRemoved: number
    errors: string[]
  }
}

export function TestCustomerSimulator({ className = '' }: TestCustomerSimulatorProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([])
  const [currentAction, setCurrentAction] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Simulation Configuration
  const [cardType, setCardType] = useState<'stamp' | 'membership'>('stamp')
  const [platforms, setPlatforms] = useState<string[]>(['pwa'])
  const [customerCount, setCustomerCount] = useState(1)
  const [cardCount, setCardCount] = useState(1)
  const [testDuration, setTestDuration] = useState(5)

  const handlePlatformToggle = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const executeSimulation = async (action: string, config: any = {}) => {
    setIsRunning(true)
    setCurrentAction(action)
    setError(null)

    try {
      const response = await fetch('/api/admin/wallet-chain/test-simulator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          cardType,
          platforms,
          customerCount,
          cardCount,
          testDuration,
          ...config
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'Simulation request failed')
      }

      setSimulationResults(prev => [...prev, data.data])
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setSimulationResults(prev => [...prev, {
        action,
        success: false,
        metrics: {
          totalTime: 0,
          successRate: 0,
          errors: [errorMessage]
        }
      }])
      throw err
    } finally {
      setIsRunning(false)
      setCurrentAction('')
    }
  }

  const handleQuickTest = async () => {
    try {
      await executeSimulation('create_customer', { customerCount: 1 })
      await executeSimulation('create_card', { cardCount: 1 })
      await executeSimulation('generate_wallet')
    } catch (error) {
      console.error('Quick test failed:', error)
    }
  }

  const handleFullSimulation = async () => {
    try {
      await executeSimulation('simulate_flow', {
        cardType,
        platforms,
        testDuration
      })
    } catch (error) {
      console.error('Full simulation failed:', error)
    }
  }

  const handleCleanup = async () => {
    try {
      await executeSimulation('cleanup')
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  }

  const clearResults = () => {
    setSimulationResults([])
    setError(null)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create_customer':
        return <Users className="h-4 w-4" />
      case 'create_card':
        return <CreditCard className="h-4 w-4" />
      case 'generate_wallet':
        return <Wallet className="h-4 w-4" />
      case 'simulate_flow':
        return <TestTube className="h-4 w-4" />
      case 'cleanup':
        return <Trash2 className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  const getSuccessIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const renderSimulationResult = (result: SimulationResult, index: number) => {
    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              {getActionIcon(result.action)}
              <span className="ml-2 capitalize">{result.action.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center space-x-2">
              {getSuccessIcon(result.success)}
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Metrics */}
          {result.metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Processing Time</div>
                <div className="text-lg font-semibold">{result.metrics.totalTime}ms</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
                <div className="text-lg font-semibold">{result.metrics.successRate}%</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Errors</div>
                <div className="text-lg font-semibold">{result.metrics.errors.length}</div>
              </div>
            </div>
          )}

          {/* Test Entities */}
          {result.testEntities && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Entities Created</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customers:</span> {result.testEntities.customers.length}
                  {result.testEntities.customers.length > 0 && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {result.testEntities.customers.slice(0, 2).map(id => id.substring(0, 8)).join(', ')}
                      {result.testEntities.customers.length > 2 && '...'}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium">Cards:</span> {result.testEntities.cards.length}
                  {result.testEntities.cards.length > 0 && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {result.testEntities.cards.slice(0, 2).map(id => id.substring(0, 8)).join(', ')}
                      {result.testEntities.cards.length > 2 && '...'}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium">Wallet Requests:</span> {result.testEntities.walletRequests.length}
                  {result.testEntities.walletRequests.length > 0 && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {result.testEntities.walletRequests.slice(0, 1).map(id => id.substring(0, 8)).join(', ')}
                      {result.testEntities.walletRequests.length > 1 && '...'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cleanup Results */}
          {result.cleanup && (
            <div className="space-y-2">
              <h4 className="font-medium">Cleanup Results</h4>
              <div className="text-sm">
                <span className="font-medium">Entities Removed:</span> {result.cleanup.entitiesRemoved}
              </div>
              {result.cleanup.errors.length > 0 && (
                <div className="space-y-1">
                  {result.cleanup.errors.map((error, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specific Data */}
          {result.data && (
            <div className="space-y-2">
              <h4 className="font-medium">Result Data</h4>
              <div className="bg-gray-50 p-3 rounded text-xs">
                <pre>{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Errors */}
          {result.metrics?.errors && result.metrics.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Errors</h4>
              {result.metrics.errors.map((error, i) => (
                <Alert key={i} variant="destructive">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Test Customer Simulator</h2>
        <p className="text-sm text-muted-foreground">
          Create test customers, cards, and simulate complete wallet generation flows
        </p>
      </div>

      {/* Configuration and Actions */}
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">Quick Test</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Simulation</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
        </TabsList>

        {/* Quick Test Tab */}
        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Quick Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run a quick test that creates a customer, card, and generates a wallet pass.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Card Type</Label>
                  <Select value={cardType} onValueChange={(value: 'stamp' | 'membership') => setCardType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stamp">Stamp Card</SelectItem>
                      <SelectItem value="membership">Membership Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex space-x-2">
                    {['apple', 'google', 'pwa'].map((platform) => (
                      <div key={platform} className="flex items-center space-x-1">
                        <Checkbox
                          id={platform}
                          checked={platforms.includes(platform)}
                          onCheckedChange={() => handlePlatformToggle(platform)}
                          disabled={isRunning}
                        />
                        <Label htmlFor={platform} className="text-sm capitalize">
                          {platform}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleQuickTest} 
                disabled={isRunning || platforms.length === 0}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Quick Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Quick Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Simulation Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Advanced Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Run a complete end-to-end simulation with configurable parameters.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerCount">Customer Count</Label>
                  <Input
                    id="customerCount"
                    type="number"
                    min="1"
                    max="10"
                    value={customerCount}
                    onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardCount">Card Count</Label>
                  <Input
                    id="cardCount"
                    type="number"
                    min="1"
                    max="10"
                    value={cardCount}
                    onChange={(e) => setCardCount(parseInt(e.target.value) || 1)}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testDuration">Test Duration (minutes)</Label>
                  <Input
                    id="testDuration"
                    type="number"
                    min="1"
                    max="60"
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value) || 5)}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select value={cardType} onValueChange={(value: 'stamp' | 'membership') => setCardType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stamp">Stamp Card</SelectItem>
                    <SelectItem value="membership">Membership Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex space-x-4">
                  {['apple', 'google', 'pwa'].map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={`adv-${platform}`}
                        checked={platforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                        disabled={isRunning}
                      />
                      <Label htmlFor={`adv-${platform}`} className="text-sm capitalize">
                        {platform}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleFullSimulation} 
                disabled={isRunning || platforms.length === 0}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Full Simulation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeSimulation('create_customer', { customerCount })}
                  disabled={isRunning}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create Customers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeSimulation('create_card', { cardCount, cardType })}
                  disabled={isRunning}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Create Cards
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeSimulation('generate_wallet', { platforms })}
                  disabled={isRunning || platforms.length === 0}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Generate Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cleanup Tab */}
        <TabsContent value="cleanup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trash2 className="h-5 w-5 mr-2" />
                Cleanup Test Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will remove all test customers, cards, and related data created during simulations.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>

              <Button 
                variant="destructive" 
                onClick={handleCleanup} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning Up...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Up All Test Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Action */}
      {isRunning && currentAction && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div>
                <div className="font-medium">Running: {currentAction.replace('_', ' ')}</div>
                <div className="text-sm text-muted-foreground">Please wait...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {simulationResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Simulation Results</h3>
            <Button variant="outline" size="sm" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
          <div className="space-y-2">
            {simulationResults.map((result, index) => renderSimulationResult(result, index))}
          </div>
        </div>
      )}
    </div>
  )
}