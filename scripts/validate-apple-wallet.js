#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🍎 Apple Wallet Environment Validation\n');

const requiredVars = [
  'APPLE_CERT_BASE64',
  'APPLE_KEY_BASE64', 
  'APPLE_WWDR_BASE64',
  'APPLE_CERT_PASSWORD',
  'APPLE_TEAM_IDENTIFIER',
  'APPLE_PASS_TYPE_IDENTIFIER'
];

let allValid = true;
let validCount = 0;

// Validate each variable
requiredVars.forEach(varName => {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    allValid = false;
    return;
  }
  
  // Check for placeholder values
  if (value === 'xx' || value === 'your_password_here' || value === 'your_team_id' || value === 'your_pass_type_id') {
    console.log(`⚠️  ${varName}: Placeholder value detected`);
    allValid = false;
    return;
  }
  
  // Validate base64 certificate variables
  if (varName.includes('BASE64')) {
    try {
      const decoded = Buffer.from(value, 'base64');
      const decodedStr = decoded.toString();
      
      // Check if it looks like a valid certificate/key
      if (decodedStr.includes('-----BEGIN') && decodedStr.includes('-----END')) {
        console.log(`✅ ${varName}: Valid base64 certificate (${Math.round(decoded.length / 1024)}KB)`);
        validCount++;
      } else {
        console.log(`❌ ${varName}: Invalid certificate format`);
        allValid = false;
      }
    } catch (error) {
      console.log(`❌ ${varName}: Invalid base64 encoding`);
      allValid = false;
    }
  } else {
    // Validate other variables
    if (varName === 'APPLE_TEAM_IDENTIFIER' && value.length === 10) {
      console.log(`✅ ${varName}: Valid format (${value})`);
      validCount++;
    } else if (varName === 'APPLE_PASS_TYPE_IDENTIFIER' && value.startsWith('pass.')) {
      console.log(`✅ ${varName}: Valid format (${value})`);
      validCount++;
    } else if (varName === 'APPLE_CERT_PASSWORD') {
      console.log(`✅ ${varName}: Set (${value.length} characters)`);
      validCount++;
    } else {
      console.log(`⚠️  ${varName}: Format validation needed`);
    }
  }
});

console.log(`\n📊 Validation Summary:`);
console.log(`✅ Valid variables: ${validCount}/${requiredVars.length}`);
console.log(`📈 Completion: ${Math.round((validCount / requiredVars.length) * 100)}%`);

if (allValid) {
  console.log('\n🎉 All Apple Wallet environment variables are valid!');
  console.log('✅ Apple Wallet integration is ready for production');
  process.exit(0);
} else {
  console.log('\n⚠️  Some Apple Wallet environment variables need attention');
  console.log('📝 Please update the missing or invalid variables in .env.local');
  process.exit(1);
} 