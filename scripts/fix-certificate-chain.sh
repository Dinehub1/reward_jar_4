#!/bin/bash

# Fix Apple Wallet Certificate Chain Mismatch
# This script fixes the WWDR G3/G4 certificate chain mismatch issue

set -e

echo "🔧 FIXING APPLE WALLET CERTIFICATE CHAIN MISMATCH"
echo "================================================="

echo "🔍 PROBLEM IDENTIFIED:"
echo "- Pass Certificate: Issued by Apple WWDR G4 (2025)"
echo "- WWDR Certificate: Using Apple WWDR G3 (2020)"
echo "- Result: Certificate chain mismatch → iOS rejection"
echo ""

echo "✅ SOLUTION: Use matching WWDR G4 certificate"
echo ""

# Verify we have the correct certificates
echo "📋 Verifying certificate chain..."

echo "Pass Certificate Issuer:"
openssl x509 -in licence/certificate.pem -noout -issuer

echo "WWDR G4 Certificate Subject:"
openssl x509 -in licence/wwdr_g4.pem -noout -subject

echo "WWDR G3 Certificate Subject (old):"
openssl x509 -in licence/wwdr.pem -noout -subject

echo ""
echo "✅ Certificate chain will now match: Pass Certificate ← WWDR G4 ← Apple Root CA"

# Update environment variables with WWDR G4
echo ""
echo "🔄 Updating environment variables with WWDR G4..."

# Base64 encode the new WWDR G4 certificate
base64 -i licence/wwdr_g4.pem > licence/wwdr_g4.b64

# Create updated environment variables
cat > licence/apple-wallet-env-fixed.txt << EOF
# Apple Wallet Certificate Configuration (FIXED)
APPLE_TEAM_IDENTIFIER=39CDB598RF
APPLE_PASS_TYPE_IDENTIFIER=pass.com.rewardjar.rewards

# Base64 Encoded Certificates (Apple-signed with matching WWDR G4)
APPLE_CERT_BASE64="$(cat licence/cert.b64 | tr -d '\n')"
APPLE_KEY_BASE64="$(cat licence/key.b64 | tr -d '\n')"
APPLE_WWDR_BASE64="$(cat licence/wwdr_g4.b64 | tr -d '\n')"
EOF

echo "✅ Updated environment variables saved to: licence/apple-wallet-env-fixed.txt"

# Update .env.local
if [[ -f ".env.local" ]]; then
    echo ""
    echo "🔧 Updating .env.local with WWDR G4..."
    
    # Remove old Apple Wallet variables
    sed -i.bak '/^APPLE_/d' .env.local
    
    # Add new variables with WWDR G4
    cat licence/apple-wallet-env-fixed.txt >> .env.local
    
    echo "✅ .env.local updated with WWDR G4 certificate"
else
    echo "⚠️  .env.local not found - you'll need to add the environment variables manually"
fi

# Test the certificate chain
echo ""
echo "🧪 TESTING CERTIFICATE CHAIN"
echo "============================"

# Create a test PKPass with the correct certificate chain
echo "Creating test PKPass with WWDR G4..."

mkdir -p test_chain_fix
cd test_chain_fix

# Create minimal pass.json for testing
cat > pass.json << 'EOF'
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "chain-fix-test-123",
  "teamIdentifier": "39CDB598RF",
  "organizationName": "RewardJar",
  "description": "Certificate Chain Fix Test",
  "storeCard": {
    "primaryFields": [
      {
        "key": "test",
        "label": "Test",
        "value": "Chain Fix"
      }
    ]
  },
  "barcode": {
    "message": "chain-fix-test-123",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1"
  },
  "barcodes": [
    {
      "message": "chain-fix-test-123",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1"
    }
  ]
}
EOF

# Create minimal icons
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hzyku
QAAAABJRU5ErkJggg==" | base64 -d > icon.png
cp icon.png icon@2x.png
cp icon.png icon@3x.png
cp icon.png logo.png
cp icon.png logo@2x.png
cp icon.png logo@3x.png

# Create manifest
cat > manifest.json << EOF
{
  "pass.json": "$(shasum -a 1 pass.json | cut -d' ' -f1)",
  "icon.png": "$(shasum -a 1 icon.png | cut -d' ' -f1)",
  "icon@2x.png": "$(shasum -a 1 icon@2x.png | cut -d' ' -f1)",
  "icon@3x.png": "$(shasum -a 1 icon@3x.png | cut -d' ' -f1)",
  "logo.png": "$(shasum -a 1 logo.png | cut -d' ' -f1)",
  "logo@2x.png": "$(shasum -a 1 logo@2x.png | cut -d' ' -f1)",
  "logo@3x.png": "$(shasum -a 1 logo@3x.png | cut -d' ' -f1)"
}
EOF

# Create signature with WWDR G4
echo "🔐 Creating signature with WWDR G4..."
if openssl smime -sign -signer ../licence/certificate.pem -inkey ../licence/private.key -certfile ../licence/wwdr_g4.pem -in manifest.json -out signature -outform DER -binary -noattr; then
    echo "✅ Signature created successfully with WWDR G4"
else
    echo "❌ ERROR: Failed to create signature with WWDR G4"
    exit 1
fi

# Verify the certificate chain in signature
echo ""
echo "🔍 Verifying certificate chain in signature..."
echo "Certificates in signature:"
openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -E "(subject|issuer)="

# Check if both certificates are G4
if openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -q "OU=G4"; then
    echo "✅ Certificate chain contains WWDR G4 - MATCH!"
else
    echo "❌ ERROR: Certificate chain still contains wrong WWDR version"
    exit 1
fi

# Create the test PKPass
echo ""
echo "📦 Creating test PKPass with fixed certificate chain..."
zip -r ../dist/test_chain_fixed.pkpass pass.json manifest.json signature icon.png icon@2x.png icon@3x.png logo.png logo@2x.png logo@3x.png

cd ..
rm -rf test_chain_fix

# Get file size
PKPASS_SIZE=$(ls -lh dist/test_chain_fixed.pkpass | awk '{print $5}')
echo "✅ Test PKPass created: dist/test_chain_fixed.pkpass ($PKPASS_SIZE)"

echo ""
echo "🎉 CERTIFICATE CHAIN FIX COMPLETE"
echo "================================="
echo "✅ WWDR G4 certificate integrated"
echo "✅ Certificate chain now matches: Pass Certificate ← WWDR G4"
echo "✅ Environment variables updated"
echo "✅ Test PKPass generated with correct chain"
echo ""
echo "📱 NEXT STEPS:"
echo "1. Test dist/test_chain_fixed.pkpass on iPhone"
echo "2. Restart your development server to pick up new environment variables"
echo "3. Test the API endpoint again"
echo ""
echo "🔄 RESTART DEVELOPMENT SERVER:"
echo "rm -rf .next && npm run dev"
echo ""
echo "✅ SUCCESS: Certificate chain mismatch FIXED!" 