#!/usr/bin/env node

/**
 * Google Wallet JWT Generator for RewardJar 4.0
 * Generates JWT tokens for Google Wallet passes
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Environment variables for Google Wallet
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const GOOGLE_WALLET_ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;

/**
 * Load Google service account credentials
 */
function loadServiceAccount() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is required');
  }
  
  let credentials;
  try {
    // Try parsing as JSON string first
    credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    // Try loading as file path
    if (fs.existsSync(GOOGLE_SERVICE_ACCOUNT_JSON)) {
      credentials = JSON.parse(fs.readFileSync(GOOGLE_SERVICE_ACCOUNT_JSON, 'utf8'));
    } else {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: not valid JSON or file path');
    }
  }
  
  if (!credentials.private_key || !credentials.client_email) {
    throw new Error('Service account JSON must contain private_key and client_email');
  }
  
  return credentials;
}

/**
 * Generate a stamp card (loyalty object) for Google Wallet
 */
function generateStampCardObject() {
  const objectId = `stamp-${Date.now()}`;
  const issuerId = GOOGLE_WALLET_ISSUER_ID;
  
  return {
    id: `${issuerId}.${objectId}`,
    classId: `${issuerId}.stamp-card-class`,
    state: 'ACTIVE',
    
    // Barcode for scanning
    barcode: {
      type: 'QR_CODE',
      value: `REWARDJAR-GOOGLE-STAMP-${objectId}`,
      alternateText: objectId
    },
    
    // Account information
    accountId: `test-account-${objectId}`,
    accountName: 'Test Customer',
    
    // Loyalty points/stamps
    loyaltyPoints: {
      balance: {
        string: '3 of 10 stamps'
      },
      label: 'Stamps Collected'
    },
    
    // Messages and notifications
    messages: [
      {
        header: 'Welcome to RewardJar Test!',
        body: 'Collect 10 stamps to earn a free reward.',
        kind: 'walletobjects#walletObjectMessage'
      }
    ],
    
    // Additional information
    textModulesData: [
      {
        header: 'Reward',
        body: 'Free Medium Coffee',
        id: 'reward-info'
      },
      {
        header: 'Expires',
        body: '2025-12-31',
        id: 'expiry-info'
      }
    ],
    
    // Links
    linksModuleData: {
      uris: [
        {
          uri: 'https://rewardjar.app',
          description: 'Visit RewardJar',
          id: 'website-link'
        }
      ]
    }
  };
}

/**
 * Generate a membership card (generic object) for Google Wallet
 */
function generateMembershipCardObject() {
  const objectId = `membership-${Date.now()}`;
  const issuerId = GOOGLE_WALLET_ISSUER_ID;
  
  return {
    id: `${issuerId}.${objectId}`,
    classId: `${issuerId}.membership-card-class`,
    state: 'ACTIVE',
    
    // Barcode for scanning
    barcode: {
      type: 'QR_CODE',
      value: `REWARDJAR-GOOGLE-MEMBER-${objectId}`,
      alternateText: objectId
    },
    
    // Card header
    cardTitle: {
      defaultValue: {
        language: 'en-US',
        value: 'Gold Membership'
      }
    },
    
    header: {
      defaultValue: {
        language: 'en-US',
        value: 'Test Fitness Center'
      }
    },
    
    // Hero image (optional)
    heroImage: {
      sourceUri: {
        uri: 'https://rewardjar.app/hero-membership.jpg'
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Membership benefits hero image'
        }
      }
    },
    
    // Text modules for additional info
    textModulesData: [
      {
        header: 'Member ID',
        body: 'TEST-12345',
        id: 'member-id'
      },
      {
        header: 'Expires',
        body: '2025-12-31',
        id: 'expiry-date'
      },
      {
        header: 'Benefits',
        body: '24/7 access, guest privileges, personal training discount',
        id: 'benefits'
      }
    ],
    
    // Links
    linksModuleData: {
      uris: [
        {
          uri: 'https://rewardjar.app/membership',
          description: 'Manage Membership',
          id: 'membership-link'
        }
      ]
    }
  };
}

/**
 * Generate class definitions (shared templates)
 */
