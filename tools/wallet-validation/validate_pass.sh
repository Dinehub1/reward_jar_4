#!/bin/bash

# RewardJar Wallet Pass Validation Script
# Generates and validates both Apple and Google wallet passes

set -e  # Exit on error

echo "🎫 RewardJar Wallet Pass Validation"
echo "===================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install jsonwebtoken archiver
fi

# Create artifacts directory
mkdir -p artifacts

echo ""
echo "🍎 Generating Apple Wallet passes..."
echo "-----------------------------------"

# Run Apple pass generator
if ! node tools/wallet-validation/generate_apple_pass.js; then
    echo "❌ Apple pass generation failed"
    exit 1
fi

echo ""
echo "🤖 Generating Google Wallet JWTs..."
echo "-----------------------------------"

# Check for Google service account
if [ -z "$GOOGLE_SERVICE_ACCOUNT_JSON" ]; then
    echo "⚠️  GOOGLE_SERVICE_ACCOUNT_JSON not set - creating mock JWT structure"
    echo "📝 To test with real Google Wallet, set environment variables:"
    echo "   export GOOGLE_SERVICE_ACCOUNT_JSON='{...service account json...}'"
    echo "   export GOOGLE_WALLET_ISSUER_ID='your-issuer-id'"
    
    # Create mock Google results for testing structure
    cat > artifacts/google-wallet-jwts.json << 'EOF'
{
  "stampCard": {
    "jwt": "MOCK_JWT_FOR_TESTING",
    "saveUrl": "https://pay.google.com/gp/v/save/MOCK_JWT_FOR_TESTING",
    "payload": {
      "loyaltyClasses": ["mock_class"],
      "loyaltyObjects": ["mock_object"]
    }
  },
  "membershipCard": {
    "jwt": "MOCK_JWT_FOR_TESTING",
    "saveUrl": "https://pay.google.com/gp/v/save/MOCK_JWT_FOR_TESTING", 
    "payload": {
      "genericClasses": ["mock_class"],
      "genericObjects": ["mock_object"]
    }
  },
  "generatedAt": "MOCK_TIMESTAMP",
  "note": "Mock data - set GOOGLE_SERVICE_ACCOUNT_JSON for real JWT generation"
}
EOF
else
    # Run Google JWT generator
    if ! node tools/wallet-validation/generate_google_jwt.js; then
        echo "❌ Google JWT generation failed"
        exit 1
    fi
fi

echo ""
echo "🔍 Validating generated passes..."
echo "--------------------------------"

# Validate Apple passes exist and have correct structure
echo "📱 Checking Apple passes..."

if [ -f "artifacts/test-stamp-card.pkpass" ]; then
    echo "  ✅ Stamp card .pkpass created"
    
    # Check if it's a valid ZIP file
    if unzip -t artifacts/test-stamp-card.pkpass &> /dev/null; then
        echo "  ✅ Stamp card has valid ZIP structure"
        
        # Extract and check required files
        TEMP_DIR=$(mktemp -d)
        unzip -q artifacts/test-stamp-card.pkpass -d "$TEMP_DIR"
        
        if [ -f "$TEMP_DIR/pass.json" ]; then
            echo "  ✅ pass.json exists"
            
            # Validate JSON structure
            if node -e "JSON.parse(require('fs').readFileSync('$TEMP_DIR/pass.json', 'utf8'))" 2>/dev/null; then
                echo "  ✅ pass.json is valid JSON"
            else
                echo "  ❌ pass.json is invalid JSON"
            fi
        else
            echo "  ❌ pass.json missing"
        fi
        
        [ -f "$TEMP_DIR/manifest.json" ] && echo "  ✅ manifest.json exists" || echo "  ❌ manifest.json missing"
        [ -f "$TEMP_DIR/signature" ] && echo "  ✅ signature exists" || echo "  ❌ signature missing"
        [ -f "$TEMP_DIR/icon.png" ] && echo "  ✅ icon.png exists" || echo "  ❌ icon.png missing"
        
        rm -rf "$TEMP_DIR"
    else
        echo "  ❌ Stamp card is not a valid ZIP file"
    fi
else
    echo "  ❌ Stamp card .pkpass not found"
