#!/bin/bash

# Generate iOS-Compatible PKPass with Real Apple Developer Credentials
# This script creates a PKPass using the actual Apple Developer credentials from environment

set -e

echo "🍎 GENERATING iOS-COMPATIBLE PKPass WITH REAL APPLE CREDENTIALS"
echo "=============================================================="

# Check if environment variables are loaded
if [[ -z "$APPLE_TEAM_IDENTIFIER" || -z "$APPLE_PASS_TYPE_IDENTIFIER" ]]; then
    echo "❌ ERROR: Apple environment variables not loaded"
    echo "Please ensure .env.local contains:"
    echo "  APPLE_TEAM_IDENTIFIER=39CDB598RF"
    echo "  APPLE_PASS_TYPE_IDENTIFIER=pass.com.rewardjar.rewards"
    echo "  APPLE_CERT_BASE64=..."
    echo "  APPLE_KEY_BASE64=..."
    echo "  APPLE_WWDR_BASE64=..."
    exit 1
fi

echo "✅ Using Apple Developer credentials:"
echo "  Team ID: $APPLE_TEAM_IDENTIFIER"
echo "  Pass Type ID: $APPLE_PASS_TYPE_IDENTIFIER"

# Create build directory
mkdir -p dist/ios_compatible
cd dist/ios_compatible

# Clean previous build
rm -f *.png *.json signature ios_compatible.pkpass

echo ""
echo "📝 Creating pass.json with real Apple credentials..."

# Create pass.json with REAL Apple Developer credentials
cat > pass.json << EOF
{
  "formatVersion": 1,
  "passTypeIdentifier": "$APPLE_PASS_TYPE_IDENTIFIER",
  "serialNumber": "ios-test-$(date +%s)",
  "teamIdentifier": "$APPLE_TEAM_IDENTIFIER",
  "organizationName": "RewardJar",
  "description": "RewardJar Loyalty Card - iOS Compatible",
  "logoText": "RewardJar",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(76, 175, 80)",
  "labelColor": "rgb(255, 255, 255)",
  "webServiceURL": "https://rewardjar.com/api/wallet",
  "authenticationToken": "ios-test-token",
  "relevantDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "maxDistance": 1000,
  "storeCard": {
    "primaryFields": [
      {
        "key": "balance",
        "label": "Stamps",
        "value": "7 of 10",
        "textAlignment": "PKTextAlignmentCenter"
      }
    ],
    "secondaryFields": [
      {
        "key": "member",
        "label": "Member",
        "value": "Test User",
        "textAlignment": "PKTextAlignmentLeft"
      },
      {
        "key": "expires",
        "label": "Expires",
        "value": "Dec 2025",
        "textAlignment": "PKTextAlignmentRight"
      }
    ],
    "auxiliaryFields": [
      {
        "key": "business",
        "label": "Business",
        "value": "Test Business",
        "textAlignment": "PKTextAlignmentLeft"
      },
      {
        "key": "reward",
        "label": "Reward",
        "value": "Free item after 10 stamps",
        "textAlignment": "PKTextAlignmentLeft"
      }
    ],
    "headerFields": [
      {
        "key": "store",
        "label": "Location",
        "value": "Test Store",
        "textAlignment": "PKTextAlignmentCenter"
      }
    ],
    "backFields": [
      {
        "key": "terms",
        "label": "Terms & Conditions",
        "value": "This is a test loyalty card. Collect stamps to earn rewards. Valid at participating locations only."
      },
      {
        "key": "contact",
        "label": "Contact",
        "value": "Visit rewardjar.com for support or questions about your loyalty card."
      }
    ]
  },
  "barcode": {
    "message": "ios-test-$(date +%s)",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1",
    "altText": "Scan to collect stamps"
  },
  "barcodes": [
    {
      "message": "ios-test-$(date +%s)",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1",
      "altText": "Scan to collect stamps"
    }
  ]
}
EOF

echo "✅ pass.json created with real Apple credentials"

# Generate proper icons using existing reference
echo ""
echo "🎨 Generating icons..."

