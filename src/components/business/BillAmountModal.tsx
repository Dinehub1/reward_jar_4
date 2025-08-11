'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BillAmountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: BillAmountData) => void
  customerCard: {
    id: string
    customer_name?: string
  }
  membershipCard: {
    name: string
    discount_type: string
    discount_value: number
    min_spend_cents?: number
  }
  isLoading?: boolean
}

export interface BillAmountData {
  billAmountCents: number
  billAmountDisplay: number // For display (dollars)
  notes?: string
  deviceId?: string
  terminalId?: string
}

export function BillAmountModal({
  isOpen,
  onClose,
  onConfirm,
  customerCard,
  membershipCard,
  isLoading = false
}: BillAmountModalProps) {
  const [billAmount, setBillAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {}
    
    // Validate bill amount
    const amount = parseFloat(billAmount)
    if (!billAmount || isNaN(amount) || amount <= 0) {
      newErrors.billAmount = 'Please enter a valid bill amount'
    }
    
    const billAmountCents = Math.round(amount * 100)
    
    // Check minimum spend
    if (membershipCard.min_spend_cents && billAmountCents < membershipCard.min_spend_cents) {
      newErrors.billAmount = `Minimum spend of $${(membershipCard.min_spend_cents / 100).toFixed(2)} required`
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    onConfirm({
      billAmountCents,
      billAmountDisplay: amount,
      notes: notes.trim() || undefined,
      deviceId: typeof window !== 'undefined' ? localStorage.getItem('deviceId') || undefined : undefined,
      terminalId: typeof window !== 'undefined' ? localStorage.getItem('terminalId') || undefined : undefined
    })
  }

  const handleClose = () => {
    setBillAmount('')
    setNotes('')
    setErrors({})
    onClose()
  }

  // Calculate discount preview
  const amount = parseFloat(billAmount) || 0
  const discountAmount = membershipCard.discount_type === 'percent'
    ? amount * (membershipCard.discount_value / 100)
    : Math.min(membershipCard.discount_value / 100, amount)
  const finalAmount = Math.max(0, amount - discountAmount)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Apply {membershipCard.discount_type === 'percent' 
              ? `${membershipCard.discount_value}%` 
              : `$${(membershipCard.discount_value / 100).toFixed(2)}`} discount 
            for {membershipCard.name}
            {customerCard.customer_name && ` - ${customerCard.customer_name}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="billAmount">Bill Amount ($)</Label>
            <Input
              id="billAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={billAmount}
              onChange={(e) => {
                setBillAmount(e.target.value)
                if (errors.billAmount) {
                  setErrors(prev => ({ ...prev, billAmount: '' }))
                }
              }}
              className={errors.billAmount ? 'border-red-500' : ''}
            />
            {errors.billAmount && (
              <p className="text-sm text-red-500 mt-1">{errors.billAmount}</p>
            )}
            {membershipCard.min_spend_cents && (
              <p className="text-sm text-gray-500 mt-1">
                Minimum spend: ${(membershipCard.min_spend_cents / 100).toFixed(2)}
              </p>
            )}
          </div>

          {amount > 0 && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Discount Preview</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Discount ({membershipCard.discount_type === 'percent' 
                    ? `${membershipCard.discount_value}%` 
                    : `$${(membershipCard.discount_value / 100).toFixed(2)}`}):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-green-300 pt-1">
                  <span>Final Amount:</span>
                  <span>${finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this transaction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Apply Discount'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}