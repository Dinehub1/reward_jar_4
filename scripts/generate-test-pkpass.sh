#!/bin/bash

# Generate Test PKPass Script
# This script creates a complete test PKPass file using temporary certificates

echo "🎫 Apple Wallet Test PKPass Generator"
echo "===================================="

LICENCE_DIR="licence"
DIST_DIR="dist"

# Create directories
mkdir -p "$DIST_DIR"

# Check if we have the required certificates
if [ ! -f "$LICENCE_DIR/pass_temp.pem" ] || [ ! -f "$LICENCE_DIR/private.key" ] || [ ! -f "$LICENCE_DIR/wwdr.pem" ]; then
    echo "❌ Missing required certificates. Please run:"
    echo "   bash scripts/reconstruct-private-key.sh"
    exit 1
fi

echo ""
echo "📝 Step 1: Creating pass.json"
echo "-----------------------------"

# Generate comprehensive pass.json
cat > "$DIST_DIR/pass.json" << EOF
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "test-pass-$(date +%s)",
  "teamIdentifier": "39CDB598RF",
  "organizationName": "RewardJar",
  "description": "Test Loyalty Card - Pizza Palace",
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
    "message": "test-pass-$(date +%s)",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1",
    "altText": "Test Pass ID: test-pass-$(date +%s)"
  },
  "barcodes": [
    {
      "message": "test-pass-$(date +%s)",
      "format": "PKBarcodeFormatQR",
      "messageEncoding": "iso-8859-1",
      "altText": "Test Pass ID: test-pass-$(date +%s)"
    }
  ],
  "locations": [],
  "maxDistance": 1000,
  "relevantDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "webServiceURL": "https://rewardjar.com/api/wallet/apple/updates",
  "authenticationToken": "test-pass-$(date +%s)"
}
EOF

echo "✅ pass.json created ($(wc -c < "$DIST_DIR/pass.json") bytes)"

echo ""
echo "🎨 Step 2: Generating placeholder icons"
echo "--------------------------------------"

# Create simple placeholder icons using base64 encoded minimal PNG
# This is a 1x1 green pixel PNG
GREEN_PIXEL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9hKkVwAAAABJRU5ErkJggg=="

# Create all required icon files
echo "$GREEN_PIXEL" | base64 -d > "$DIST_DIR/icon.png"
echo "$GREEN_PIXEL" | base64 -d > "$DIST_DIR/icon@2x.png"
echo "$GREEN_PIXEL" | base64 -d > "$DIST_DIR/icon@3x.png"
echo "$GREEN_PIXEL" | base64 -d > "$DIST_DIR/logo.png"
echo "$GREEN_PIXEL" | base64 -d > "$DIST_DIR/logo@2x.png"
echo "$GREEN_PIXEL" | base64 -d > "$DIST_DIR/logo@3x.png"

echo "✅ Generated 6 placeholder icons"

echo ""
echo "📋 Step 3: Creating manifest.json with SHA1 hashes"
echo "--------------------------------------------------"

# Create manifest.json with SHA1 hashes
cat > "$DIST_DIR/manifest.json" << EOF
{
  "pass.json": "$(openssl sha1 "$DIST_DIR/pass.json" | cut -d' ' -f2)",
  "icon.png": "$(openssl sha1 "$DIST_DIR/icon.png" | cut -d' ' -f2)",
  "icon@2x.png": "$(openssl sha1 "$DIST_DIR/icon@2x.png" | cut -d' ' -f2)",
  "icon@3x.png": "$(openssl sha1 "$DIST_DIR/icon@3x.png" | cut -d' ' -f2)",
  "logo.png": "$(openssl sha1 "$DIST_DIR/logo.png" | cut -d' ' -f2)",
  "logo@2x.png": "$(openssl sha1 "$DIST_DIR/logo@2x.png" | cut -d' ' -f2)",
  "logo@3x.png": "$(openssl sha1 "$DIST_DIR/logo@3x.png" | cut -d' ' -f2)"
}
EOF

echo "✅ manifest.json created with SHA1 hashes"

echo ""
echo "🔐 Step 4: Creating PKCS#7 signature"
echo "-----------------------------------"

# Create PKCS#7 signature
echo "Signing manifest.json with temporary certificate..."
openssl smime -sign \
    -signer "$LICENCE_DIR/pass_temp.pem" \
    -inkey "$LICENCE_DIR/private.key" \
    -certfile "$LICENCE_DIR/wwdr.pem" \
    -in "$DIST_DIR/manifest.json" \
    -out "$DIST_DIR/signature" \
    -outform DER \
    -binary \
    -noattr

echo "✅ PKCS#7 signature created ($(wc -c < "$DIST_DIR/signature") bytes)"

echo ""
echo "🔍 Step 5: Verifying signature"
echo "-----------------------------"

# Verify signature
if openssl smime -verify \
    -in "$DIST_DIR/signature" \
    -inform DER \
    -content "$DIST_DIR/manifest.json" \
    -CAfile "$LICENCE_DIR/wwdr.pem" \
    -noverify > /dev/null 2>&1; then
    echo "✅ Signature verification successful"
    SIGNATURE_VALID=true
else
    echo "❌ Signature verification failed"
    SIGNATURE_VALID=false
fi

echo ""
echo "📦 Step 6: Creating PKPass ZIP file"
echo "----------------------------------"