function generateLoyaltyClass() {
  const issuerId = GOOGLE_WALLET_ISSUER_ID;
  
  return {
    id: `${issuerId}.stamp-card-class`,
    issuerName: 'RewardJar Test Business',
    reviewStatus: 'UNDER_REVIEW',
    
    // Program details
    programName: 'Test Coffee Loyalty',
    programLogo: {
      sourceUri: {
        uri: 'https://rewardjar.app/logo.png'
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Coffee shop logo'
        }
      }
    },
    
    // Rewards tier
    rewardsTier: 'Coffee Lover',
    rewardsTierLabel: 'Member Level',
    
    // Account name and ID labels
    accountNameLabel: 'Customer Name',
    accountIdLabel: 'Customer ID',
    
    // Security features
    securityAnimation: {
      animationType: 'FOIL_SHIMMER'
    },
    
    // Messages
    messages: [
      {
        header: 'Terms and Conditions',
        body: 'This is a test loyalty card for RewardJar wallet validation. Not valid for actual purchases.',
        kind: 'walletobjects#walletObjectMessage'
      }
    ]
  };
}

function generateGenericClass() {
  const issuerId = GOOGLE_WALLET_ISSUER_ID;
  
  return {
    id: `${issuerId}.membership-card-class`,
    issuerName: 'RewardJar Test Gym',
    reviewStatus: 'UNDER_REVIEW',
    
    // Logo
    logo: {
      sourceUri: {
        uri: 'https://rewardjar.app/gym-logo.png'
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Gym logo'
        }
      }
    },
    
    // Security features
    securityAnimation: {
      animationType: 'FOIL_SHIMMER'
    }
  };
}

/**
 * Create JWT for Google Wallet API
 */
function createWalletJWT(payload, credentials) {
  const now = Math.floor(Date.now() / 1000);
  
  const jwtPayload = {
    iss: credentials.client_email,
    aud: 'google',
    origins: ['https://rewardjar.app'], // Your app's domain
    typ: 'savetowallet',
    iat: now,
    exp: now + 3600, // 1 hour expiration
    payload: payload
  };
  
  return jwt.sign(jwtPayload, credentials.private_key, { algorithm: 'RS256' });
}

/**
 * Generate save-to-wallet URL
 */
function generateSaveUrl(jwtToken) {
  const baseUrl = 'https://pay.google.com/gp/v/save';
  return `${baseUrl}/${jwtToken}`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🏪 RewardJar Google Wallet JWT Generator');
  console.log('=========================================');
  
  try {
    // Load service account
    console.log('🔑 Loading Google service account...');
    const credentials = loadServiceAccount();
    console.log(`✅ Loaded service account: ${credentials.client_email}`);
    
    if (!GOOGLE_WALLET_ISSUER_ID) {
      throw new Error('GOOGLE_WALLET_ISSUER_ID environment variable is required');
    }
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../../artifacts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate stamp card JWT
    console.log('📱 Generating stamp card JWT...');
    const stampClass = generateLoyaltyClass();
    const stampObject = generateStampCardObject();
    const stampPayload = {
      loyaltyClasses: [stampClass],
      loyaltyObjects: [stampObject]
    };
    const stampJWT = createWalletJWT(stampPayload, credentials);
    const stampSaveUrl = generateSaveUrl(stampJWT);
    
    // Generate membership card JWT
    console.log('💳 Generating membership card JWT...');
    const memberClass = generateGenericClass();
    const memberObject = generateMembershipCardObject();
    const memberPayload = {
      genericClasses: [memberClass],
      genericObjects: [memberObject]
    };
    const memberJWT = createWalletJWT(memberPayload, credentials);
    const memberSaveUrl = generateSaveUrl(memberJWT);
    
    // Save results
    const results = {
      stampCard: {
        jwt: stampJWT,
        saveUrl: stampSaveUrl,
        payload: stampPayload
      },
      membershipCard: {
        jwt: memberJWT,
        saveUrl: memberSaveUrl,
        payload: memberPayload
      },
      generatedAt: new Date().toISOString()
    };
    
    const outputFile = path.join(outputDir, 'google-wallet-jwts.json');
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    
    console.log('\n✅ JWT generation complete!');
    console.log(`📁 Results saved to: ${outputFile}`);
    console.log('\n📋 Test these JWTs by:');
    console.log('   1. Opening save URLs in browser on Android device');
    console.log('   2. Using Google Wallet API to validate JWT structure');
    console.log('   3. Testing barcode scanning functionality');
    console.log('\n🔗 Save URLs:');
    console.log(`   Stamp Card: ${stampSaveUrl.substring(0, 100)}...`);
    console.log(`   Membership: ${memberSaveUrl.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ JWT generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateStampCardObject,
  generateMembershipCardObject,
  createWalletJWT,
  generateSaveUrl
};