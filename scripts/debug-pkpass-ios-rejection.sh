#!/bin/bash

# Debug iOS PKPass Rejection Issues
# This script analyzes the current PKPass file and identifies issues causing iOS rejection

set -e

echo "🔍 DEBUGGING iOS PKPass REJECTION ISSUES"
echo "========================================"

# Setup directories
mkdir -p debug_pkpass_analysis
cd debug_pkpass_analysis

# Extract current PKPass
echo "📦 Extracting current PKPass file..."
unzip -o ../dist/test.pkpass
ls -la

echo ""
echo "📋 FILE ANALYSIS"
echo "================"

# Check file sizes
echo "File sizes:"
ls -lh pass.json manifest.json signature *.png

echo ""
echo "🔍 PASS.JSON VALIDATION"
echo "======================="

# Validate pass.json structure
echo "Checking pass.json structure..."
if ! jq . pass.json > /dev/null 2>&1; then
    echo "❌ ERROR: pass.json is not valid JSON"
    exit 1
else
    echo "✅ pass.json is valid JSON"
fi

# Check required fields
echo "Checking required fields..."
REQUIRED_FIELDS=(
    "formatVersion"
    "passTypeIdentifier"
    "serialNumber"
    "teamIdentifier"
    "organizationName"
    "description"
)

for field in "${REQUIRED_FIELDS[@]}"; do
    if jq -e ".$field" pass.json > /dev/null 2>&1; then
        value=$(jq -r ".$field" pass.json)
        echo "✅ $field: $value"
    else
        echo "❌ MISSING: $field"
    fi
done

# Check pass style
echo "Checking pass style..."
if jq -e ".storeCard" pass.json > /dev/null 2>&1; then
    echo "✅ Pass style: storeCard"
else
    echo "❌ MISSING: Pass style (storeCard, boardingPass, coupon, eventTicket, generic)"
fi

# Check barcode format
echo "Checking barcode format..."
if jq -e ".barcodes[0].format" pass.json > /dev/null 2>&1; then
    format=$(jq -r ".barcodes[0].format" pass.json)
    if [[ "$format" == "PKBarcodeFormatQR" ]]; then
        echo "✅ Barcode format: $format"
    else
        echo "⚠️  Barcode format: $format (should be PKBarcodeFormatQR)"
    fi
else
    echo "❌ MISSING: Barcode format"
fi

echo ""
echo "🔐 CERTIFICATE ANALYSIS"
echo "======================="

# Check certificates
echo "Checking certificate configuration..."
if [[ -f "../licence/pass_temp.pem" ]]; then
    echo "✅ Certificate file exists"
    
    # Check certificate validity
    echo "Certificate details:"
    openssl x509 -in ../licence/pass_temp.pem -noout -subject -dates
    
    # Check if certificate is expired
    if openssl x509 -in ../licence/pass_temp.pem -noout -checkend 0; then
        echo "✅ Certificate is valid"
    else
        echo "❌ Certificate is expired"
    fi
else
    echo "❌ Certificate file missing"
fi

# Check private key
if [[ -f "../licence/private.key" ]]; then
    echo "✅ Private key file exists"
    
    # Check key format
    if openssl rsa -in ../licence/private.key -check -noout; then
        echo "✅ Private key is valid"
    else
        echo "❌ Private key is invalid"
    fi
else
    echo "❌ Private key file missing"
fi

# Check WWDR certificate
if [[ -f "../licence/wwdr.pem" ]]; then
    echo "✅ WWDR certificate exists"
    
    # Check WWDR validity
    echo "WWDR certificate details:"
    openssl x509 -in ../licence/wwdr.pem -noout -subject -dates
    
    if openssl x509 -in ../licence/wwdr.pem -noout -checkend 0; then
        echo "✅ WWDR certificate is valid"
    else
        echo "❌ WWDR certificate is expired"
    fi
else
    echo "❌ WWDR certificate file missing"
fi

# Check certificate-key matching
if [[ -f "../licence/pass_temp.pem" && -f "../licence/private.key" ]]; then
    echo "Checking certificate-key matching..."
    
    cert_modulus=$(openssl x509 -in ../licence/pass_temp.pem -noout -modulus | openssl md5)
    key_modulus=$(openssl rsa -in ../licence/private.key -noout -modulus | openssl md5)
    
    if [[ "$cert_modulus" == "$key_modulus" ]]; then
        echo "✅ Certificate and private key match"
    else
        echo "❌ Certificate and private key DO NOT match"
        echo "   Certificate modulus: $cert_modulus"
        echo "   Private key modulus: $key_modulus"
    fi
fi

echo ""
echo "🗂️ MANIFEST VALIDATION"
echo "====================="

# Recalculate SHA-1 hashes
echo "Recalculating SHA-1 hashes..."
echo "Expected hashes from manifest.json:"
jq -r 'to_entries[] | "\(.key): \(.value)"' manifest.json

