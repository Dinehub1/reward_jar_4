#!/usr/bin/env node

// Generate iOS Production PKPass with Real Apple Developer Credentials
// This script creates a PKPass using the actual Apple Developer credentials

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🍎 GENERATING iOS PRODUCTION PKPass WITH REAL APPLE CREDENTIALS');
console.log('==============================================================');

// Validate environment variables
const requiredVars = [
  'APPLE_TEAM_IDENTIFIER',
  'APPLE_PASS_TYPE_IDENTIFIER',
  'APPLE_CERT_BASE64',
  'APPLE_KEY_BASE64',
  'APPLE_WWDR_BASE64'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing environment variables:', missingVars);
  process.exit(1);
}

console.log('✅ Using Apple Developer credentials:');
console.log(`  Team ID: ${process.env.APPLE_TEAM_IDENTIFIER}`);
console.log(`  Pass Type ID: ${process.env.APPLE_PASS_TYPE_IDENTIFIER}`);

// Create build directory
const buildDir = path.join(__dirname, 'ios_production_build');
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true });
}
fs.mkdirSync(buildDir, { recursive: true });

// Create pass.json with REAL Apple Developer credentials
const passData = {
  formatVersion: 1,
  passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
  serialNumber: `ios-production-${Date.now()}`,
  teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
  organizationName: "RewardJar",
  description: "RewardJar Loyalty Card - iOS Production",
  logoText: "RewardJar",
  foregroundColor: "rgb(255, 255, 255)",
  backgroundColor: "rgb(76, 175, 80)",
  labelColor: "rgb(255, 255, 255)",
  webServiceURL: "https://rewardjar.com/api/wallet",
  authenticationToken: `ios-production-${Date.now()}`,
  relevantDate: new Date().toISOString(),
  maxDistance: 1000,
  storeCard: {
    primaryFields: [
      {
        key: "balance",
        label: "Stamps",
        value: "7 of 10",
        textAlignment: "PKTextAlignmentCenter"
      }
    ],
    secondaryFields: [
      {
        key: "member",
        label: "Member",
        value: "Production Test",
        textAlignment: "PKTextAlignmentLeft"
      },
      {
        key: "expires",
        label: "Expires",
        value: "Dec 2025",
        textAlignment: "PKTextAlignmentRight"
      }
    ],
    auxiliaryFields: [
      {
        key: "business",
        label: "Business",
        value: "RewardJar Demo",
        textAlignment: "PKTextAlignmentLeft"
      },
      {
        key: "reward",
        label: "Reward",
        value: "Free item after 10 stamps",
        textAlignment: "PKTextAlignmentLeft"
      }
    ],
    headerFields: [
      {
        key: "store",
        label: "Location",
        value: "Production Store",
        textAlignment: "PKTextAlignmentCenter"
      }
    ],
    backFields: [
      {
        key: "terms",
        label: "Terms & Conditions",
        value: "This is a production loyalty card. Collect stamps to earn rewards. Valid at participating locations only."
      },
      {
        key: "contact",
        label: "Contact",
        value: "Visit rewardjar.com for support or questions about your loyalty card."
      }
    ]
  },
  barcode: {
    message: `ios-production-${Date.now()}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: "Scan to collect stamps"
  },
  barcodes: [
    {
      message: `ios-production-${Date.now()}`,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: "Scan to collect stamps"
    }
  ]
};

// Write pass.json
const passJsonPath = path.join(buildDir, 'pass.json');
fs.writeFileSync(passJsonPath, JSON.stringify(passData, null, 2));
console.log('✅ pass.json created with real Apple credentials');

// Copy icons from reference PKPass
console.log('🎨 Generating icons...');
const referencePkpassPath = path.join(__dirname, '..', 'public', 'referenced.pkpass');
if (fs.existsSync(referencePkpassPath)) {
  // Extract icons from reference
  const tempExtractDir = path.join(__dirname, 'temp_extract');
  if (fs.existsSync(tempExtractDir)) {
    fs.rmSync(tempExtractDir, { recursive: true });
  }
  fs.mkdirSync(tempExtractDir);
  
  try {
    execSync(`cd "${tempExtractDir}" && unzip -q "${referencePkpassPath}"`);
    
    // Copy icons to build directory
    const iconFiles = ['icon.png', 'logo.png'];
    iconFiles.forEach(iconFile => {
      const srcPath = path.join(tempExtractDir, iconFile);
      const destPath = path.join(buildDir, iconFile);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    // Generate additional sizes using sips (macOS)
    try {
      execSync(`cd "${buildDir}" && sips -z 58 58 icon.png --out icon@2x.png`);
      execSync(`cd "${buildDir}" && sips -z 87 87 icon.png --out icon@3x.png`);
      execSync(`cd "${buildDir}" && sips -z 320 100 logo.png --out logo@2x.png`);
      execSync(`cd "${buildDir}" && sips -z 480 150 logo.png --out logo@3x.png`);
      console.log('✅ Icons generated successfully');
    } catch (sipsError) {
      console.log('⚠️  sips command failed, using base icons only');
    }
    
    // Clean up temp directory
    fs.rmSync(tempExtractDir, { recursive: true });
  } catch (error) {
    console.error('❌ ERROR: Failed to extract icons from reference PKPass:', error.message);
    process.exit(1);
  }
} else {
  console.error('❌ ERROR: Reference PKPass not found');
  process.exit(1);
}

// Generate manifest.json
console.log('📋 Generating manifest.json...');
const manifest = {};
const files = fs.readdirSync(buildDir).filter(file => file !== 'manifest.json' && file !== 'signature');

files.forEach(file => {
  const filePath = path.join(buildDir, file);
  const fileContent = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha1').update(fileContent).digest('hex');
  manifest[file] = hash;
});

const manifestPath = path.join(buildDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✅ manifest.json created with SHA-1 hashes');

// Generate signature using real Apple certificates
console.log('🔐 Generating signature with real Apple certificates...');
try {
  // Decode certificates
  const certPem = Buffer.from(process.env.APPLE_CERT_BASE64, 'base64').toString('utf8');
  const keyPem = Buffer.from(process.env.APPLE_KEY_BASE64, 'base64').toString('utf8');
  const wwdrPem = Buffer.from(process.env.APPLE_WWDR_BASE64, 'base64').toString('utf8');
  
  // Write temporary certificate files
  const tempCertPath = path.join(buildDir, 'temp_cert.pem');
  const tempKeyPath = path.join(buildDir, 'temp_key.pem');
  const tempWwdrPath = path.join(buildDir, 'temp_wwdr.pem');
  
  fs.writeFileSync(tempCertPath, certPem);
  fs.writeFileSync(tempKeyPath, keyPem);
  fs.writeFileSync(tempWwdrPath, wwdrPem);
  
  // Generate signature
  const signatureCommand = `cd "${buildDir}" && openssl smime -sign -signer temp_cert.pem -inkey temp_key.pem -certfile temp_wwdr.pem -in manifest.json -out signature -outform DER -binary -noattr`;
  execSync(signatureCommand);
  
  // Clean up temporary files
  fs.unlinkSync(tempCertPath);
  fs.unlinkSync(tempKeyPath);
  fs.unlinkSync(tempWwdrPath);
  
  console.log('✅ Signature generated with real Apple certificates');
} catch (signError) {
  console.error('❌ ERROR: Failed to generate signature:', signError.message);
  process.exit(1);
}

// Create PKPass
console.log('📦 Creating iOS production PKPass...');
const pkpassPath = path.join(buildDir, 'ios_production.pkpass');

// Create ZIP archive
const output = fs.createWriteStream(pkpassPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  const pkpassSize = (archive.pointer() / 1024).toFixed(1);
  console.log(`✅ PKPass created successfully: ios_production.pkpass (${pkpassSize} KB)`);
  
  // Copy to public directory
  const publicPath = path.join(__dirname, '..', 'public', 'ios_production.pkpass');
  fs.copyFileSync(pkpassPath, publicPath);
  console.log('✅ PKPass deployed to public directory');
  
  // Validation
  console.log('');
  console.log('🔍 PKPass Validation:');
  console.log(`  Files: ${files.length + 2}`); // +2 for manifest and signature
  console.log(`  Size: ${pkpassSize} KB`);
  console.log(`  Team ID: ${process.env.APPLE_TEAM_IDENTIFIER}`);
  console.log(`  Pass Type: ${process.env.APPLE_PASS_TYPE_IDENTIFIER}`);
  
  console.log('');
  console.log('🎉 SUCCESS: iOS production PKPass ready for testing!');
  console.log('📱 Test URLs:');
  console.log('  Local: http://localhost:3000/ios_production.pkpass');
  console.log('  Network: http://192.168.29.135:3000/ios_production.pkpass');
  console.log('');
  console.log('📋 Testing Instructions:');
  console.log('  1. Open Safari on iPhone');
  console.log('  2. Navigate to the network URL');
  console.log('  3. Should prompt "Add to Apple Wallet"');
  console.log('  4. Tap "Add" to install the pass');
  
  console.log('');
  console.log('🏁 GENERATION COMPLETE');
  console.log('=====================');
});

archive.on('error', (err) => {
  console.error('❌ ERROR: PKPass creation failed:', err);
  process.exit(1);
});

archive.pipe(output);

// Add files to archive
files.forEach(file => {
  const filePath = path.join(buildDir, file);
  archive.file(filePath, { name: file });
});

// Add manifest and signature
archive.file(manifestPath, { name: 'manifest.json' });
archive.file(path.join(buildDir, 'signature'), { name: 'signature' });

archive.finalize(); 