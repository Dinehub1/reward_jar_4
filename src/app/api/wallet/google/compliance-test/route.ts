/**
 * Google Wallet Compliance Test Endpoint
 * Comprehensive testing for production readiness
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleWalletCompliance } from '@/lib/wallet/google/compliance'
import { EnhancedGoogleWalletBuilder } from '@/lib/wallet/google/enhanced-builder'
import { GoogleWalletAnalytics } from '@/lib/wallet/google/analytics'

interface ComplianceTestResult {
  testName: string
  status: 'pass' | 'fail' | 'warning' | 'skipped'
  message: string
  duration: number
  details?: any
  error?: string
}

interface ComplianceTestSuite {
  timestamp: string
  environment: string
  overallStatus: 'pass' | 'fail' | 'warning'
  passedTests: number
  failedTests: number
  warningTests: number
  skippedTests: number
  totalTests: number
  executionTime: number
  tests: ComplianceTestResult[]
  recommendations: string[]
  config: {
    hasServiceAccount: boolean
    hasPrivateKey: boolean
    hasIssuerId: boolean
    environment: string
    httpsEnabled: boolean
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const tests: ComplianceTestResult[] = []
  const recommendations: string[] = []

  try {
    // Test 1: Environment Configuration
    await runTest(tests, 'Environment Configuration', async () => {
      const hasServiceAccount = !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
      const hasPrivateKey = !!process.env.GOOGLE_WALLET_PRIVATE_KEY
      const hasIssuerId = !!process.env.GOOGLE_WALLET_ISSUER_ID

      if (!hasServiceAccount || !hasPrivateKey || !hasIssuerId) {
        throw new Error(`Missing environment variables: ${[
          !hasServiceAccount && 'GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL',
          !hasPrivateKey && 'GOOGLE_WALLET_PRIVATE_KEY',
          !hasIssuerId && 'GOOGLE_WALLET_ISSUER_ID'
        ].filter(Boolean).join(', ')}`)
      }

      return {
        hasServiceAccount,
        hasPrivateKey,
        hasIssuerId,
        message: 'All required environment variables are configured'
      }
    })

    // Test 2: Google Wallet Compliance Initialization
    let compliance: GoogleWalletCompliance | null = null
    await runTest(tests, 'Compliance Module Initialization', async () => {
      compliance = new GoogleWalletCompliance({})
      return {
        message: 'Google Wallet Compliance module initialized successfully',
        config: compliance.getConfigSummary()
      }
    })

    // Test 3: Production Readiness Validation
    await runTest(tests, 'Production Readiness Validation', async () => {
      if (!compliance) throw new Error('Compliance module not initialized')
      
      const readiness = compliance.validateProductionReadiness()
      
      if (!readiness.isReady) {
        const message = `Production readiness issues: ${readiness.issues.join(', ')}`
        recommendations.push(...readiness.issues.map(issue => `Fix: ${issue}`))
        throw new Error(message)
      }

      return {
        message: 'System is production ready',
        details: readiness
      }
    })

    // Test 4: JWT Creation and Signing
    await runTest(tests, 'JWT Creation and Signing', async () => {
      if (!compliance) throw new Error('Compliance module not initialized')

      const testObjects = [{
        id: 'test_object_id',
        classId: 'test_class_id',
        state: 'ACTIVE' as const,
        accountId: 'test_account',
        accountName: 'Test User',
        loyaltyPoints: {
          label: 'Test Points',
          balance: { string: '0/10' }
        }
      }]

      const jwt = compliance.createSaveToWalletJWT(testObjects)
      
      // Validate JWT format
      const jwtParts = jwt.split('.')
      if (jwtParts.length !== 3) {
        throw new Error('Invalid JWT format - must have 3 parts')
      }

      // Decode and validate header
      const header = JSON.parse(Buffer.from(jwtParts[0], 'base64url').toString())
      if (header.alg !== 'RS256' || header.typ !== 'JWT') {
        throw new Error('Invalid JWT header - must use RS256 algorithm')
      }

      // Decode and validate payload
      const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString())
      if (!payload.iss || !payload.aud || payload.typ !== 'savetowallet') {
        throw new Error('Invalid JWT payload structure')
      }

      return {
        message: 'JWT creation and signing successful',
        jwtLength: jwt.length,
        header,
        payloadKeys: Object.keys(payload)
      }
    })

    // Test 5: Enhanced Builder Initialization
    let builder: EnhancedGoogleWalletBuilder | null = null
    await runTest(tests, 'Enhanced Builder Initialization', async () => {
      builder = new EnhancedGoogleWalletBuilder()
      
      const healthStatus = await builder.getHealthStatus()
      
      if (healthStatus.status === 'unhealthy') {
        throw new Error(`Builder health check failed: ${JSON.stringify(healthStatus.details)}`)
      }

      return {
        message: 'Enhanced Google Wallet Builder initialized successfully',
        healthStatus: healthStatus.status,
        details: healthStatus.details
      }
    })

    // Test 6: Class and Object ID Generation
    await runTest(tests, 'Class and Object ID Generation', async () => {
      if (!compliance) throw new Error('Compliance module not initialized')

      const classId = compliance.generateClassId('test_loyalty_class_v1', 'loyalty')
      const objectId = compliance.generateObjectId(classId, 'test-customer-card-123')

      // Validate format
      if (!classId.includes('.')) {
        throw new Error('Invalid class ID format - must include issuer ID and suffix')
      }

      if (!objectId.includes(classId)) {
        throw new Error('Invalid object ID format - must include class ID')
      }

      return {
        message: 'ID generation successful',
        classId,
        objectId,
        classIdParts: classId.split('.'),
        objectIdParts: objectId.split('.')
      }
    })

    // Test 7: Save URL Generation
    await runTest(tests, 'Save URL Generation', async () => {
      if (!compliance) throw new Error('Compliance module not initialized')

      const testJWT = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test.signature'
      const saveUrl = compliance.generateSaveUrl(testJWT)
      
      const expectedPrefix = 'https://pay.google.com/gp/v/save/'
      
      if (!saveUrl.startsWith(expectedPrefix)) {
        throw new Error(`Invalid save URL format - must start with ${expectedPrefix}`)
      }

      return {
        message: 'Save URL generation successful',
        saveUrl,
        jwtExtracted: saveUrl.replace(expectedPrefix, '')
      }
    })

    // Test 8: Analytics Compliance Report
    await runTest(tests, 'Analytics Compliance Report', async () => {
      const report = await GoogleWalletAnalytics.generateComplianceReport()
      
      const failedChecks = report.checks.filter(check => check.status === 'fail')
      
      if (failedChecks.length > 0) {
        recommendations.push(...report.recommendations)
        throw new Error(`Compliance report failed: ${failedChecks.map(c => c.message).join(', ')}`)
      }

      return {
        message: 'Analytics compliance report passed',
        status: report.status,
        checks: report.checks.length,
        recommendations: report.recommendations.length
      }
    })

    // Test 9: HTTPS Validation (Production)
    await runTest(tests, 'HTTPS Validation', async () => {
      const isProduction = process.env.NODE_ENV === 'production'
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      
      if (isProduction && baseUrl && !baseUrl.startsWith('https://')) {
        throw new Error('HTTPS is required for Google Wallet in production')
      }

      if (!baseUrl) {
        return {
          message: 'HTTPS validation skipped - no base URL configured',
          status: 'skipped'
        }
      }

      return {
        message: isProduction 
          ? 'HTTPS properly configured for production'
          : 'HTTPS validation passed for development',
        baseUrl,
        isProduction,
        isHttps: baseUrl.startsWith('https://')
      }
    })

    // Test 10: Integration Test (if not in production)
    if (process.env.NODE_ENV !== 'production') {
      await runTest(tests, 'Integration Test', async () => {
        if (!builder) throw new Error('Builder not initialized')

        // Create mock pass data
        const mockPassData = {
          customerCard: {
            id: 'test-card-123',
            stamp_card_id: 'test-stamp-card',
            membership_card_id: null,
            current_stamps: 3,
            sessions_used: 0,
            expiry_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            wallet_type: 'google',
            stamp_card: {
              id: 'test-stamp-card',
              card_name: 'Test Loyalty Card',
              card_color: '#2563eb',
              icon_emoji: '☕',
              total_stamps: 10,
              stamps_required: 10,
              reward: 'Free Coffee',
              reward_description: 'Get a free coffee after 10 stamps',
              barcode_type: 'QR_CODE' as const,
              card_expiry_days: 365,
              reward_expiry_days: 30,
              how_to_earn_stamp: 'Purchase any item',
              earned_stamp_message: 'Stamp earned!',
              earned_reward_message: 'Reward unlocked!',
              business_id: 'test-business'
            },
            customer: {
              id: 'test-customer',
              name: 'Test Customer',
              email: 'test@example.com',
              phone: '+1234567890'
            }
          },
          business: {
            id: 'test-business',
            name: 'Test Coffee Shop',
            description: 'Best coffee in town',
            contact_email: 'info@testcoffee.com',
            owner_id: 'test-owner',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile_progress: 100,
            location: '123 Test St',
            website_url: 'https://testcoffee.com',
            logo_url: null,
            contact_number: '+1234567890',
            store_numbers: null,
            is_flagged: false,
            admin_notes: null,
            card_requested: false,
            latitude: 37.7749,
            longitude: -122.4194,
            place_id: 'test-place-id',
            formatted_address: '123 Test St, San Francisco, CA',
            currency_code: 'USD',
            locale: 'en-US'
          },
          cardType: 'stamp' as const
        }

        // Build loyalty class and object
        const loyaltyClass = builder.buildLoyaltyClass(mockPassData)
        const loyaltyObject = builder.buildLoyaltyObject(mockPassData)

        // Validate structure
        if (!loyaltyClass.id || !loyaltyClass.issuerName || !loyaltyClass.programName) {
          throw new Error('Invalid loyalty class structure')
        }

        if (!loyaltyObject.id || !loyaltyObject.classId || !loyaltyObject.accountName) {
          throw new Error('Invalid loyalty object structure')
        }

        return {
          message: 'Integration test passed - mock pass data processed successfully',
          classId: loyaltyClass.id,
          objectId: loyaltyObject.id,
          classFields: Object.keys(loyaltyClass).length,
          objectFields: Object.keys(loyaltyObject).length
        }
      })
    }

    // Calculate results
    const executionTime = Date.now() - startTime
    const passedTests = tests.filter(t => t.status === 'pass').length
    const failedTests = tests.filter(t => t.status === 'fail').length
    const warningTests = tests.filter(t => t.status === 'warning').length
    const skippedTests = tests.filter(t => t.status === 'skipped').length
    
    const overallStatus: 'pass' | 'fail' | 'warning' = 
      failedTests > 0 ? 'fail' : 
      warningTests > 0 ? 'warning' : 'pass'

    const result: ComplianceTestSuite = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      overallStatus,
      passedTests,
      failedTests,
      warningTests,
      skippedTests,
      totalTests: tests.length,
      executionTime,
      tests,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      config: {
        hasServiceAccount: !!process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_WALLET_PRIVATE_KEY,
        hasIssuerId: !!process.env.GOOGLE_WALLET_ISSUER_ID,
        environment: process.env.NODE_ENV || 'development',
        httpsEnabled: !!(process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://'))
      }
    }

    return NextResponse.json(result, {
      status: overallStatus === 'fail' ? 500 : 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Test-Status': overallStatus,
        'X-Test-Count': tests.length.toString(),
        'X-Execution-Time': executionTime.toString()
      }
    })

  } catch (error) {
    console.error('Google Wallet compliance test error:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      overallStatus: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
      tests,
      recommendations
    }, { status: 500 })
  }
}

async function runTest(
  tests: ComplianceTestResult[],
  testName: string,
  testFunction: () => Promise<any>
): Promise<void> {
  const startTime = Date.now()
  
  try {
    const result = await testFunction()
    
    tests.push({
      testName,
      status: result?.status === 'skipped' ? 'skipped' : 'pass',
      message: result?.message || 'Test passed',
      duration: Date.now() - startTime,
      details: result
    })
  } catch (error) {
    tests.push({
      testName,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Test failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}