echo ""
echo "Actual file hashes:"
for file in pass.json *.png; do
    if [[ -f "$file" ]]; then
        actual_hash=$(shasum -a 1 "$file" | cut -d' ' -f1)
        expected_hash=$(jq -r ".[\"$file\"]" manifest.json)
        
        if [[ "$actual_hash" == "$expected_hash" ]]; then
            echo "✅ $file: $actual_hash"
        else
            echo "❌ $file: $actual_hash (expected: $expected_hash)"
        fi
    fi
done

echo ""
echo "🔏 SIGNATURE VALIDATION"
echo "======================"

# Check signature file
echo "Signature file analysis:"
file signature
ls -lh signature

# Check if signature is valid PKCS#7
echo "Checking PKCS#7 signature structure..."
if openssl pkcs7 -inform DER -in signature -print_certs -text > /dev/null 2>&1; then
    echo "✅ Signature is valid PKCS#7 DER format"
    
    # Extract certificate from signature
    echo "Certificates in signature:"
    openssl pkcs7 -inform DER -in signature -print_certs -noout
    
    # Verify signature
    echo "Verifying signature..."
    if openssl smime -verify -in signature -content manifest.json -CAfile ../licence/wwdr.pem -certfile ../licence/pass_temp.pem -noverify > /dev/null 2>&1; then
        echo "✅ Signature verification successful"
    else
        echo "❌ Signature verification failed"
        echo "Attempting manual verification..."
        openssl smime -verify -in signature -content manifest.json -CAfile ../licence/wwdr.pem -certfile ../licence/pass_temp.pem -noverify 2>&1 || true
    fi
else
    echo "❌ Signature is not valid PKCS#7 DER format"
    
    # Check if it's a text error message
    if file signature | grep -q "ASCII text"; then
        echo "Signature contains text (likely error message):"
        head -5 signature
    fi
fi

echo ""
echo "🌐 SERVER HEADERS CHECK"
echo "======================"

# Check server response headers
echo "Testing server response headers..."
if command -v curl > /dev/null 2>&1; then
    echo "Headers from /test/wallet-preview:"
    curl -I -s http://localhost:3000/test/wallet-preview | head -10
    
    echo ""
    echo "Headers from Apple Wallet API (if available):"
    curl -I -s http://localhost:3000/api/wallet/apple/test-card-id | head -10 || echo "API endpoint not accessible"
else
    echo "curl not available, skipping header check"
fi

echo ""
echo "🎯 CRITICAL ISSUES IDENTIFIED"
echo "============================="

# Summary of critical issues
ISSUES_FOUND=0

# Check for self-signed certificate issue
if [[ -f "../licence/pass_temp.pem" ]]; then
    if openssl x509 -in ../licence/pass_temp.pem -noout -text | grep -q "Issuer.*Pass Type ID"; then
        echo "❌ CRITICAL: Using self-signed certificate instead of Apple-issued certificate"
        echo "   Solution: Upload the CSR to Apple Developer Portal and get a real certificate"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# Check for certificate-key mismatch
if [[ -f "../licence/pass_temp.pem" && -f "../licence/private.key" ]]; then
    cert_modulus=$(openssl x509 -in ../licence/pass_temp.pem -noout -modulus | openssl md5)
    key_modulus=$(openssl rsa -in ../licence/private.key -noout -modulus | openssl md5)
    
    if [[ "$cert_modulus" != "$key_modulus" ]]; then
        echo "❌ CRITICAL: Certificate and private key mismatch"
        echo "   Solution: Use matching certificate and private key pair"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# Check for signature issues
if ! openssl pkcs7 -inform DER -in signature -print_certs -text > /dev/null 2>&1; then
    echo "❌ CRITICAL: Invalid PKCS#7 signature"
    echo "   Solution: Regenerate signature with proper certificate chain"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for missing required files
REQUIRED_FILES=("pass.json" "manifest.json" "signature" "icon.png" "icon@2x.png" "icon@3x.png")
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ CRITICAL: Missing required file: $file"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check for incorrect MIME type
if command -v curl > /dev/null 2>&1; then
    content_type=$(curl -I -s http://localhost:3000/test/wallet-preview | grep -i "content-type" | head -1)
    if [[ "$content_type" != *"application/vnd.apple.pkpass"* ]]; then
        echo "❌ CRITICAL: Incorrect Content-Type header"
        echo "   Current: $content_type"
        echo "   Required: application/vnd.apple.pkpass"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

echo ""
echo "📊 SUMMARY"
echo "=========="
echo "Total critical issues found: $ISSUES_FOUND"

if [[ $ISSUES_FOUND -eq 0 ]]; then
    echo "✅ No critical issues found - PKPass should work on iOS"
else
    echo "❌ Critical issues found - PKPass will be rejected by iOS"
    echo ""
    echo "🔧 RECOMMENDED FIXES:"
    echo "1. Get a real Apple-issued certificate from Developer Portal"
    echo "2. Ensure certificate and private key match"
    echo "3. Regenerate PKPass with proper signature"
    echo "4. Set correct Content-Type header in server response"
fi

echo ""
echo "🔄 GENERATING FIXED PKPass..."
echo "============================"

# Generate a fixed PKPass with proper structure
cd ..
./scripts/generate-fixed-pkpass.sh

echo ""
echo "✅ Analysis complete. Check dist/test_fixed.pkpass for the corrected version." 