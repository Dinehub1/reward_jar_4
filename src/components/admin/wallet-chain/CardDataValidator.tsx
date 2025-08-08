'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Loader2,
  Info,
  ExternalLink,
  Apple,
  Smartphone
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface CardDataValidatorProps {
  className?: string
}

interface ValidationResult {
  cardId: string
  customerId?: string
  cardType: 'stamp' | 'membership'
  overall: 'valid' | 'warnings' | 'invalid'
  unifiedData?: any
  validations: {
    dataIntegrity: {
      valid: boolean
      errors: string[]
      warnings: string[]
    }
    appleWallet: {
      valid: boolean
      errors: string[]
      warnings: string[]
      requirements: {
        formatVersion: boolean
        passTypeIdentifier: boolean
        serialNumber: boolean
        organizationName: boolean
        description: boolean
        barcodes: boolean
      }
    }
    googleWallet: {
      valid: boolean
      errors: string[]
      warnings: string[]
      requirements: {
        classId: boolean
        objectId: boolean
        state: boolean
        barcode: boolean
        textModules: boolean
      }
    }
    pwa: {
      valid: boolean
      errors: string[]
      warnings: string[]
      requirements: {
        title: boolean
        subtitle: boolean
        barcode: boolean
        theme: boolean
        actions: boolean
      }
    }
  }
  recommendations: string[]
  timestamp: string
}

export function CardDataValidator({ className = '' }: CardDataValidatorProps) {
  const [cardId, setCardId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleValidate = async () => {
    if (!cardId.trim()) {
      setError('Card ID is required')
      return
    }

    setIsValidating(true)
    setError(null)
    setValidationResult(null)

    try {
      const response = await fetch('/api/admin/wallet-chain/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId: cardId.trim(),
          customerId: customerId.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed')
      }

      if (!data.success) {
        throw new Error(data.error || 'Validation request failed')
      }

      setValidationResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClear = () => {
    setCardId('')
    setCustomerId('')
    setValidationResult(null)
    setError(null)
  }

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warnings':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getValidationIcon = (valid: boolean) => {
    return valid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const calculateCompletionPercentage = (requirements: Record<string, boolean>) => {
    const total = Object.keys(requirements).length
    const completed = Object.values(requirements).filter(Boolean).length
    return total > 0 ? (completed / total) * 100 : 0
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Card Data Validator</h2>
        <p className="text-sm text-muted-foreground">
          Validate customer card data against Apple/Google/PWA requirements
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Validation Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardId">Card ID *</Label>
              <Input
                id="cardId"
                type="text"
                placeholder="Enter card ID"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                disabled={isValidating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID (Optional)</Label>
              <Input
                id="customerId"
                type="text"
                placeholder="Enter customer ID for specific validation"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isValidating}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleValidate} disabled={isValidating || !cardId.trim()}>
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Validate
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClear} disabled={isValidating}>
              Clear
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  {getOverallStatusIcon(validationResult.overall)}
                  <span className="ml-2">Validation Results</span>
                </div>
                <Badge 
                  variant={validationResult.overall === 'valid' ? 'default' : 
                          validationResult.overall === 'warnings' ? 'secondary' : 'destructive'}
                  className="capitalize"
                >
                  {validationResult.overall}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Card Type</div>
                  <div className="text-lg font-semibold capitalize">{validationResult.cardType}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Card ID</div>
                  <div className="text-lg font-mono">{validationResult.cardId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Validated At</div>
                  <div className="text-lg">{new Date(validationResult.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Validations */}
          <Tabs defaultValue="apple" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="data">Data Integrity</TabsTrigger>
              <TabsTrigger value="apple" className="flex items-center">
                <Apple className="h-4 w-4 mr-1" />
                Apple
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center">
                <span className="text-lg mr-1">G</span>
                Google
              </TabsTrigger>
              <TabsTrigger value="pwa" className="flex items-center">
                <Smartphone className="h-4 w-4 mr-1" />
                PWA
              </TabsTrigger>
            </TabsList>

            {/* Data Integrity Tab */}
            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Data Integrity Validation</span>
                    {getValidationIcon(validationResult.validations.dataIntegrity.valid)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.validations.dataIntegrity.valid ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        All data integrity checks passed. The card data is valid and complete.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {validationResult.validations.dataIntegrity.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Apple Wallet Tab */}
            <TabsContent value="apple" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Apple Wallet Validation</span>
                    {getValidationIcon(validationResult.validations.appleWallet.valid)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Requirements Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Requirements Completion</span>
                      <span>{calculateCompletionPercentage(validationResult.validations.appleWallet.requirements).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={calculateCompletionPercentage(validationResult.validations.appleWallet.requirements)} 
                      className="h-2" 
                    />
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Required Fields</h4>
                    {Object.entries(validationResult.validations.appleWallet.requirements).map(([field, valid]) => (
                      <div key={field} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                        {getValidationIcon(valid)}
                      </div>
                    ))}
                  </div>

                  {/* Errors and Warnings */}
                  {validationResult.validations.appleWallet.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Errors</h4>
                      {validationResult.validations.appleWallet.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {validationResult.validations.appleWallet.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-600">Warnings</h4>
                      {validationResult.validations.appleWallet.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Google Wallet Tab */}
            <TabsContent value="google" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Google Wallet Validation</span>
                    {getValidationIcon(validationResult.validations.googleWallet.valid)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Requirements Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Requirements Completion</span>
                      <span>{calculateCompletionPercentage(validationResult.validations.googleWallet.requirements).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={calculateCompletionPercentage(validationResult.validations.googleWallet.requirements)} 
                      className="h-2" 
                    />
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Required Fields</h4>
                    {Object.entries(validationResult.validations.googleWallet.requirements).map(([field, valid]) => (
                      <div key={field} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                        {getValidationIcon(valid)}
                      </div>
                    ))}
                  </div>

                  {/* Errors and Warnings */}
                  {validationResult.validations.googleWallet.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Errors</h4>
                      {validationResult.validations.googleWallet.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {validationResult.validations.googleWallet.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-600">Warnings</h4>
                      {validationResult.validations.googleWallet.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PWA Tab */}
            <TabsContent value="pwa" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>PWA Validation</span>
                    {getValidationIcon(validationResult.validations.pwa.valid)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Requirements Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Requirements Completion</span>
                      <span>{calculateCompletionPercentage(validationResult.validations.pwa.requirements).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={calculateCompletionPercentage(validationResult.validations.pwa.requirements)} 
                      className="h-2" 
                    />
                  </div>

                  {/* Requirements Checklist */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Required Fields</h4>
                    {Object.entries(validationResult.validations.pwa.requirements).map(([field, valid]) => (
                      <div key={field} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                        {getValidationIcon(valid)}
                      </div>
                    ))}
                  </div>

                  {/* Errors and Warnings */}
                  {validationResult.validations.pwa.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Errors</h4>
                      {validationResult.validations.pwa.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {validationResult.validations.pwa.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-yellow-600">Warnings</h4>
                      {validationResult.validations.pwa.warnings.map((warning, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recommendations */}
          {validationResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResult.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}