# Create PKPass ZIP file
cd "$DIST_DIR"
zip -r test.pkpass pass.json manifest.json signature icon.png icon@2x.png icon@3x.png logo.png logo@2x.png logo@3x.png > /dev/null 2>&1
cd ..

if [ -f "$DIST_DIR/test.pkpass" ]; then
    echo "✅ PKPass created: $DIST_DIR/test.pkpass ($(wc -c < "$DIST_DIR/test.pkpass") bytes)"
    PKPASS_CREATED=true
else
    echo "❌ Failed to create PKPass file"
    PKPASS_CREATED=false
fi

echo ""
echo "📋 Step 7: PKPass structure validation"
echo "------------------------------------"

if [ "$PKPASS_CREATED" = true ]; then
    echo "PKPass Contents:"
    unzip -l "$DIST_DIR/test.pkpass"
    
    echo ""
    echo "File sizes:"
    echo "- pass.json: $(wc -c < "$DIST_DIR/pass.json") bytes"
    echo "- manifest.json: $(wc -c < "$DIST_DIR/manifest.json") bytes"
    echo "- signature: $(wc -c < "$DIST_DIR/signature") bytes"
    echo "- Total PKPass: $(wc -c < "$DIST_DIR/test.pkpass") bytes"
fi

echo ""
echo "🧪 Step 8: Testing PKPass extraction"
echo "-----------------------------------"

# Test PKPass extraction
if [ "$PKPASS_CREATED" = true ]; then
    mkdir -p "$DIST_DIR/test_extract"
    cd "$DIST_DIR/test_extract"
    
    if unzip -o "../test.pkpass" > /dev/null 2>&1; then
        echo "✅ PKPass extraction successful"
        
        # Verify all files are present
        REQUIRED_FILES=("pass.json" "manifest.json" "signature" "icon.png" "icon@2x.png" "icon@3x.png" "logo.png" "logo@2x.png" "logo@3x.png")
        MISSING_FILES=()
        
        for file in "${REQUIRED_FILES[@]}"; do
            if [ ! -f "$file" ]; then
                MISSING_FILES+=("$file")
            fi
        done
        
        if [ ${#MISSING_FILES[@]} -eq 0 ]; then
            echo "✅ All required files present in PKPass"
            STRUCTURE_VALID=true
        else
            echo "❌ Missing files: ${MISSING_FILES[*]}"
            STRUCTURE_VALID=false
        fi
    else
        echo "❌ PKPass extraction failed"
        STRUCTURE_VALID=false
    fi
    
    cd ../..
    rm -rf "$DIST_DIR/test_extract"
else
    STRUCTURE_VALID=false
fi

echo ""
echo "📊 FINAL SUMMARY"
echo "================"
echo "Pass JSON Created: ✅"
echo "Icons Generated: ✅"
echo "Manifest Created: ✅"
echo "Signature Valid: $([ "$SIGNATURE_VALID" = true ] && echo "✅" || echo "❌")"
echo "PKPass Created: $([ "$PKPASS_CREATED" = true ] && echo "✅" || echo "❌")"
echo "Structure Valid: $([ "$STRUCTURE_VALID" = true ] && echo "✅" || echo "❌")"

if [ "$SIGNATURE_VALID" = true ] && [ "$PKPASS_CREATED" = true ] && [ "$STRUCTURE_VALID" = true ]; then
    echo ""
    echo "🎉 SUCCESS! Test PKPass generated successfully!"
    echo ""
    echo "📁 Generated Files:"
    echo "- $DIST_DIR/test.pkpass (Ready for iOS testing)"
    echo "- $DIST_DIR/pass.json (Pass data)"
    echo "- $DIST_DIR/manifest.json (File hashes)"
    echo "- $DIST_DIR/signature (PKCS#7 signature)"
    echo "- $DIST_DIR/icon*.png (Placeholder icons)"
    echo "- $DIST_DIR/logo*.png (Placeholder logos)"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. 📱 Test the PKPass on an iOS device"
    echo "2. 🌐 Get real certificate from Apple Developer Portal"
    echo "3. 🔄 Replace temporary certificate with real one"
    echo "4. 🚀 Deploy to production"
    echo ""
    echo "⚠️  Note: This uses a temporary self-signed certificate."
    echo "   For production, you need a real Apple certificate."
    
    # Generate base64 encoded certificates for environment variables
    echo ""
    echo "🔑 Environment Variables (Base64 Encoded):"
    echo "APPLE_CERT_BASE64=$(base64 -i "$LICENCE_DIR/pass_temp.pem" | tr -d '\n')"
    echo "APPLE_KEY_BASE64=$(base64 -i "$LICENCE_DIR/private.key" | tr -d '\n')"
    echo "APPLE_WWDR_BASE64=$(base64 -i "$LICENCE_DIR/wwdr.pem" | tr -d '\n')"
    
else
    echo ""
    echo "❌ FAILED! PKPass generation encountered issues."
    echo ""
    echo "🔧 Common Issues:"
    echo "- Certificate and private key mismatch"
    echo "- Missing certificate files"
    echo "- Invalid signature generation"
    echo ""
    echo "💡 Solutions:"
    echo "1. Run: bash scripts/reconstruct-private-key.sh"
    echo "2. Verify all certificate files exist"
    echo "3. Check OpenSSL version compatibility"
fi

echo ""
echo "🎫 Test PKPass Generation Complete"
echo "=================================" 