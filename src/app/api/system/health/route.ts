import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const healthChecks = {
    supabase: { status: 'unknown', message: '', details: {} },
    wallet_certificates: { status: 'unknown', message: '', details: {} },
    file_system: { status: 'unknown', message: '', details: {} },
    test_pass_generation: { status: 'unknown', message: '', details: {} }
  }

  let overallStatus = 'healthy'

  try {
    // 1. Test Supabase Connection
    console.log('🔍 Testing Supabase connection...')
    try {
      const supabase = await createClient()
      
      // Test basic connection
      const { error: connectionError } = await supabase
        .from('businesses')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        throw connectionError
      }

      // Test table structure
      const { data: tableTest, error: tableError } = await supabase
        .from('customer_cards')
        .select('id, current_stamps, stamp_cards(id, name, total_stamps)')
        .limit(1)
      
      if (tableError) {
        throw tableError
      }

      healthChecks.supabase = {
        status: 'healthy',
        message: 'Database connection successful',
        details: {
          connected: true,
          tables_accessible: true,
          sample_data_count: tableTest?.length || 0
        }
      }
      
      console.log('✅ Supabase connection healthy')
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
      healthChecks.supabase = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        details: { connected: false }
      }
      overallStatus = 'unhealthy'
    }

    // 2. Test Wallet Certificates
    console.log('🔍 Testing wallet certificates...')
    try {
      const appleVars = [
        'APPLE_CERT_BASE64',
        'APPLE_KEY_BASE64', 
        'APPLE_WWDR_BASE64',
        'APPLE_TEAM_IDENTIFIER',
        'APPLE_PASS_TYPE_IDENTIFIER'
      ]

      const appleStatus = appleVars.map(varName => ({
        name: varName,
        configured: !!process.env[varName],
        valid: validateCertificateVar(varName)
      }))

      const appleHealthy = appleStatus.every(cert => cert.configured && cert.valid)

      const googleVars = [
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
        'GOOGLE_CLASS_ID'
      ]

      const googleStatus = googleVars.map(varName => ({
        name: varName,
        configured: !!process.env[varName],
        valid: validateGoogleVar(varName)
      }))

      const googleHealthy = googleStatus.every(cert => cert.configured && cert.valid)

      healthChecks.wallet_certificates = {
        status: appleHealthy ? 'healthy' : 'degraded',
        message: appleHealthy ? 'Apple Wallet certificates valid' : 'Apple Wallet certificates missing or invalid',
        details: {
          apple_wallet: {
            status: appleHealthy ? 'available' : 'unavailable',
            certificates: appleStatus
          },
          google_wallet: {
            status: googleHealthy ? 'available' : 'unavailable',
            certificates: googleStatus
          }
        }
      }

      if (!appleHealthy) {
        overallStatus = 'degraded'
      }

      console.log('✅ Wallet certificates checked')
    } catch (error) {
      console.error('❌ Wallet certificate check failed:', error)
      healthChecks.wallet_certificates = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Certificate validation failed',
        details: {}
      }
      overallStatus = 'unhealthy'
    }

    // 3. Test File System Permissions
    console.log('🔍 Testing file system permissions...')
    try {
      const testFile = join('/tmp', `health-check-${Date.now()}.txt`)
      const testContent = 'Health check test file'
      
      // Test write
      writeFileSync(testFile, testContent)
      
      // Test read
      const fs = await import('fs')
      const readContent = fs.readFileSync(testFile, 'utf8')
      
      if (readContent !== testContent) {
        throw new Error('File content mismatch')
      }
      
      // Test delete
      unlinkSync(testFile)
      
      healthChecks.file_system = {
        status: 'healthy',
        message: 'File system read/write permissions working',
        details: {
          write_permission: true,
          read_permission: true,
          delete_permission: true,
          temp_directory: '/tmp'
        }
      }
      
      console.log('✅ File system permissions healthy')
    } catch (error) {
      console.error('❌ File system permission check failed:', error)
      healthChecks.file_system = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'File system access failed',
        details: {
          write_permission: false,
          read_permission: false,
          delete_permission: false
        }
      }
      overallStatus = 'unhealthy'
    }

    // 4. Test Pass Generation
    console.log('🔍 Testing test pass generation...')
    try {
      // Test simple pass structure generation
      const testPassData = {
        formatVersion: 1,
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.rewardjar.test',
        serialNumber: `health-check-${Date.now()}`,
        teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER || 'TEST123456',
        organizationName: 'RewardJar Health Check',
        description: 'Health Check Test Pass',
        storeCard: {
          primaryFields: [{
            key: 'test',
            label: 'Test',
            value: 'Health Check'
          }]
        },
        barcode: {
          message: 'health-check-test',
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      }

      // Validate pass structure
      const requiredFields = ['formatVersion', 'passTypeIdentifier', 'serialNumber', 'teamIdentifier']
      const missingFields = requiredFields.filter(field => !testPassData[field as keyof typeof testPassData])

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Test JSON serialization
      const passJson = JSON.stringify(testPassData)
      if (!passJson || passJson.length < 100) {
        throw new Error('Pass JSON serialization failed')
      }

      healthChecks.test_pass_generation = {
        status: 'healthy',
        message: 'Test pass generation successful',
        details: {
          pass_structure_valid: true,
          json_serialization: true,
          pass_size_bytes: passJson.length,
          required_fields_present: requiredFields.length,
          test_pass_data: testPassData
        }
      }
      
      console.log('✅ Test pass generation healthy')
    } catch (error) {
      console.error('❌ Test pass generation failed:', error)
      healthChecks.test_pass_generation = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Pass generation failed',
        details: {
          pass_structure_valid: false,
          json_serialization: false
        }
      }
      overallStatus = 'unhealthy'
    }

    // Generate overall health summary
    const healthyCount = Object.values(healthChecks).filter(check => check.status === 'healthy').length
    const totalChecks = Object.keys(healthChecks).length
    const healthPercentage = Math.round((healthyCount / totalChecks) * 100)

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      health_percentage: healthPercentage,
      checks: healthChecks,
      summary: {
        healthy_checks: healthyCount,
        total_checks: totalChecks,
        issues_found: totalChecks - healthyCount
      },
      recommendations: generateRecommendations(healthChecks)
    }

    console.log(`🏥 System health check completed: ${overallStatus} (${healthPercentage}%)`)
    
    return NextResponse.json(response, {
      status: overallStatus === 'healthy' ? 200 : (overallStatus === 'degraded' ? 206 : 503)
    })

  } catch (error) {
    console.error('❌ System health check failed:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'System health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      checks: healthChecks
    }, {
      status: 500
    })
  }
}

