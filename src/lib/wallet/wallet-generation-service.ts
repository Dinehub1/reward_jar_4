/**
 * Wallet Generation Service for RewardJar 4.0
 * 
 * Handles reliable generation of wallet passes with queue processing,
 * error handling, and automated verification.
 */

import { createAdminClient } from '@/lib/supabase/admin-client'
import { 
  UnifiedCardData, 
  generateAppleWalletPass, 
  generateGoogleWalletObject, 
  generatePWACardData,
  validateCardData 
} from './unified-card-data'
import { createPkpass } from '../../tools/wallet-validation/generate_apple_pass'
import { createWalletJWT } from '../../tools/wallet-validation/generate_google_jwt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export interface WalletGenerationRequest {
  id: string
  cardId: string
  customerId?: string
  types: ('apple' | 'google' | 'pwa')[]
  priority: 'high' | 'normal' | 'low'
  metadata?: Record<string, any>
  createdAt: string
}

export interface WalletGenerationResult {
  requestId: string
  success: boolean
  results: {
    apple?: {
      success: boolean
      pkpassUrl?: string
      error?: string
    }
    google?: {
      success: boolean
      jwt?: string
      saveUrl?: string
      error?: string
    }
    pwa?: {
      success: boolean
      cardData?: any
      error?: string
    }
  }
  unifiedData: UnifiedCardData
  generatedAt: string
  processingTime: number
}

export interface WalletGenerationQueue {
  pending: WalletGenerationRequest[]
  processing: WalletGenerationRequest[]
  completed: WalletGenerationResult[]
  failed: { request: WalletGenerationRequest; error: string; failedAt: string }[]
}

class WalletGenerationService {
  private queue: WalletGenerationQueue = {
    pending: [],
    processing: [],
    completed: [],
    failed: []
  }
  
  private isProcessing = false
  private readonly maxConcurrent = 3
  private readonly retryAttempts = 3
  private readonly retryDelay = 1000 // ms

  /**
   * Add a wallet generation request to the queue
   */
  async enqueueGeneration(request: Omit<WalletGenerationRequest, 'id' | 'createdAt'>): Promise<string> {
    const fullRequest: WalletGenerationRequest = {
      ...request,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
    
    this.queue.pending.push(fullRequest)
    console.log(`📥 WALLET QUEUE: Added request ${fullRequest.id} for card ${fullRequest.cardId}`)
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue()
    }
    
    return fullRequest.id
  }

