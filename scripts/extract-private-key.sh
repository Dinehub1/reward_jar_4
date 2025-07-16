#!/bin/bash

# Private Key Extraction Script for Apple Wallet Certificate
# This script attempts to find or generate the private key needed for the certificate

echo "🔑 Apple Wallet Private Key Extraction"
echo "======================================"

CERT_DIR="licence and cetifi"
LICENCE_DIR="licence"

# Create directories
mkdir -p "$LICENCE_DIR"

echo ""
echo "🔍 Step 1: Searching for existing private key"
echo "--------------------------------------------"

# Check if we have the private key from previous analysis
if [ -f "$CERT_DIR/pass.key" ]; then
    echo "✅ Found existing private key: $CERT_DIR/pass.key"
    cp "$CERT_DIR/pass.key" "$LICENCE_DIR/private.key"
    echo "Private key copied to: $LICENCE_DIR/private.key"
    
    # Check if it matches the certificate
    echo ""
    echo "🔗 Verifying key-certificate match..."
    
    # Convert certificate to PEM if needed
    if [ ! -f "$LICENCE_DIR/pass.pem" ]; then
        openssl x509 -inform DER -in "$CERT_DIR/pass.cer" -out "$LICENCE_DIR/pass.pem"
    fi
    
    CERT_MODULUS=$(openssl x509 -noout -modulus -in "$LICENCE_DIR/pass.pem" | openssl md5)
    KEY_MODULUS=$(openssl rsa -noout -modulus -in "$LICENCE_DIR/private.key" 2>/dev/null | openssl md5)
    
    echo "Certificate modulus: $CERT_MODULUS"
    echo "Private key modulus: $KEY_MODULUS"
    
    if [ "$CERT_MODULUS" = "$KEY_MODULUS" ]; then
        echo "✅ Certificate and private key match!"
        exit 0
    else
        echo "❌ Certificate and private key DO NOT match!"
        echo "The existing key cannot be used with this certificate."
    fi
else
    echo "❌ No existing private key found"
fi

echo ""
echo "🔄 Step 2: Generating new private key"
echo "------------------------------------"

echo "Since we don't have the matching private key, we need to generate a new one."
echo "This will require getting a new certificate from Apple Developer Portal."

# Generate new private key
echo "Generating new RSA private key..."
openssl genpkey -algorithm RSA -out "$LICENCE_DIR/private.key" -pkcs8

echo "✅ New private key generated: $LICENCE_DIR/private.key"

# Generate new CSR
echo ""
echo "📝 Generating new Certificate Signing Request..."
openssl req -new -key "$LICENCE_DIR/private.key" -out "$LICENCE_DIR/pass_new.csr" -subj "/UID=pass.com.rewardjar.rewards/CN=Pass Type ID: pass.com.rewardjar.rewards/OU=39CDB598RF/O=Jaydeep Kukreja/C=US"

echo "✅ New CSR generated: $LICENCE_DIR/pass_new.csr"

echo ""
echo "📋 Next Steps Required:"
echo "======================"
echo "1. 🌐 Go to Apple Developer Portal:"
echo "   https://developer.apple.com/account/resources/certificates/list"
echo ""
echo "2. 📤 Upload the new CSR:"
echo "   - Click '+' to create new certificate"
echo "   - Select 'Pass Type ID Certificate'"
echo "   - Upload: $LICENCE_DIR/pass_new.csr"
echo ""
echo "3. 📥 Download the new certificate:"
echo "   - Save as: pass_new.cer"
echo "   - Place in: $CERT_DIR/"
echo ""
echo "4. 🔄 Re-run the certificate refresh script:"
echo "   bash scripts/refresh-apple-wallet-certificates.sh"

echo ""
echo "⚠️  Important Notes:"
echo "==================="
echo "- The current certificate (pass.cer) cannot be used without its original private key"
echo "- You'll need to get a new certificate from Apple using the new CSR"
echo "- Update your Pass Type ID registration if needed"
echo "- The new certificate will have the same Pass Type ID: pass.com.rewardjar.rewards"

echo ""
echo "🔑 Private Key Generation Complete"
echo "==================================" 