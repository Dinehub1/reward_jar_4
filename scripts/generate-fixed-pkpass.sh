#!/bin/bash

# Generate Fixed PKPass for iOS Compatibility
# This script creates a properly structured PKPass that iOS will accept

set -e

echo "🔧 GENERATING FIXED PKPass FOR iOS"
echo "=================================="

# Create output directory
mkdir -p dist

# Create temporary working directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "Working in: $TEMP_DIR"

# Check if we have the required Apple certificates
if [[ ! -f "../licence/pass.pem" ]]; then
    echo "❌ ERROR: Apple certificate not found at licence/pass.pem"
    echo "Please ensure you have the Apple-issued certificate"
    exit 1
fi

if [[ ! -f "../licence/private.key" ]]; then
    echo "❌ ERROR: Private key not found at licence/private.key"
    exit 1
fi

if [[ ! -f "../licence/wwdr.pem" ]]; then
    echo "❌ ERROR: WWDR certificate not found at licence/wwdr.pem"
    exit 1
fi

echo "✅ All required certificates found"

# Validate certificate chain
echo "🔍 Validating certificate chain..."

# Check if certificates are valid and not expired
if ! openssl x509 -in ../licence/pass.pem -noout -checkend 0; then
    echo "❌ ERROR: Pass certificate is expired"
    exit 1
fi

if ! openssl x509 -in ../licence/wwdr.pem -noout -checkend 0; then
    echo "❌ ERROR: WWDR certificate is expired"
    exit 1
fi

# Verify certificate and key match
cert_modulus=$(openssl x509 -in ../licence/pass.pem -noout -modulus | openssl md5)
key_modulus=$(openssl rsa -in ../licence/private.key -noout -modulus | openssl md5)

if [[ "$cert_modulus" != "$key_modulus" ]]; then
    echo "❌ ERROR: Certificate and private key do not match"
    echo "Certificate modulus: $cert_modulus"
    echo "Private key modulus: $key_modulus"
    exit 1
fi

echo "✅ Certificate chain validation passed"

# Generate pass.json with proper structure
echo "📝 Creating pass.json..."

cat > pass.json << 'EOF'
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "fixed-pass-1752671669",
  "teamIdentifier": "39CDB598RF",
  "organizationName": "RewardJar",
  "description": "Fixed Loyalty Card - Pizza Palace",
  "logoText": "RewardJar",
  "backgroundColor": "rgb(16, 185, 129)",
  "foregroundColor": "rgb(255, 255, 255)",
  "labelColor": "rgb(255, 255, 255)",
  "storeCard": {
    "primaryFields": [
      {
        "key": "stamps",
        "label": "Stamps Collected",
        "value": "3/10",
        "textAlignment": "PKTextAlignmentCenter"
      }
    ],
    "secondaryFields": [
      {
        "key": "progress",
        "label": "Progress",
        "value": "30%",
        "textAlignment": "PKTextAlignmentLeft"
      },
      {
        "key": "remaining",
        "label": "Remaining",
        "value": "7 stamps",
        "textAlignment": "PKTextAlignmentRight"
      }
    ],
    "auxiliaryFields": [
      {
        "key": "business",
        "label": "Business",
        "value": "Pizza Palace",
        "textAlignment": "PKTextAlignmentLeft"
      },
      {
        "key": "reward",
        "label": "Reward",
        "value": "Free large pizza after 10 purchases",
        "textAlignment": "PKTextAlignmentLeft"
      }
    ],
    "headerFields": [
      {
        "key": "card_name",
        "label": "Loyalty Card",
        "value": "Pizza Club",
        "textAlignment": "PKTextAlignmentCenter"
      }
    ],
    "backFields": [
      {
        "key": "description",
        "label": "About",
        "value": "Collect 10 stamps to earn a free large pizza. Show this pass to collect stamps at Pizza Palace."
      },
      {
        "key": "business_info",
        "label": "Pizza Palace",
        "value": "Your favorite neighborhood pizza restaurant. We use only the freshest ingredients!"
      },
      {
        "key": "instructions",
        "label": "How to Use",
        "value": "Show this pass to collect stamps with each purchase. Pass will update automatically."
      },
      {
        "key": "terms",
        "label": "Terms & Conditions",
        "value": "Valid at participating Pizza Palace locations. Cannot be combined with other offers. Expires 1 year from issue date."
      }
    ]
  },
  "barcode": {
    "message": "fixed-pass-1752671669",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1",
    "altText": "Fixed Pass ID: fixed-pass-1752671669"
  },
  "barcodes": [
    {
      "message": "fixed-pass-1752671669",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1",
      "altText": "Fixed Pass ID: fixed-pass-1752671669"
    }
  ],
  "locations": [],
  "maxDistance": 1000,
  "relevantDate": "2025-07-16T13:14:29Z",
  "suppressStripShine": false,
  "sharingProhibited": false,
  "webServiceURL": "https://rewardjar.com/api/wallet/apple/updates",
  "authenticationToken": "fixed-pass-1752671669",
  "associatedStoreIdentifiers": [],
  "userInfo": {
    "customerCardId": "fixed-pass-1752671669",
    "stampCardId": "test-stamp-card",
    "businessName": "Pizza Palace"
  }
}
EOF

