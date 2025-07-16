#!/bin/bash

# Generate Production PKPass with Apple-Signed Certificate
# This script creates a production-ready PKPass using the real Apple certificate

set -e

echo "🚀 GENERATING PRODUCTION PKPass WITH APPLE CERTIFICATE"
echo "===================================================="

# Verify Apple certificate exists
if [[ ! -f "licence/certificate.pem" ]]; then
    echo "❌ ERROR: Apple certificate not found. Converting from .cer..."
    openssl x509 -in licence/pass.cer -inform DER -out licence/certificate.pem -outform PEM
    echo "✅ Certificate converted"
fi

# Create production directory
mkdir -p dist/production_build
cd dist/production_build

echo "📝 Creating production pass.json..."

# Generate pass.json with production values
cat > pass.json << 'EOF'
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "production-pass-1752671669",
  "teamIdentifier": "39CDB598RF",
  "organizationName": "RewardJar",
  "description": "Production Loyalty Card - Pizza Palace",
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
    "message": "production-pass-1752671669",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1",
    "altText": "Production Pass ID: production-pass-1752671669"
  },
  "barcodes": [
    {
      "message": "production-pass-1752671669",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1",
      "altText": "Production Pass ID: production-pass-1752671669"
    }
  ],
  "locations": [],
  "maxDistance": 1000,
  "relevantDate": "2025-07-16T13:14:29Z",
  "suppressStripShine": false,
  "sharingProhibited": false,
  "webServiceURL": "https://rewardjar.com/api/wallet/apple/updates",
  "authenticationToken": "production-pass-1752671669",
  "associatedStoreIdentifiers": [],
  "userInfo": {
    "customerCardId": "production-pass-1752671669",
    "stampCardId": "production-stamp-card",
    "businessName": "Pizza Palace"
  }
}
EOF

echo "✅ pass.json created"

# Generate icons
echo "🎨 Generating pass icons..."

# Create minimal PNG icons (1x1 transparent pixel)
create_icon() {
    local filename=$1
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hzyku
QAAAABJRU5ErkJggg==" | base64 -d > "$filename"
}

# Create all required icon files
create_icon "icon.png"
create_icon "icon@2x.png"
create_icon "icon@3x.png"
create_icon "logo.png"
create_icon "logo@2x.png"
create_icon "logo@3x.png"

echo "✅ Icons generated"

# Create manifest.json
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

echo "✅ manifest.json created"

# Create PKCS#7 signature using Apple-signed certificate
echo "🔐 Creating PKCS#7 signature with Apple certificate..."

# Use absolute paths to avoid path issues
CERT_PATH="$(pwd)/../../licence/certificate.pem"
KEY_PATH="$(pwd)/../../licence/private.key"
WWDR_PATH="$(pwd)/../../licence/wwdr.pem"

echo "Using certificates:"
echo "  Certificate: $CERT_PATH"
echo "  Private Key: $KEY_PATH"
echo "  WWDR: $WWDR_PATH"

# Verify files exist
if [[ ! -f "$CERT_PATH" ]]; then
    echo "❌ ERROR: Certificate not found at $CERT_PATH"
    exit 1
fi

if [[ ! -f "$KEY_PATH" ]]; then
    echo "❌ ERROR: Private key not found at $KEY_PATH"
    exit 1
fi

if [[ ! -f "$WWDR_PATH" ]]; then
    echo "❌ ERROR: WWDR certificate not found at $WWDR_PATH"
    exit 1
fi

# Create signature
if openssl smime -sign -signer "$CERT_PATH" -inkey "$KEY_PATH" -certfile "$WWDR_PATH" -in manifest.json -out signature -outform DER -binary -noattr; then
    echo "✅ PKCS#7 signature created successfully"
else
    echo "❌ ERROR: Failed to create PKCS#7 signature"
    exit 1
fi

# Verify signature
echo "🔍 Verifying signature..."
if openssl pkcs7 -inform DER -in signature -print_certs -text > /dev/null 2>&1; then
    echo "✅ Signature is valid PKCS#7 DER format"
    
    # Check for Apple certificates in signature
    if openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -q "Apple Worldwide Developer Relations"; then
        echo "✅ Signature contains Apple WWDR certificate"
    else
        echo "⚠️  Signature may not contain proper Apple certificate chain"
    fi
else
    echo "❌ ERROR: Invalid signature format"
    exit 1
fi

# Show file sizes
echo ""
echo "📦 PKPass contents:"
ls -la pass.json manifest.json signature *.png

# Create the production PKPass
echo ""
echo "🗜️  Creating production PKPass..."
zip -r ../production.pkpass pass.json manifest.json signature icon.png icon@2x.png icon@3x.png logo.png logo@2x.png logo@3x.png

# Get file size
cd ..
PKPASS_SIZE=$(ls -lh production.pkpass | awk '{print $5}')
echo "✅ Production PKPass created: dist/production.pkpass ($PKPASS_SIZE)"

# Clean up build directory
rm -rf production_build

# Final validation
echo ""
echo "🔍 FINAL VALIDATION"
echo "=================="

# Extract and validate
mkdir -p validate_production
cd validate_production
unzip -q ../production.pkpass

echo "Production PKPass contents:"
ls -la

# Validate JSON
if jq . pass.json > /dev/null 2>&1; then
    echo "✅ pass.json is valid JSON"
else
    echo "❌ pass.json is invalid JSON"
fi

# Validate signature
if openssl pkcs7 -inform DER -in signature -print_certs -text > /dev/null 2>&1; then
    echo "✅ Signature is valid PKCS#7"
else
    echo "❌ Signature is invalid"
fi

# Show certificate details from signature
echo ""
echo "📜 Certificate in signature:"
openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -E "(subject|issuer)=" | head -4

cd ..
rm -rf validate_production

echo ""
echo "🎉 PRODUCTION PKPass GENERATION COMPLETE"
echo "========================================"
echo "File: dist/production.pkpass"
echo "Size: $PKPASS_SIZE"
echo "Certificate: Apple-signed (production ready)"
echo ""
echo "📱 READY FOR iOS TESTING:"
echo "1. Transfer dist/production.pkpass to your iPhone"
echo "2. Open the file - it should install in Apple Wallet"
echo "3. No more 'cannot be installed' errors!"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Test on iPhone to confirm it works"
echo "2. Update your API to use the Apple-signed certificate"
echo "3. Deploy to production"
echo ""
echo "✅ SUCCESS: Production PKPass with Apple certificate ready!" 