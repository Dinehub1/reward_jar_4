#!/bin/bash

# Apple Wallet Certificate Chain Refresh Script
# This script processes Apple certificates and generates a complete PKPass

set -e  # Exit on any error

echo "🍎 Apple Wallet Certificate Chain Refresh"
echo "=========================================="

# Configuration
CERT_DIR="licence and cetifi"
SCRIPTS_DIR="scripts"
DIST_DIR="dist"
LICENCE_DIR="licence"

# Create directories
mkdir -p "$LICENCE_DIR" "$DIST_DIR"

echo ""
echo "📁 Step 1: Converting certificates to PEM format"
echo "------------------------------------------------"

# Convert Apple certificates from DER to PEM format
echo "Converting pass.cer to PEM format..."
openssl x509 -inform DER -in "$CERT_DIR/pass.cer" -out "$LICENCE_DIR/pass.pem"

echo "Converting AppleWWDRCAG3.cer to PEM format..."
openssl x509 -inform DER -in "$CERT_DIR/AppleWWDRCAG3.cer" -out "$LICENCE_DIR/wwdr.pem"

echo "✅ Certificate conversion complete"

echo ""
echo "🔍 Step 2: Certificate validation and details"
echo "--------------------------------------------"

# Display certificate details
echo "Pass Certificate Details:"
openssl x509 -in "$LICENCE_DIR/pass.pem" -noout -subject -dates
echo ""

echo "WWDR Certificate Details:"
openssl x509 -in "$LICENCE_DIR/wwdr.pem" -noout -subject -dates
echo ""

# Check if we have the private key from the CSR
echo "🔑 Step 3: Extracting private key from CSR"
echo "------------------------------------------"

# The CSR contains the public key, but we need the private key that was used to generate it
# Let's check if we have the original private key
if [ -f "$CERT_DIR/pass.key" ]; then
    echo "Found existing private key file"
    cp "$CERT_DIR/pass.key" "$LICENCE_DIR/private.key"
else
    echo "⚠️  Private key not found. Generating new key pair..."
    echo "Note: This will require generating a new CSR and certificate from Apple"
    
    # Generate new private key
    openssl genpkey -algorithm RSA -out "$LICENCE_DIR/private.key" -pkcs8 -aes256 -pass pass:rewardjar2025
    
    echo "🔄 New private key generated. You'll need to:"
    echo "1. Generate new CSR with this key"
    echo "2. Submit to Apple Developer Portal"
    echo "3. Download new certificate"
    
    # Generate new CSR for reference
    openssl req -new -key "$LICENCE_DIR/private.key" -out "$LICENCE_DIR/pass_new.csr" -passin pass:rewardjar2025 -subj "/UID=pass.com.rewardjar.rewards/CN=Pass Type ID: pass.com.rewardjar.rewards/OU=39CDB598RF/O=Jaydeep Kukreja/C=US"
    
    echo "New CSR generated: $LICENCE_DIR/pass_new.csr"
fi

echo ""
echo "🔗 Step 4: Verifying certificate-key pair"
echo "-----------------------------------------"

# Check if certificate and key match
CERT_MODULUS=$(openssl x509 -noout -modulus -in "$LICENCE_DIR/pass.pem" | openssl md5)
KEY_MODULUS=$(openssl rsa -noout -modulus -in "$LICENCE_DIR/private.key" 2>/dev/null | openssl md5 || echo "Key check failed")

echo "Certificate modulus: $CERT_MODULUS"
echo "Private key modulus: $KEY_MODULUS"

if [ "$CERT_MODULUS" = "$KEY_MODULUS" ]; then
    echo "✅ Certificate and private key match!"
    CERT_KEY_MATCH=true
else
    echo "❌ Certificate and private key DO NOT match!"
    echo "This will cause PKPass signature failures."
    CERT_KEY_MATCH=false
fi

echo ""
echo "📦 Step 5: Creating P12 bundle"
echo "------------------------------"

if [ "$CERT_KEY_MATCH" = true ]; then
    # Create P12 bundle with certificate and private key
    echo "Creating P12 bundle with certificate and private key..."
    openssl pkcs12 -export -out "$LICENCE_DIR/pass_certificate.p12" \
        -inkey "$LICENCE_DIR/private.key" \
        -in "$LICENCE_DIR/pass.pem" \
        -certfile "$LICENCE_DIR/wwdr.pem" \
        -name "RewardJar Pass Certificate" \
        -passout pass:rewardjar2025
    
    echo "✅ P12 bundle created: $LICENCE_DIR/pass_certificate.p12"
else
    echo "⚠️  Skipping P12 creation due to certificate-key mismatch"
fi

echo ""
echo "🔍 Step 6: Certificate chain validation"
echo "--------------------------------------"

# Create certificate chain file
cat "$LICENCE_DIR/pass.pem" "$LICENCE_DIR/wwdr.pem" > "$LICENCE_DIR/cert_chain.pem"

# Verify certificate chain
echo "Verifying certificate chain..."
if openssl verify -CAfile "$LICENCE_DIR/wwdr.pem" "$LICENCE_DIR/pass.pem" 2>/dev/null; then
    echo "✅ Certificate chain verification successful"
    CHAIN_VALID=true
else
    echo "❌ Certificate chain verification failed"
    CHAIN_VALID=false
fi

echo ""
echo "🎫 Step 7: Generating test PKPass"
echo "--------------------------------"