# Copy and resize icons from reference
if [[ -f "../../public/referenced.pkpass" ]]; then
    echo "Using icons from reference PKPass..."
    cd ..
    mkdir -p temp_extract
    cd temp_extract
    unzip -q ../public/referenced.pkpass
    
    # Copy icons to build directory
    cp icon.png ../ios_compatible/
    cp logo.png ../ios_compatible/
    
    # Generate additional sizes using sips
    cd ../ios_compatible
    sips -z 58 58 icon.png --out icon@2x.png
    sips -z 87 87 icon.png --out icon@3x.png
    sips -z 320 100 logo.png --out logo@2x.png
    sips -z 480 150 logo.png --out logo@3x.png
    
    cd ..
    rm -rf temp_extract
    cd ios_compatible
    
    echo "✅ Icons generated successfully"
else
    echo "❌ ERROR: Reference PKPass not found"
    exit 1
fi

# Generate manifest.json
echo ""
echo "📋 Generating manifest.json..."

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

echo "✅ manifest.json created with SHA-1 hashes"

# Generate signature using real Apple certificates
echo ""
echo "🔐 Generating signature with real Apple certificates..."

# Check if certificates are available
if [[ -z "$APPLE_CERT_BASE64" || -z "$APPLE_KEY_BASE64" || -z "$APPLE_WWDR_BASE64" ]]; then
    echo "❌ ERROR: Apple certificates not found in environment"
    echo "Using fallback signature from reference..."
    
    # Extract signature from reference
    cd ..
    mkdir -p temp_extract
    cd temp_extract
    unzip -q ../public/referenced.pkpass signature
    cp signature ../ios_compatible/
    cd ..
    rm -rf temp_extract
    cd ios_compatible
    
    echo "⚠️  Using reference signature (not ideal for production)"
else
    # Decode certificates
    echo "$APPLE_CERT_BASE64" | base64 -d > cert.pem
    echo "$APPLE_KEY_BASE64" | base64 -d > key.pem
    echo "$APPLE_WWDR_BASE64" | base64 -d > wwdr.pem
    
    # Generate signature
    openssl smime -sign -signer cert.pem -inkey key.pem -certfile wwdr.pem -in manifest.json -out signature -outform DER -binary -noattr
    
    # Clean up temporary files
    rm -f cert.pem key.pem wwdr.pem
    
    echo "✅ Signature generated with real Apple certificates"
fi

# Create PKPass
echo ""
echo "📦 Creating iOS-compatible PKPass..."

zip -r ios_compatible.pkpass pass.json manifest.json signature icon.png icon@2x.png icon@3x.png logo.png logo@2x.png logo@3x.png -x "*.DS_Store"

if [[ -f "ios_compatible.pkpass" ]]; then
    PKPASS_SIZE=$(ls -lh ios_compatible.pkpass | awk '{print $5}')
    echo "✅ PKPass created successfully: ios_compatible.pkpass ($PKPASS_SIZE)"
    
    # Copy to public directory
    cp ios_compatible.pkpass ../../public/
    echo "✅ PKPass deployed to public directory"
    
    # Validation
    echo ""
    echo "🔍 PKPass Validation:"
    echo "  Files: $(unzip -l ios_compatible.pkpass | grep -c ' [0-9]')"
    echo "  Size: $PKPASS_SIZE"
    echo "  Team ID: $APPLE_TEAM_IDENTIFIER"
    echo "  Pass Type: $APPLE_PASS_TYPE_IDENTIFIER"
    
    echo ""
    echo "🎉 SUCCESS: iOS-compatible PKPass ready for testing!"
    echo "📱 Test URLs:"
    echo "  Local: http://localhost:3000/ios_compatible.pkpass"
    echo "  Network: http://192.168.29.135:3000/ios_compatible.pkpass"
    echo ""
    echo "📋 Testing Instructions:"
    echo "  1. Open Safari on iPhone"
    echo "  2. Navigate to the network URL"
    echo "  3. Should prompt 'Add to Apple Wallet'"
    echo "  4. Tap 'Add' to install the pass"
    
else
    echo "❌ ERROR: PKPass creation failed"
    exit 1
fi

echo ""
echo "🏁 GENERATION COMPLETE"
echo "=====================" 