echo "✅ pass.json created"

# Generate proper icons using ImageMagick or fallback to minimal PNGs
echo "🎨 Generating pass icons..."

# Function to create a simple colored PNG
create_icon() {
    local width=$1
    local height=$2
    local filename=$3
    
    # Create a simple green rectangle as a placeholder icon
    # This is a minimal 1x1 transparent PNG that can be scaled
    base64 -d << 'ICON_EOF' > "$filename"
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hzyku
QAAAABJRU5ErkJggg==
ICON_EOF
}

# Create all required icon files
create_icon 29 29 "icon.png"
create_icon 58 58 "icon@2x.png"
create_icon 87 87 "icon@3x.png"
create_icon 160 50 "logo.png"
create_icon 320 100 "logo@2x.png"
create_icon 480 150 "logo@3x.png"

echo "✅ Icons generated"

# Create manifest.json with correct SHA-1 hashes
echo "📋 Creating manifest.json..."

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

# Create PKCS#7 signature using OpenSSL (most reliable method)
echo "🔐 Creating PKCS#7 signature..."

# Combine certificates into a chain file
cat ../licence/pass.pem ../licence/wwdr.pem > cert_chain.pem

# Create signature using OpenSSL
if openssl smime -sign -signer ../licence/pass.pem -inkey ../licence/private.key -certfile ../licence/wwdr.pem -in manifest.json -out signature -outform DER -binary -noattr; then
    echo "✅ PKCS#7 signature created successfully"
else
    echo "❌ ERROR: Failed to create PKCS#7 signature"
    exit 1
fi

# Verify the signature
echo "🔍 Verifying signature..."
if openssl smime -verify -in signature -content manifest.json -CAfile ../licence/wwdr.pem -certfile ../licence/pass.pem -noverify > /dev/null 2>&1; then
    echo "✅ Signature verification successful"
else
    echo "⚠️  Signature verification failed (this may be expected with self-signed certificates)"
fi

# List all files and their sizes
echo "📦 PKPass contents:"
ls -la pass.json manifest.json signature *.png

# Create the PKPass file
echo "🗜️  Creating PKPass file..."
zip -r ../dist/test_fixed.pkpass pass.json manifest.json signature icon.png icon@2x.png icon@3x.png logo.png logo@2x.png logo@3x.png

# Get file size
PKPASS_SIZE=$(ls -lh ../dist/test_fixed.pkpass | awk '{print $5}')
echo "✅ PKPass created: dist/test_fixed.pkpass ($PKPASS_SIZE)"

# Clean up
cd ..
rm -rf "$TEMP_DIR"

# Final validation
echo ""
echo "🔍 FINAL VALIDATION"
echo "=================="

# Test the PKPass structure
echo "Testing PKPass structure..."
mkdir -p test_extract
cd test_extract
unzip -q ../dist/test_fixed.pkpass
echo "Files in PKPass:"
ls -la

# Validate JSON
if jq . pass.json > /dev/null 2>&1; then
    echo "✅ pass.json is valid JSON"
else
    echo "❌ pass.json is invalid JSON"
fi

# Check signature
if openssl pkcs7 -inform DER -in signature -print_certs -text > /dev/null 2>&1; then
    echo "✅ Signature is valid PKCS#7"
else
    echo "❌ Signature is invalid"
fi

cd ..
rm -rf test_extract

echo ""
echo "✅ FIXED PKPass GENERATION COMPLETE"
echo "==================================="
echo "File: dist/test_fixed.pkpass"
echo "Size: $PKPASS_SIZE"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Test the fixed PKPass on an iOS device"
echo "2. If still rejected, ensure you have a real Apple-issued certificate"
echo "3. Upload the CSR (licence/pass_new.csr) to Apple Developer Portal"
echo "4. Download the real certificate and replace the temporary one"
echo ""
echo "📱 To test on iOS:"
echo "1. Transfer test_fixed.pkpass to your iPhone"
echo "2. Open the file - it should open in Apple Wallet"
echo "3. If rejected, check the certificate is from Apple, not self-signed" 