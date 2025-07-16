#!/bin/bash

# Apple Wallet Private Key Reconstruction Script
# This script attempts to work with the existing certificate and CSR

echo "🔧 Apple Wallet Private Key Reconstruction"
echo "=========================================="

CERT_DIR="licence and cetifi"
LICENCE_DIR="licence"

# Create directories
mkdir -p "$LICENCE_DIR"

echo ""
echo "📋 Step 1: Analyzing existing certificate and CSR"
echo "------------------------------------------------"

# Convert certificate to PEM
echo "Converting certificate to PEM format..."
openssl x509 -inform DER -in "$CERT_DIR/pass.cer" -out "$LICENCE_DIR/pass.pem"

# Convert WWDR certificate to PEM
echo "Converting WWDR certificate to PEM format..."
openssl x509 -inform DER -in "$CERT_DIR/AppleWWDRCAG3.cer" -out "$LICENCE_DIR/wwdr.pem"

echo "✅ Certificates converted to PEM format"

# Extract public key from certificate
echo ""
echo "🔍 Extracting public key from certificate..."
openssl x509 -in "$LICENCE_DIR/pass.pem" -pubkey -noout > "$LICENCE_DIR/cert_public.key"

# Extract public key from CSR
echo "🔍 Extracting public key from CSR..."
openssl req -in "$CERT_DIR/pass.certSigningRequest" -pubkey -noout > "$LICENCE_DIR/csr_public.key"

# Compare public keys
echo ""
echo "🔗 Comparing public keys..."
CERT_PUB_HASH=$(openssl dgst -sha256 "$LICENCE_DIR/cert_public.key" | cut -d' ' -f2)
CSR_PUB_HASH=$(openssl dgst -sha256 "$LICENCE_DIR/csr_public.key" | cut -d' ' -f2)

echo "Certificate public key hash: $CERT_PUB_HASH"
echo "CSR public key hash: $CSR_PUB_HASH"

if [ "$CERT_PUB_HASH" = "$CSR_PUB_HASH" ]; then
    echo "✅ Public keys match! Certificate was generated from this CSR."
    PUBLIC_KEYS_MATCH=true
else
    echo "❌ Public keys don't match. Certificate was not generated from this CSR."
    PUBLIC_KEYS_MATCH=false
fi

echo ""
echo "📊 Certificate Details:"
echo "---------------------"
openssl x509 -in "$LICENCE_DIR/pass.pem" -noout -subject -dates -issuer

echo ""
echo "📊 CSR Details:"
echo "--------------"
openssl req -in "$CERT_DIR/pass.certSigningRequest" -noout -subject

echo ""
echo "🔄 Step 2: Generating matching private key"
echo "-----------------------------------------"

if [ "$PUBLIC_KEYS_MATCH" = true ]; then
    echo "Since the certificate matches the CSR, we need to generate a new private key"
    echo "that will require getting a new certificate from Apple."
else
    echo "Since the certificate doesn't match the CSR, we definitely need new keys."
fi

# Generate new private key
echo "Generating new RSA private key..."
openssl genpkey -algorithm RSA -out "$LICENCE_DIR/private.key" -pkcs8

echo "✅ New private key generated"

# Generate new CSR with the new private key
echo ""
echo "📝 Generating new CSR with new private key..."
openssl req -new -key "$LICENCE_DIR/private.key" -out "$LICENCE_DIR/pass_new.csr" \
    -subj "/UID=pass.com.rewardjar.rewards/CN=Pass Type ID: pass.com.rewardjar.rewards/OU=39CDB598RF/O=Jaydeep Kukreja/C=US"

echo "✅ New CSR generated"

# Verify new key and CSR match
echo ""
echo "🔍 Verifying new key and CSR match..."
NEW_KEY_MODULUS=$(openssl rsa -noout -modulus -in "$LICENCE_DIR/private.key" | openssl md5)
NEW_CSR_MODULUS=$(openssl req -noout -modulus -in "$LICENCE_DIR/pass_new.csr" | openssl md5)

echo "New private key modulus: $NEW_KEY_MODULUS"
echo "New CSR modulus: $NEW_CSR_MODULUS"

if [ "$NEW_KEY_MODULUS" = "$NEW_CSR_MODULUS" ]; then
    echo "✅ New private key and CSR match perfectly!"
else
    echo "❌ Error: New private key and CSR don't match!"
    exit 1
fi

