#!/usr/bin/env node

/**
 * Apple Wallet Validation Script
 * Validates Apple Wallet configuration and certificate setup
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

function validateAppleWalletSetup() {
  console.log('🍎 Apple Wallet Configuration Validator\n');
  
  const results = {
    environment: {},
    certificates: {},
    overall: true
  };

  // Check required environment variables
const requiredVars = [
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_PASS_TYPE_IDENTIFIER', 
  'APPLE_CERT_BASE64',
  'APPLE_KEY_BASE64', 
  'APPLE_WWDR_BASE64',
    'APPLE_CERT_PASSWORD'
];

  console.log('📋 Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
    const exists = !!value;
    const status = exists ? '✅' : '❌';
    
    results.environment[varName] = exists;
    if (!exists) results.overall = false;
    
    if (varName.includes('BASE64')) {
      console.log(`  ${status} ${varName}: ${exists ? `${value.substring(0, 20)}...` : 'MISSING'}`);
    } else {
      console.log(`  ${status} ${varName}: ${exists ? value : 'MISSING'}`);
    }
  });

  console.log('\n🔐 Certificate Validation:');
  
  // Validate certificates
  const certVars = ['APPLE_CERT_BASE64', 'APPLE_KEY_BASE64', 'APPLE_WWDR_BASE64'];
  certVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      try {
        const decoded = Buffer.from(value, 'base64').toString('utf8');
        const isValid = decoded.includes('-----BEGIN') && decoded.includes('-----END');
        const status = isValid ? '✅' : '❌';
        
        results.certificates[varName] = isValid;
        if (!isValid) results.overall = false;
        
        console.log(`  ${status} ${varName}: ${isValid ? 'Valid PEM format' : 'Invalid format'}`);
        
        // Show certificate details
        if (isValid) {
          const lines = decoded.split('\n');
          const certType = lines[0].replace('-----BEGIN ', '').replace('-----', '');
          console.log(`       Type: ${certType}`);
          console.log(`       Lines: ${lines.length}`);
      }
    } catch (error) {
        console.log(`  ❌ ${varName}: Base64 decode error`);
        results.certificates[varName] = false;
        results.overall = false;
      }
    } else {
      console.log(`  ❌ ${varName}: Missing`);
      results.certificates[varName] = false;
      results.overall = false;
    }
  });

  // Test API health endpoint
  console.log('\n🏥 API Health Check:');
  console.log('  Run: curl http://localhost:3000/api/health/wallet');
  console.log('  Expected: {"checks":{"apple_wallet":true}}');

  // Test PKPass generation
  console.log('\n📦 PKPass Generation Test:');
  console.log('  Run: curl -s "http://localhost:3000/api/wallet/apple/[CUSTOMER_CARD_ID]?debug=true"');
  console.log('  Expected: {"status":"READY_FOR_PKPASS_GENERATION"}');

  // Summary
  console.log('\n📊 Summary:');
  const envCount = Object.values(results.environment).filter(Boolean).length;
  const certCount = Object.values(results.certificates).filter(Boolean).length;
  
  console.log(`  Environment: ${envCount}/${requiredVars.length} configured`);
  console.log(`  Certificates: ${certCount}/${certVars.length} valid`);
  console.log(`  Overall Status: ${results.overall ? '✅ READY' : '❌ NEEDS SETUP'}`);

  if (!results.overall) {
    console.log('\n🔧 Setup Instructions:');
    console.log('  1. Get Apple Developer Account');
    console.log('  2. Create Pass Type ID Certificate');
    console.log('  3. Download certificate (.p12) and convert to PEM');
    console.log('  4. Base64 encode all certificates');
    console.log('  5. Add to .env.local file');
    console.log('\n  See: https://developer.apple.com/documentation/walletpasses');
  }

  return results.overall;
}

// Run validation
if (require.main === module) {
  const success = validateAppleWalletSetup();
  process.exit(success ? 0 : 1);
}

module.exports = { validateAppleWalletSetup }; 