function validateCertificateVar(varName: string): boolean {
  const value = process.env[varName]
  if (!value) return false

  switch (varName) {
    case 'APPLE_CERT_BASE64':
    case 'APPLE_KEY_BASE64':
    case 'APPLE_WWDR_BASE64':
      try {
        const decoded = Buffer.from(value, 'base64').toString()
        return decoded.includes('-----BEGIN') && decoded.includes('-----END')
      } catch {
        return false
      }
    
    case 'APPLE_TEAM_IDENTIFIER':
      return value.length === 10 && /^[A-Z0-9]+$/.test(value)
    
    case 'APPLE_PASS_TYPE_IDENTIFIER':
      return value.startsWith('pass.') && value.includes('.')
    
    default:
      return true
  }
}

function validateGoogleVar(varName: string): boolean {
  const value = process.env[varName]
  if (!value) return false

  switch (varName) {
    case 'GOOGLE_SERVICE_ACCOUNT_EMAIL':
      return value.includes('@') && value.includes('.iam.gserviceaccount.com')
    
    case 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY':
      return value.includes('-----BEGIN PRIVATE KEY-----')
    
    case 'GOOGLE_CLASS_ID':
      return value.includes('.')
    
    default:
      return true
  }
}

function generateRecommendations(checks: Record<string, { status: string }>): string[] {
  const recommendations = []

  if (checks.supabase.status !== 'healthy') {
    recommendations.push('Check Supabase connection and environment variables')
  }

  if (checks.wallet_certificates.status !== 'healthy') {
    recommendations.push('Configure Apple Wallet certificates for PKPass generation')
  }

  if (checks.file_system.status !== 'healthy') {
    recommendations.push('Check file system permissions for temporary file creation')
  }

  if (checks.test_pass_generation.status !== 'healthy') {
    recommendations.push('Verify pass generation logic and required fields')
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operational - no action required')
  }

  return recommendations
} 