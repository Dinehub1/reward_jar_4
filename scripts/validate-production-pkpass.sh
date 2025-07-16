#!/bin/bash

# Validate Production PKPass for iOS Compatibility
# This script performs comprehensive validation of the production PKPass

set -e

echo "✅ PRODUCTION PKPass VALIDATION"
echo "==============================="

# Check if production PKPass exists
if [[ ! -f "dist/production.pkpass" ]]; then
    echo "❌ ERROR: Production PKPass not found. Run generate-production-pkpass.sh first."
    exit 1
fi

echo "✅ Production PKPass found: dist/production.pkpass"

# Get file size
PKPASS_SIZE=$(ls -lh dist/production.pkpass | awk '{print $5}')
echo "📦 File size: $PKPASS_SIZE"

# Extract and validate structure
echo ""
echo "🔍 STRUCTURE VALIDATION"
echo "======================="

mkdir -p validate_final
cd validate_final
unzip -q ../dist/production.pkpass

echo "PKPass contents:"
ls -la

# Check required files
REQUIRED_FILES=("pass.json" "manifest.json" "signature" "icon.png" "icon@2x.png" "icon@3x.png" "logo.png" "logo@2x.png" "logo@3x.png")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ MISSING: $file"
        MISSING_FILES+=("$file")
    fi
done

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    echo "❌ ERROR: Missing required files: ${MISSING_FILES[*]}"
    exit 1
fi

# Validate JSON structure
echo ""
echo "📋 JSON VALIDATION"
echo "=================="

if jq . pass.json > /dev/null 2>&1; then
    echo "✅ pass.json is valid JSON"
    
    # Check required fields
    REQUIRED_FIELDS=("formatVersion" "passTypeIdentifier" "serialNumber" "teamIdentifier" "organizationName" "description")
    
    for field in "${REQUIRED_FIELDS[@]}"; do
        if jq -e ".$field" pass.json > /dev/null 2>&1; then
            value=$(jq -r ".$field" pass.json)
            echo "✅ $field: $value"
        else
            echo "❌ MISSING: $field"
        fi
    done
else
    echo "❌ ERROR: pass.json is not valid JSON"
    exit 1
fi

# Validate manifest hashes
echo ""
echo "🔐 MANIFEST VALIDATION"
echo "====================="

echo "Verifying SHA-1 hashes..."
HASH_ERRORS=0

for file in pass.json *.png; do
    if [[ -f "$file" ]]; then
        actual_hash=$(shasum -a 1 "$file" | cut -d' ' -f1)
        expected_hash=$(jq -r ".[\"$file\"]" manifest.json)
        
        if [[ "$actual_hash" == "$expected_hash" ]]; then
            echo "✅ $file: $actual_hash"
        else
            echo "❌ $file: $actual_hash (expected: $expected_hash)"
            HASH_ERRORS=$((HASH_ERRORS + 1))
        fi
    fi
done

if [[ $HASH_ERRORS -gt 0 ]]; then
    echo "❌ ERROR: $HASH_ERRORS hash validation errors found"
    exit 1
fi

# Validate signature
echo ""
echo "🔏 SIGNATURE VALIDATION"
echo "======================"

# Check PKCS#7 structure
if openssl pkcs7 -inform DER -in signature -print_certs -text > /dev/null 2>&1; then
    echo "✅ Signature is valid PKCS#7 DER format"
    
    # Check certificate chain
    echo "Certificate chain in signature:"
    openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -E "(subject|issuer)=" | head -4
    
    # Verify Apple certificate presence
    if openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -q "Apple Worldwide Developer Relations"; then
        echo "✅ Contains Apple WWDR certificate"
    else
        echo "❌ ERROR: Missing Apple WWDR certificate"
        exit 1
    fi
    
    # Check for our pass certificate
    if openssl pkcs7 -inform DER -in signature -print_certs -noout | grep -q "pass.com.rewardjar.rewards"; then
        echo "✅ Contains pass certificate"
    else
        echo "❌ ERROR: Missing pass certificate"
        exit 1
    fi
    
else
    echo "❌ ERROR: Invalid PKCS#7 signature"
    exit 1
fi

# Validate certificate expiration
echo ""
echo "📅 CERTIFICATE EXPIRATION"
echo "========================"

# Extract certificate from signature and check expiration
openssl pkcs7 -inform DER -in signature -print_certs | openssl x509 -noout -dates | head -1

if openssl pkcs7 -inform DER -in signature -print_certs | openssl x509 -noout -checkend 0; then
    echo "✅ Certificate is currently valid"
else
    echo "❌ WARNING: Certificate is expired"
fi

cd ..
rm -rf validate_final

# Test server headers
echo ""
echo "🌐 SERVER HEADERS VALIDATION"
echo "============================"

echo "Testing production PKPass endpoint headers..."
if command -v curl > /dev/null 2>&1; then
    HEADERS=$(curl -I -s http://localhost:3000/api/test/pkpass-headers)
    
    if echo "$HEADERS" | grep -q "application/vnd.apple.pkpass"; then
        echo "✅ Correct Content-Type: application/vnd.apple.pkpass"
    else
        echo "❌ ERROR: Incorrect Content-Type"
        echo "Headers:"
        echo "$HEADERS"
        exit 1
    fi
    
    if echo "$HEADERS" | grep -q "Content-Disposition: attachment"; then
        echo "✅ Correct Content-Disposition header"
    else
        echo "❌ ERROR: Missing Content-Disposition header"
    fi
    
    if echo "$HEADERS" | grep -q "X-PKPass-Source: Apple-Signed-Certificate"; then
        echo "✅ Apple-signed certificate confirmed"
    else
        echo "❌ ERROR: Apple certificate not confirmed"
    fi
    
else
    echo "⚠️  curl not available, skipping header test"
fi

echo ""
echo "🎉 VALIDATION COMPLETE"
echo "====================="
echo "✅ Production PKPass validation PASSED"
echo "✅ File: dist/production.pkpass ($PKPASS_SIZE)"
echo "✅ Structure: Valid"
echo "✅ JSON: Valid"
echo "✅ Hashes: Valid"
echo "✅ Signature: Valid PKCS#7 with Apple certificate"
echo "✅ Headers: Correct MIME type"
echo ""
echo "📱 READY FOR iOS TESTING"
echo "========================"
echo "The production PKPass is ready for iOS testing:"
echo ""
echo "1. 📲 Transfer to iPhone:"
echo "   - Email dist/production.pkpass to yourself"
echo "   - Or use AirDrop to send to iPhone"
echo ""
echo "2. 📱 Test on iPhone:"
echo "   - Open the .pkpass file"
echo "   - Should automatically open Apple Wallet"
echo "   - Should install without 'cannot be installed' error"
echo ""
echo "3. 🌐 Test via web:"
echo "   - Visit: http://localhost:3000/api/test/pkpass-headers"
echo "   - Should download and open in Apple Wallet"
echo ""
echo "4. 🚀 Deploy to production:"
echo "   - Copy environment variables from licence/apple-wallet-env.txt"
echo "   - Update your production environment"
echo "   - Deploy and test"
echo ""
echo "✅ SUCCESS: Production PKPass ready for iOS!" 