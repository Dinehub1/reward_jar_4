#!/usr/bin/env node

/**
 * Wallet Environment Validation Script
 * 
 * Validates environment configuration for wallet chain functionality
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 WALLET ENVIRONMENT VALIDATION')
console.log('=================================')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const checks = {
  required: {
    'Apple Wallet': {
      APPLE_PASS_TYPE_ID: process.env.APPLE_PASS_TYPE_ID,
      APPLE_TEAM_ID: process.env.APPLE_TEAM_ID
    },
    'Google Wallet': {
      GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      GOOGLE_WALLET_ISSUER_ID: process.env.GOOGLE_WALLET_ISSUER_ID
    }
  },
  optional: {
    'Apple Wallet (Production)': {
      APPLE_PASS_SIGNING_CERT: process.env.APPLE_PASS_SIGNING_CERT,
      APPLE_PASS_SIGNING_KEY: process.env.APPLE_PASS_SIGNING_KEY
    },
    'Storage (AWS S3)': {
      S3_TEST_BUCKET: process.env.S3_TEST_BUCKET,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
}

const featureFlags = {
  'Wallet Generation': {
    DISABLE_WALLET_GENERATION: process.env.DISABLE_WALLET_GENERATION === 'true' ? '❌ DISABLED' : '✅ ENABLED',
    DISABLE_WALLET_PROVISIONING: process.env.DISABLE_WALLET_PROVISIONING === 'true' ? '❌ DISABLED' : '✅ ENABLED'
  },
  'Platform Support': {
    DISABLE_APPLE_WALLET: process.env.DISABLE_APPLE_WALLET === 'true' ? '❌ DISABLED' : '✅ ENABLED',
    DISABLE_GOOGLE_WALLET: process.env.DISABLE_GOOGLE_WALLET === 'true' ? '❌ DISABLED' : '✅ ENABLED',
    DISABLE_PWA_CARDS: process.env.DISABLE_PWA_CARDS === 'true' ? '❌ DISABLED' : '✅ ENABLED'
  },
  'Advanced Features': {
    ENABLE_AUTOMATIC_VERIFICATION: process.env.ENABLE_AUTOMATIC_VERIFICATION === 'true' ? '✅ ENABLED' : '⚠️ DISABLED',
    ENABLE_PARALLEL_GENERATION: process.env.ENABLE_PARALLEL_GENERATION === 'true' ? '✅ ENABLED' : '⚠️ DISABLED',
    WALLET_TEST_MODE: process.env.WALLET_TEST_MODE === 'true' ? '🧪 TEST MODE' : '🚀 PRODUCTION'
  }
}

let allValid = true
const issues = []
const warnings = []

console.log('\n📋 REQUIRED CONFIGURATION')
console.log('-------------------------')

for (const [category, vars] of Object.entries(checks.required)) {
  console.log(`\n${category}:`)
  
  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      console.log(`  ✅ ${key}: ${value.length > 20 ? '[SET]' : value}`)
    } else {
      console.log(`  ❌ ${key}: [NOT SET]`)
      issues.push(`Missing required variable: ${key}`)
      allValid = false
    }
  }
}

console.log('\n📋 OPTIONAL CONFIGURATION')
console.log('-------------------------')

for (const [category, vars] of Object.entries(checks.optional)) {
  console.log(`\n${category}:`)
  
  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      console.log(`  ✅ ${key}: ${value.length > 20 ? '[SET]' : value}`)
    } else {
      console.log(`  ⚠️ ${key}: [NOT SET]`)
      warnings.push(`Optional variable not set: ${key}`)
    }
  }
}

console.log('\n🚩 FEATURE FLAGS')
console.log('----------------')

for (const [category, flags] of Object.entries(featureFlags)) {
  console.log(`\n${category}:`)
  
  for (const [key, status] of Object.entries(flags)) {
    console.log(`  ${status} ${key}`)
  }
}

// Validate Google Service Account JSON
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  console.log('\n🔍 GOOGLE SERVICE ACCOUNT VALIDATION')
  console.log('------------------------------------')
  
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
    
    for (const field of requiredFields) {
      if (credentials[field]) {
        console.log(`  ✅ ${field}: [PRESENT]`)
      } else {
        console.log(`  ❌ ${field}: [MISSING]`)
        issues.push(`Google Service Account missing field: ${field}`)
        allValid = false
      }
    }
  } catch (error) {
    console.log('  ❌ Invalid JSON format')
    issues.push('Google Service Account JSON is invalid')
    allValid = false
  }
}

// Check for .env.example file
console.log('\n📄 ENVIRONMENT FILES')
console.log('--------------------')

const envFiles = ['.env.local', '.env', '.env.example']
for (const file of envFiles) {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}: [EXISTS]`)
  } else {
    console.log(`  ⚠️ ${file}: [NOT FOUND]`)
  }
}

// Production readiness check
console.log('\n🚀 PRODUCTION READINESS')
console.log('----------------------')

const productionChecks = [
  {
    name: 'Test mode disabled',
    check: process.env.WALLET_TEST_MODE !== 'true',
    critical: true
  },
  {
    name: 'Signature validation enabled',
    check: process.env.DISABLE_SIGNATURE_VALIDATION !== 'true',
    critical: true
  },
  {
    name: 'Apple certificates configured',
    check: !!(process.env.APPLE_PASS_SIGNING_CERT && process.env.APPLE_PASS_SIGNING_KEY),
    critical: false
  },
  {
    name: 'S3 storage configured',
    check: !!(process.env.S3_TEST_BUCKET && process.env.AWS_ACCESS_KEY_ID),
    critical: false
  }
]

let productionReady = true

for (const check of productionChecks) {
  if (check.check) {
    console.log(`  ✅ ${check.name}`)
  } else {
    console.log(`  ${check.critical ? '❌' : '⚠️'} ${check.name}`)
    if (check.critical) {
      productionReady = false
      issues.push(`Production issue: ${check.name}`)
    } else {
      warnings.push(`Production warning: ${check.name}`)
    }
  }
}

// Final summary
console.log('\n📊 VALIDATION SUMMARY')
console.log('====================')

if (allValid && productionReady) {
  console.log('✅ ALL CHECKS PASSED - Ready for production!')
} else if (allValid) {
  console.log('⚠️ CONFIGURATION VALID - Some production features not configured')
} else {
  console.log('❌ CONFIGURATION INVALID - Missing required settings')
}

if (issues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES:')
  issues.forEach(issue => console.log(`  • ${issue}`))
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:')
  warnings.forEach(warning => console.log(`  • ${warning}`))
}

console.log('\n💡 NEXT STEPS:')
if (!allValid) {
  console.log('  1. Set all required environment variables')
  console.log('  2. Run this script again to verify')
}
if (warnings.length > 0) {
  console.log('  3. Consider configuring optional features for production')
}
console.log('  4. Run npm run test:wallet to verify functionality')
console.log('  5. Test wallet generation in development environment')

// Exit with appropriate code
process.exit(allValid ? 0 : 1)