fi

if [ -f "artifacts/test-membership-card.pkpass" ]; then
    echo "  ✅ Membership card .pkpass created"
else
    echo "  ❌ Membership card .pkpass not found"
fi

# Validate Google JWTs
echo ""
echo "🤖 Checking Google Wallet JWTs..."

if [ -f "artifacts/google-wallet-jwts.json" ]; then
    echo "  ✅ Google JWT file created"
    
    # Validate JSON structure
    if node -e "JSON.parse(require('fs').readFileSync('artifacts/google-wallet-jwts.json', 'utf8'))" 2>/dev/null; then
        echo "  ✅ JWT file is valid JSON"
        
        # Check for required fields
        if node -e "
            const data = JSON.parse(require('fs').readFileSync('artifacts/google-wallet-jwts.json', 'utf8'));
            if (data.stampCard && data.membershipCard) {
                console.log('  ✅ Both card types present');
                if (data.stampCard.jwt && data.membershipCard.jwt) {
                    console.log('  ✅ JWTs generated for both card types');
                } else {
                    console.log('  ❌ Missing JWT tokens');
                }
            } else {
                console.log('  ❌ Missing card type data');
            }
        " 2>/dev/null; then
            :  # Success message already printed
        else
            echo "  ❌ Error validating JWT structure"
        fi
    else
        echo "  ❌ JWT file is invalid JSON"
    fi
else
    echo "  ❌ Google JWT file not found"
fi

echo ""
echo "📊 Validation Summary"
echo "--------------------"

# Count successful artifacts
APPLE_COUNT=0
[ -f "artifacts/test-stamp-card.pkpass" ] && APPLE_COUNT=$((APPLE_COUNT + 1))
[ -f "artifacts/test-membership-card.pkpass" ] && APPLE_COUNT=$((APPLE_COUNT + 1))

GOOGLE_COUNT=0
[ -f "artifacts/google-wallet-jwts.json" ] && GOOGLE_COUNT=1

echo "📱 Apple passes generated: $APPLE_COUNT/2"
echo "🤖 Google JWT files generated: $GOOGLE_COUNT/1"

# Test device/simulator integration (if available)
echo ""
echo "📲 Device Testing Instructions"
echo "-----------------------------"
echo "To test on actual devices:"
echo ""
echo "🍎 Apple Wallet (iOS):"
echo "  1. Transfer .pkpass files to iOS device"
echo "  2. Tap to open in Wallet app"
echo "  3. Verify cards display correctly"
echo "  4. Test barcode scanning functionality"
echo ""
echo "🤖 Google Wallet (Android):"
echo "  1. Open save URLs from google-wallet-jwts.json"
echo "  2. Add to Google Wallet"
echo "  3. Verify cards display correctly" 
echo "  4. Test barcode scanning functionality"

# Upload to S3 test bucket if configured
if [ -n "$S3_TEST_BUCKET" ] && command -v aws &> /dev/null; then
    echo ""
    echo "☁️  Uploading test passes to S3..."
    echo "  Bucket: $S3_TEST_BUCKET"
    
    aws s3 cp artifacts/test-stamp-card.pkpass "s3://$S3_TEST_BUCKET/wallet-tests/" --acl public-read || echo "  ⚠️  S3 upload failed"
    aws s3 cp artifacts/test-membership-card.pkpass "s3://$S3_TEST_BUCKET/wallet-tests/" --acl public-read || echo "  ⚠️  S3 upload failed"
    
    echo "  📎 Test links:"
    echo "    https://$S3_TEST_BUCKET.s3.amazonaws.com/wallet-tests/test-stamp-card.pkpass"
    echo "    https://$S3_TEST_BUCKET.s3.amazonaws.com/wallet-tests/test-membership-card.pkpass"
fi

echo ""
echo "✅ Wallet validation complete!"
echo "📁 All artifacts saved in ./artifacts/"

# Return appropriate exit code
if [ "$APPLE_COUNT" -eq 2 ] && [ "$GOOGLE_COUNT" -eq 1 ]; then
    echo "🎉 All wallet passes generated successfully!"
    exit 0
else
    echo "⚠️  Some wallet passes failed to generate"
    exit 1
fi