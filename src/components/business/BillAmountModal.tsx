'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, DollarSign } from 'lucide-react'

interface BillAmountModalProps {
  isOpen: boolean
  onClose: () => void
  customerCardId: string
  onSuccess?: () => void
}

interface Currency {
  symbol: string
  code: string
  name: string
}

const currencies: Currency[] = [
  { symbol: '₩', code: 'KRW', name: 'Korean Won' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '€', code: 'EUR', name: 'Euro' }
]

export default function BillAmountModal({ 
  isOpen, 
  onClose, 
  customerCardId, 
  onSuccess 
}: BillAmountModalProps) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [currency, setCurrency] = useState('KRW')
  const [amountError, setAmountError] = useState('')
  const [notesError, setNotesError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Get selected currency object
  const selectedCurrency = currencies.find(c => c.code === currency) || currencies[0]

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setNotes('')
      setCurrency('KRW')
      setAmountError('')
      setNotesError('')
      setSubmitError('')
    }
  }, [isOpen])

  // Real-time validation
  useEffect(() => {
    validateAmount(amount)
  }, [amount, currency])

  useEffect(() => {
    validateNotes(notes)
  }, [notes])

  const validateAmount = useCallback((value: string) => {
    setAmountError('')
    
    if (!value.trim()) {
      setAmountError('Bill amount is required')
      return false
    }

    const numValue = parseFloat(value.replace(/,/g, ''))
    
    if (isNaN(numValue)) {
      setAmountError('Please enter a valid number')
      return false
    }

    // Convert to KRW for validation (simplified - no actual conversion)
    let minAmount = 1000
    let maxAmount = 1000000
    let currencySymbol = '₩'

    if (currency === 'USD') {
      minAmount = 1
      maxAmount = 1000
      currencySymbol = '$'
    } else if (currency === 'EUR') {
      minAmount = 1
      maxAmount = 1000
      currencySymbol = '€'
    }

    if (numValue < minAmount) {
      setAmountError(`Minimum amount is ${currencySymbol}${minAmount.toLocaleString()}`)
      return false
    }

    if (numValue > maxAmount) {
      setAmountError(`Maximum amount is ${currencySymbol}${maxAmount.toLocaleString()}`)
      return false
    }

    return true
  }, [currency])

  const validateNotes = (value: string) => {
    setNotesError('')
    
    if (value.length > 200) {
      setNotesError(`Notes must be 200 characters or less (${value.length}/200)`)
      return false
    }

    return true
  }

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')
    
    // Ensure only one decimal point
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Format with commas for thousands
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    
    return parts.join('.')
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value)
    setAmount(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAmount(amount) || !validateNotes(notes)) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Parse amount for storage
      const numAmount = parseFloat(amount.replace(/,/g, ''))
      
      // Prepare transaction data
      const transactionData = {
        customer_card_id: customerCardId,
        amount: numAmount,
        currency: currency,
        notes: notes.trim() || null,
        created_at: new Date().toISOString()
      }

      // In a real implementation, this would use MCP /mcp/insert
      // For now, we'll simulate the API call
      console.log('Submitting transaction:', transactionData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // MCP Integration: Use API route for stamp transactions
      const response = await fetch('/api/business/stamp-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        throw new Error('Failed to process stamp transaction')
      }
      
      // if (!response.ok) {
      //   throw new Error('Failed to record transaction')
      // }

      // Success
      onSuccess?.()
      onClose()
      
    } catch (error) {
      console.error('Error submitting transaction:', error)
      setSubmitError('Failed to record transaction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Record Transaction Amount
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Currency Selector */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <span className="flex items-center">
                        <span className="font-medium mr-2">{curr.symbol}</span>
                        {curr.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bill Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Bill Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  {selectedCurrency.symbol}
                </div>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="10,000"
                  className={`pl-8 ${amountError ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {amountError && (
                <p className="text-sm text-red-600">{amountError}</p>
              )}
              <p className="text-xs text-gray-500">
                {currency === 'KRW' && 'Range: ₩1,000 - ₩1,000,000'}
                {currency === 'USD' && 'Range: $1 - $1,000'}
                {currency === 'EUR' && 'Range: €1 - €1,000'}
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-gray-400">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional transaction notes..."
                className={`resize-none ${notesError ? 'border-red-500 focus:border-red-500' : ''}`}
                rows={3}
                maxLength={200}
              />
              <div className="flex justify-between text-xs">
                {notesError ? (
                  <span className="text-red-600">{notesError}</span>
                ) : (
                  <span></span>
                )}
                <span className={`${notes.length > 180 ? 'text-red-500' : 'text-gray-500'}`}>
                  {notes.length}/200
                </span>
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || !!amountError || !!notesError}
              >
                {isSubmitting ? 'Recording...' : 'Record Transaction'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 