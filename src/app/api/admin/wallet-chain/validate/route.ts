/**
 * Card Data Validator API
 * 
 * Validates customer card data against Apple/Google/PWA requirements
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { validateCardData, transformStampCardData, transformMembershipCardData } from '@/lib/wallet/unified-card-data'
import { walletVerificationService } from '@/lib/wallet/wallet-verification'
import type { ApiResponse } from '@/lib/supabase/types'

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

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🔍 CARD VALIDATOR: Starting validation request...')

  try {
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Admin role verification
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      } as ApiResponse<never>, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { cardId, customerId } = body

    if (!cardId) {
      return NextResponse.json({
        success: false,
        error: 'Card ID is required'
      } as ApiResponse<never>, { status: 400 })
    }

    // Fetch and validate card data
    const validationResult = await validateCustomerCard(cardId, customerId, adminClient)

    console.log(`✅ CARD VALIDATOR: Completed validation for card ${cardId} in ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      data: validationResult,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('💥 CARD VALIDATOR: Critical error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Validate customer card data against all platform requirements
 */
async function validateCustomerCard(cardId: string, customerId?: string, adminClient: any): Promise<ValidationResult> {
  // First, determine card type by trying to fetch from both tables
  let cardData: any = null
  let cardType: 'stamp' | 'membership' = 'stamp'
  let unifiedData: any = null

  try {
    // Try stamp card first
    const { data: stampCard, error: stampError } = await adminClient
      .from('stamp_cards')
      .select(`
        *,
        businesses!inner(*)
      `)
      .eq('id', cardId)
      .single()

    if (!stampError && stampCard) {
      cardData = stampCard
      cardType = 'stamp'

      // Get customer data if provided
      let customerData = null
      if (customerId) {
        const { data: customer, error: customerError } = await adminClient
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

      unifiedData = transformStampCardData(cardData, customerData)
    } else {
      // Try membership card
      const { data: membershipCard, error: memberError } = await adminClient
        .from('membership_cards')
        .select(`
          *,
          businesses!inner(*)
        `)
        .eq('id', cardId)
        .single()

      if (!memberError && membershipCard) {
        cardData = membershipCard
        cardType = 'membership'

        // Get customer data if provided
        let customerData = null
        if (customerId) {
          const { data: customer, error: customerError } = await adminClient
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

        unifiedData = transformMembershipCardData(cardData, customerData)
      } else {
        throw new Error(`Card not found: ${cardId}`)
      }
    }

    // Validate unified data
    const dataValidation = validateCardData(unifiedData)
    
    // Run platform-specific validations
    const [appleValidation, googleValidation, pwaValidation] = await Promise.all([
      validateAppleWalletRequirements(unifiedData),
      validateGoogleWalletRequirements(unifiedData),
      validatePWARequirements(unifiedData)
    ])

    // Determine overall status
    const hasErrors = !dataValidation.valid || 
                     !appleValidation.valid || 
                     !googleValidation.valid || 
                     !pwaValidation.valid

    const hasWarnings = appleValidation.warnings.length > 0 ||
                       googleValidation.warnings.length > 0 ||
                       pwaValidation.warnings.length > 0

    const overall = hasErrors ? 'invalid' : (hasWarnings ? 'warnings' : 'valid')

    // Generate recommendations
    const recommendations = generateRecommendations(unifiedData, dataValidation, appleValidation, googleValidation, pwaValidation)

    return {
      cardId,
      customerId,
      cardType,
      overall,
      unifiedData,
      validations: {
        dataIntegrity: {
          valid: dataValidation.valid,
          errors: dataValidation.errors,
          warnings: []
        },
        appleWallet: appleValidation,
        googleWallet: googleValidation,
        pwa: pwaValidation
      },
      recommendations,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    return {
      cardId,
      customerId,
      cardType: 'stamp',
      overall: 'invalid',
      validations: {
        dataIntegrity: {
          valid: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        },
        appleWallet: createFailedValidation(),
        googleWallet: createFailedValidation(),
        pwa: createFailedValidation()
      },
      recommendations: ['Fix data integrity issues before proceeding'],
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Validate Apple Wallet specific requirements
 */
async function validateAppleWalletRequirements(unifiedData: any) {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { generateAppleWalletPass } = await import('@/lib/wallet/unified-card-data')
    const passData = generateAppleWalletPass(unifiedData)

    // Check required fields
    const requirements = {
      formatVersion: !!passData.formatVersion,
      passTypeIdentifier: !!passData.passTypeIdentifier,
      serialNumber: !!passData.serialNumber,
      organizationName: !!passData.organizationName,
      description: !!passData.description,
      barcodes: !!(passData.barcodes && passData.barcodes.length > 0)
    }

    // Validate required fields
    Object.entries(requirements).forEach(([field, valid]) => {
      if (!valid) {
        errors.push(`Missing required Apple Wallet field: ${field}`)
      }
    })

    // Check for specific Apple requirements
    if (passData.organizationName && passData.organizationName.length > 64) {
      warnings.push('Organization name should be 64 characters or less for optimal display')
    }

    if (passData.description && passData.description.length > 90) {
      warnings.push('Description should be 90 characters or less for optimal display')
    }

    // Check barcode format
    if (passData.barcodes && passData.barcodes.length > 0) {
      const barcode = passData.barcodes[0]
      if (barcode.format !== 'PKBarcodeFormatQR') {
        warnings.push('QR code format is recommended for best compatibility')
      }
      if (!barcode.message || barcode.message.length < 1) {
        errors.push('Barcode message cannot be empty')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requirements
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Apple Wallet validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      requirements: {
        formatVersion: false,
        passTypeIdentifier: false,
        serialNumber: false,
        organizationName: false,
        description: false,
        barcodes: false
      }
    }
  }
}

/**
 * Validate Google Wallet specific requirements
 */
async function validateGoogleWalletRequirements(unifiedData: any) {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { generateGoogleWalletObject } = await import('@/lib/wallet/unified-card-data')
    const objectData = generateGoogleWalletObject(unifiedData)

    // Check required fields
    const requirements = {
      classId: !!objectData.classId,
      objectId: !!objectData.id,
      state: !!objectData.state,
      barcode: !!(objectData.barcode && objectData.barcode.value),
      textModules: !!(objectData.textModulesData && objectData.textModulesData.length > 0)
    }

    // Validate required fields
    Object.entries(requirements).forEach(([field, valid]) => {
      if (!valid) {
        errors.push(`Missing required Google Wallet field: ${field}`)
      }
    })

    // Check state validity
    if (objectData.state && !['ACTIVE', 'COMPLETED', 'EXPIRED', 'INACTIVE'].includes(objectData.state)) {
      errors.push('Invalid state value for Google Wallet')
    }

    // Check barcode format
    if (objectData.barcode) {
      if (!['QR_CODE', 'UPC_A', 'UPC_E', 'EAN_8', 'EAN_13', 'CODE_39', 'CODE_128', 'ITF_14', 'PDF_417', 'AZTEC', 'DATA_MATRIX'].includes(objectData.barcode.type)) {
        errors.push('Invalid barcode type for Google Wallet')
      }
    }

    // Check text modules
    if (objectData.textModulesData) {
      objectData.textModulesData.forEach((module: any, index: number) => {
        if (!module.header || !module.body) {
          warnings.push(`Text module ${index + 1} missing header or body`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requirements
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`Google Wallet validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      requirements: {
        classId: false,
        objectId: false,
        state: false,
        barcode: false,
        textModules: false
      }
    }
  }
}

/**
 * Validate PWA specific requirements
 */
async function validatePWARequirements(unifiedData: any) {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const { generatePWACardData } = await import('@/lib/wallet/unified-card-data')
    const pwaData = generatePWACardData(unifiedData)

    // Check required fields
    const requirements = {
      title: !!pwaData.title,
      subtitle: !!pwaData.subtitle,
      barcode: !!(pwaData.barcode && pwaData.barcode.value),
      theme: !!(pwaData.theme && pwaData.theme.backgroundColor),
      actions: !!(pwaData.actions && pwaData.actions.length > 0)
    }

    // Validate required fields
    Object.entries(requirements).forEach(([field, valid]) => {
      if (!valid) {
        errors.push(`Missing required PWA field: ${field}`)
      }
    })

    // Check theme colors
    if (pwaData.theme) {
      if (pwaData.theme.backgroundColor && !isValidColor(pwaData.theme.backgroundColor)) {
        warnings.push('Invalid background color format in theme')
      }
      if (pwaData.theme.foregroundColor && !isValidColor(pwaData.theme.foregroundColor)) {
        warnings.push('Invalid foreground color format in theme')
      }
    }

    // Check actions
    if (pwaData.actions) {
      pwaData.actions.forEach((action: any, index: number) => {
        if (!action.id || !action.label) {
          warnings.push(`Action ${index + 1} missing id or label`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requirements
    }
  } catch (error) {
    return {
      valid: false,
      errors: [`PWA validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      requirements: {
        title: false,
        subtitle: false,
        barcode: false,
        theme: false,
        actions: false
      }
    }
  }
}

/**
 * Generate recommendations based on validation results
 */
function generateRecommendations(unifiedData: any, dataValidation: any, appleValidation: any, googleValidation: any, pwaValidation: any): string[] {
  const recommendations: string[] = []

  // Data integrity recommendations
  if (!dataValidation.valid) {
    recommendations.push('Fix data integrity issues: ' + dataValidation.errors.join(', '))
  }

  // Apple Wallet recommendations
  if (!appleValidation.valid) {
    recommendations.push('Apple Wallet: ' + appleValidation.errors[0])
  }
  if (appleValidation.warnings.length > 0) {
    recommendations.push('Apple Wallet optimization: ' + appleValidation.warnings[0])
  }

  // Google Wallet recommendations
  if (!googleValidation.valid) {
    recommendations.push('Google Wallet: ' + googleValidation.errors[0])
  }

  // PWA recommendations
  if (!pwaValidation.valid) {
    recommendations.push('PWA: ' + pwaValidation.errors[0])
  }

  // General recommendations
  if (unifiedData.business && !unifiedData.business.logoUrl) {
    recommendations.push('Add business logo for better wallet appearance')
  }

  if (unifiedData.card && unifiedData.card.description && unifiedData.card.description.length < 10) {
    recommendations.push('Consider adding a more detailed card description')
  }

  return recommendations.slice(0, 5) // Limit to top 5 recommendations
}

/**
 * Create a failed validation result
 */
function createFailedValidation() {
  return {
    valid: false,
    errors: ['Validation could not be performed'],
    warnings: [],
    requirements: {
      formatVersion: false,
      passTypeIdentifier: false,
      serialNumber: false,
      organizationName: false,
      description: false,
      barcodes: false
    }
  }
}

/**
 * Check if a color value is valid (CSS color format)
 */
function isValidColor(color: string): boolean {
  // Simple validation for common color formats
  const colorRegex = /^(#[0-9A-Fa-f]{3,6}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\))$/
  return colorRegex.test(color) || ['transparent', 'inherit', 'initial', 'unset'].includes(color)
}