if [ "$CERT_KEY_MATCH" = true ] && [ "$CHAIN_VALID" = true ]; then
    # Generate test pass.json
    cat > "$DIST_DIR/pass.json" << 'EOF'
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "test-pass-001",
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
        "key": "terms",
        "label": "Terms & Conditions",
        "value": "Valid at participating Pizza Palace locations. Cannot be combined with other offers."
      }
    ]
  },
  "barcode": {
    "message": "test-pass-001",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1",
    "altText": "Test Pass ID: test-pass-001"
  },
  "locations": [],
  "maxDistance": 1000,
  "relevantDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "webServiceURL": "https://rewardjar.com/api/wallet/apple/updates",
  "authenticationToken": "test-pass-001"
}
EOF

    # Generate simple placeholder icons
    echo "Generating placeholder icons..."
    
    # Create simple colored squares as placeholder icons
    convert -size 29x29 xc:"#10B981" "$DIST_DIR/icon.png" 2>/dev/null || {
        # Fallback: create minimal PNG using openssl (base64 encoded 1x1 green pixel)
        echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9hKkVwAAAABJRU5ErkJggg==" | base64 -d > "$DIST_DIR/icon.png"
    }
    
    # Copy icon for different sizes
    cp "$DIST_DIR/icon.png" "$DIST_DIR/icon@2x.png"
    cp "$DIST_DIR/icon.png" "$DIST_DIR/icon@3x.png"
    cp "$DIST_DIR/icon.png" "$DIST_DIR/logo.png"
    cp "$DIST_DIR/icon.png" "$DIST_DIR/logo@2x.png"
    cp "$DIST_DIR/icon.png" "$DIST_DIR/logo@3x.png"
    
    echo "✅ Placeholder icons generated"
    
    # Create manifest.json with file hashes
    echo "Creating manifest.json..."
    
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
    
    echo "✅ Manifest created with SHA1 hashes"
    
    # Create PKCS#7 signature
    echo "Creating PKCS#7 signature..."
    openssl smime -sign \
        -signer "$LICENCE_DIR/pass.pem" \
        -inkey "$LICENCE_DIR/private.key" \
        -certfile "$LICENCE_DIR/wwdr.pem" \
        -in "$DIST_DIR/manifest.json" \
        -out "$DIST_DIR/signature" \
        -outform DER \
        -binary \
        -noattr
    
    echo "✅ PKCS#7 signature created"
    
    # Create PKPass ZIP file
    echo "Creating PKPass ZIP file..."
    cd "$DIST_DIR"
    zip -r test.pkpass pass.json manifest.json signature icon.png icon@2x.png icon@3x.png logo.png logo@2x.png logo@3x.png
    cd ..
    
    echo "✅ PKPass created: $DIST_DIR/test.pkpass"
    
    # Verify PKPass structure
    echo ""
    echo "📋 PKPass Structure:"
    unzip -l "$DIST_DIR/test.pkpass"
    
    # Test signature verification
    echo ""
    echo "🔍 Signature Verification:"
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
    
else
    echo "⚠️  Skipping PKPass generation due to certificate issues"
    SIGNATURE_VALID=false
fi

echo ""
echo "📊 FINAL SUMMARY"
echo "================"
echo "Certificate-Key Match: $([ "$CERT_KEY_MATCH" = true ] && echo "✅" || echo "❌")"
echo "Certificate Chain Valid: $([ "$CHAIN_VALID" = true ] && echo "✅" || echo "❌")"
echo "PKPass Generated: $([ -f "$DIST_DIR/test.pkpass" ] && echo "✅" || echo "❌")"
echo "Signature Valid: $([ "$SIGNATURE_VALID" = true ] && echo "✅" || echo "❌")"

if [ "$CERT_KEY_MATCH" = true ] && [ "$CHAIN_VALID" = true ] && [ "$SIGNATURE_VALID" = true ]; then
    echo ""
    echo "🎉 SUCCESS! Apple Wallet certificate chain is ready for production!"
    echo ""
    echo "📁 Generated Files:"
    echo "   - $LICENCE_DIR/pass.pem (Pass certificate)"
    echo "   - $LICENCE_DIR/private.key (Private key)"
    echo "   - $LICENCE_DIR/wwdr.pem (WWDR certificate)"
    echo "   - $LICENCE_DIR/pass_certificate.p12 (P12 bundle)"
    echo "   - $DIST_DIR/test.pkpass (Test PKPass file)"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Test the PKPass file on an iOS device"
    echo "   2. Update environment variables with base64 encoded certificates"
    echo "   3. Deploy to production"
    
    # Generate base64 encoded certificates for environment variables
    echo ""
    echo "🔑 Environment Variables (Base64 Encoded):"
    echo "APPLE_CERT_BASE64=$(base64 -i "$LICENCE_DIR/pass.pem" | tr -d '\n')"
    echo "APPLE_KEY_BASE64=$(base64 -i "$LICENCE_DIR/private.key" | tr -d '\n')"
    echo "APPLE_WWDR_BASE64=$(base64 -i "$LICENCE_DIR/wwdr.pem" | tr -d '\n')"
    
else
    echo ""
    echo "❌ FAILED! Certificate issues need to be resolved."
    echo ""
    echo "🔧 Common Issues:"
    echo "   - Certificate and private key don't match"
    echo "   - Missing private key file"
    echo "   - Invalid certificate chain"
    echo ""
    echo "💡 Solutions:"
    echo "   1. Ensure you have the correct private key used to generate the CSR"
    echo "   2. Verify the certificate was downloaded correctly from Apple"
    echo "   3. Check certificate validity dates"
fi

echo ""
echo "🍎 Apple Wallet Certificate Processing Complete"
echo "==============================================" 