  /**
   * Process the wallet generation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    
    this.isProcessing = true
    console.log('🔄 WALLET QUEUE: Starting queue processing...')
    
    try {
      while (this.queue.pending.length > 0 && this.queue.processing.length < this.maxConcurrent) {
        const request = this.queue.pending.shift()!
        this.queue.processing.push(request)
        
        // Process request asynchronously
        this.processRequest(request).catch(error => {
          console.error(`❌ WALLET QUEUE: Failed to process request ${request.id}:`, error)
          this.moveToFailed(request, error.message)
        })
      }
      
      // Continue processing if there are still pending requests
      if (this.queue.pending.length > 0) {
        setTimeout(() => this.processQueue(), 1000)
      } else {
        this.isProcessing = false
        console.log('✅ WALLET QUEUE: Processing complete')
      }
    } catch (error) {
      console.error('💥 WALLET QUEUE: Critical error in queue processing:', error)
      this.isProcessing = false
    }
  }

  /**
   * Process a single wallet generation request
   */
  private async processRequest(request: WalletGenerationRequest): Promise<void> {
    const startTime = Date.now()
    console.log(`🎫 WALLET GENERATION: Processing request ${request.id}`)
    
    try {
      // Fetch card data from Supabase
      const unifiedData = await this.fetchCardData(request.cardId, request.customerId)
      
      // Validate the data
      const validation = validateCardData(unifiedData)
      if (!validation.valid) {
        throw new Error(`Invalid card data: ${validation.errors.join(', ')}`)
      }
      
      // Generate requested wallet types
      const results: WalletGenerationResult['results'] = {}
      
      if (request.types.includes('apple')) {
        results.apple = await this.generateAppleWallet(unifiedData)
      }
      
      if (request.types.includes('google')) {
        results.google = await this.generateGoogleWallet(unifiedData)
      }
      
      if (request.types.includes('pwa')) {
        results.pwa = await this.generatePWAWallet(unifiedData)
      }
      
      // Create result
      const result: WalletGenerationResult = {
        requestId: request.id,
        success: Object.values(results).every(r => r.success),
        results,
        unifiedData,
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
      
      // Move to completed
      this.moveToCompleted(request, result)
      
      console.log(`✅ WALLET GENERATION: Completed request ${request.id} in ${result.processingTime}ms`)
      
    } catch (error) {
      console.error(`❌ WALLET GENERATION: Failed request ${request.id}:`, error)
      this.moveToFailed(request, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Fetch card data from Supabase and transform to unified format
   */
  private async fetchCardData(cardId: string, customerId?: string): Promise<UnifiedCardData> {
    const supabase = createAdminClient()
    
    // Try to fetch as stamp card first
    const { data: stampCard, error: stampError } = await supabase
      .from('stamp_cards')
      .select(`
        *,
        businesses!inner(*)
      `)
      .eq('id', cardId)
      .single()
    
    if (!stampError && stampCard) {
      // Fetch customer data if provided
      let customerData = null
      if (customerId) {
        const { data: customer, error: customerError } = await supabase
          .from('customer_cards')
          .select(`
            current_stamps,
            customers!inner(*)
          `)
          .eq('stamp_card_id', cardId)
          .eq('customer_id', customerId)
          .single()
        
        if (!customerError && customer) {
          customerData = {
            ...customer.customers,
            current_stamps: customer.current_stamps
          }
        }
      }
      
      const { transformStampCardData } = await import('./unified-card-data')
      return transformStampCardData(stampCard, customerData)
    }
    
    // Try to fetch as membership card
    const { data: membershipCard, error: memberError } = await supabase
      .from('membership_cards')
      .select(`
        *,
        businesses!inner(*)
      `)
      .eq('id', cardId)
      .single()
    
    if (!memberError && membershipCard) {
      // Fetch customer data if provided
      let customerData = null
      if (customerId) {
        const { data: customer, error: customerError } = await supabase
          .from('customer_cards')
          .select(`
            sessions_used,
            expiry_date,
            customers!inner(*)
          `)
          .eq('membership_card_id', cardId)
          .eq('customer_id', customerId)
          .single()
        
        if (!customerError && customer) {
          customerData = {
            ...customer.customers,
            sessions_used: customer.sessions_used,
            expiry_date: customer.expiry_date
          }
        }
      }
      
      const { transformMembershipCardData } = await import('./unified-card-data')
      return transformMembershipCardData(membershipCard, customerData)
    }
    
    throw new Error(`Card not found: ${cardId}`)
  }

  /**
   * Generate Apple Wallet pass
   */
  private async generateAppleWallet(cardData: UnifiedCardData): Promise<{ success: boolean; pkpassUrl?: string; error?: string }> {
    try {
      const passData = generateAppleWalletPass(cardData)
      
      // Generate .pkpass file
      const fileName = `${cardData.serialNumber}.pkpass`
      const outputPath = `/tmp/${fileName}`
      
      // Use the existing createPkpass function from our tools
      await createPkpass(passData, outputPath)
      
      // In production, upload to S3 or similar storage
      const pkpassUrl = `${process.env.WALLET_STORAGE_URL || '/api/wallet/download'}/${fileName}`
      
      return {
        success: true,
        pkpassUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate Google Wallet JWT
   */
  private async generateGoogleWallet(cardData: UnifiedCardData): Promise<{ success: boolean; jwt?: string; saveUrl?: string; error?: string }> {
    try {
      const objectData = generateGoogleWalletObject(cardData)
      
      // Load service account credentials
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
      if (!serviceAccountJson) {
        throw new Error('Google service account credentials not configured')
      }
      
      const credentials = JSON.parse(serviceAccountJson)
      
      // Create JWT payload
      const payload = cardData.type === 'stamp' 
        ? { loyaltyObjects: [objectData] }
        : { genericObjects: [objectData] }
      
      // Use the existing createWalletJWT function
      const jwtToken = createWalletJWT(payload, credentials)
      const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`
      
      return {
        success: true,
        jwt: jwtToken,
        saveUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate PWA card data
   */
  private async generatePWAWallet(cardData: UnifiedCardData): Promise<{ success: boolean; cardData?: any; error?: string }> {
    try {
      const pwaData = generatePWACardData(cardData)
      
      // Store PWA card data in database for retrieval
      const supabase = createAdminClient()
      const { error } = await supabase
        .from('pwa_cards')
        .upsert({
          id: cardData.id,
          serial_number: cardData.serialNumber,
          card_data: pwaData,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        throw error
      }
      
      return {
        success: true,
        cardData: pwaData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Move request from processing to completed
   */
  private moveToCompleted(request: WalletGenerationRequest, result: WalletGenerationResult): void {
    this.queue.processing = this.queue.processing.filter(r => r.id !== request.id)
    this.queue.completed.push(result)
    
    // Keep only last 100 completed requests
    if (this.queue.completed.length > 100) {
      this.queue.completed = this.queue.completed.slice(-100)
    }
  }

  /**
   * Move request from processing to failed
   */
  private moveToFailed(request: WalletGenerationRequest, error: string): void {
    this.queue.processing = this.queue.processing.filter(r => r.id !== request.id)
    this.queue.failed.push({
      request,
      error,
      failedAt: new Date().toISOString()
    })
    
    // Keep only last 50 failed requests
    if (this.queue.failed.length > 50) {
      this.queue.failed = this.queue.failed.slice(-50)
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): WalletGenerationQueue {
    return {
      pending: [...this.queue.pending],
      processing: [...this.queue.processing],
      completed: [...this.queue.completed],
      failed: [...this.queue.failed]
    }
  }

  /**
   * Get result by request ID
   */
  getResult(requestId: string): WalletGenerationResult | null {
    return this.queue.completed.find(r => r.requestId === requestId) || null
  }

  /**
   * Clear completed and failed queues
   */
  clearHistory(): void {
    this.queue.completed = []
    this.queue.failed = []
    console.log('🧹 WALLET QUEUE: History cleared')
  }
}

// Export singleton instance
export const walletGenerationService = new WalletGenerationService()

// Feature flag control
export function isWalletGenerationEnabled(): boolean {
  return process.env.ENABLE_WALLET_GENERATION !== 'false'
}

// Export types
export type { UnifiedCardData } from './unified-card-data'