echo ""
echo "🎯 Step 3: Creating temporary self-signed certificate for testing"
echo "---------------------------------------------------------------"

# Create temporary self-signed certificate for testing
echo "Creating temporary self-signed certificate..."
openssl x509 -req -in "$LICENCE_DIR/pass_new.csr" -signkey "$LICENCE_DIR/private.key" \
    -out "$LICENCE_DIR/pass_temp.pem" -days 365

echo "✅ Temporary certificate created for testing"

# Verify temporary certificate matches private key
TEMP_CERT_MODULUS=$(openssl x509 -noout -modulus -in "$LICENCE_DIR/pass_temp.pem" | openssl md5)
echo ""
echo "🔍 Verifying temporary certificate matches private key..."
echo "Temporary certificate modulus: $TEMP_CERT_MODULUS"
echo "Private key modulus: $NEW_KEY_MODULUS"

if [ "$TEMP_CERT_MODULUS" = "$NEW_KEY_MODULUS" ]; then
    echo "✅ Temporary certificate and private key match!"
    TEMP_CERT_MATCHES=true
else
    echo "❌ Temporary certificate and private key don't match!"
    TEMP_CERT_MATCHES=false
fi

echo ""
echo "🧪 Step 4: Testing PKCS#7 signature with temporary certificate"
echo "------------------------------------------------------------"

if [ "$TEMP_CERT_MATCHES" = true ]; then
    # Create test manifest
    echo '{"test": "manifest"}' > "$LICENCE_DIR/test_manifest.json"
    
    # Create signature
    echo "Creating test signature..."
    openssl smime -sign \
        -signer "$LICENCE_DIR/pass_temp.pem" \
        -inkey "$LICENCE_DIR/private.key" \
        -certfile "$LICENCE_DIR/wwdr.pem" \
        -in "$LICENCE_DIR/test_manifest.json" \
        -out "$LICENCE_DIR/test_signature" \
        -outform DER \
        -binary \
        -noattr
    
    # Verify signature
    echo "Verifying test signature..."
    if openssl smime -verify \
        -in "$LICENCE_DIR/test_signature" \
        -inform DER \
        -content "$LICENCE_DIR/test_manifest.json" \
        -CAfile "$LICENCE_DIR/wwdr.pem" \
        -noverify > /dev/null 2>&1; then
        echo "✅ Test signature verification successful!"
        SIGNATURE_WORKS=true
    else
        echo "❌ Test signature verification failed!"
        SIGNATURE_WORKS=false
    fi
    
    # Cleanup test files
    rm -f "$LICENCE_DIR/test_manifest.json" "$LICENCE_DIR/test_signature"
else
    SIGNATURE_WORKS=false
fi

echo ""
echo "📊 RECONSTRUCTION SUMMARY"
echo "========================"
echo "Certificate-CSR Match: $([ "$PUBLIC_KEYS_MATCH" = true ] && echo "✅" || echo "❌")"
echo "New Key Generated: ✅"
echo "New CSR Generated: ✅"
echo "Temporary Certificate: $([ "$TEMP_CERT_MATCHES" = true ] && echo "✅" || echo "❌")"
echo "Signature Test: $([ "$SIGNATURE_WORKS" = true ] && echo "✅" || echo "❌")"

echo ""
echo "📁 Generated Files:"
echo "=================="
echo "- $LICENCE_DIR/pass.pem (Current Apple certificate)"
echo "- $LICENCE_DIR/wwdr.pem (WWDR certificate)"
echo "- $LICENCE_DIR/private.key (New private key)"
echo "- $LICENCE_DIR/pass_new.csr (New CSR for Apple)"
echo "- $LICENCE_DIR/pass_temp.pem (Temporary test certificate)"

echo ""
echo "📋 NEXT STEPS:"
echo "============="
echo "1. 🌐 Go to Apple Developer Portal:"
echo "   https://developer.apple.com/account/resources/certificates/list"
echo ""
echo "2. 📤 Upload the new CSR:"
echo "   File: $LICENCE_DIR/pass_new.csr"
echo ""
echo "3. 📥 Download new certificate as 'pass_new.cer'"
echo ""
echo "4. 🔄 Replace current certificate:"
echo "   mv pass_new.cer $CERT_DIR/pass.cer"
echo ""
echo "5. 🚀 Run the main certificate refresh script:"
echo "   bash scripts/refresh-apple-wallet-certificates.sh"

echo ""
echo "🔧 Private Key Reconstruction Complete"
echo "=====================================" 