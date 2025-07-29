#!/bin/bash

echo "🍎 Updating Apple Wallet Certificates in .env.local"
echo "=================================================="

# Convert certificates to Base64
echo "Converting Apple certificates to Base64..."

PASS_CERT_BASE64=$(base64 -i "licence and cetifi/pass.cer" | tr -d '\n')
WWDR_CERT_BASE64=$(base64 -i "licence and cetifi/AppleWWDRCAG3.cer" | tr -d '\n')

echo "✅ Pass Certificate Base64: ${#PASS_CERT_BASE64} characters"
echo "✅ WWDR Certificate Base64: ${#WWDR_CERT_BASE64} characters"

# Create temporary file with updated values
echo "Updating .env.local with real certificate data..."

# Read current .env.local and update Apple certificate values
sed -i.bak \
  -e "s|^APPLE_CERT_BASE64=.*|APPLE_CERT_BASE64=${PASS_CERT_BASE64}|" \
  -e "s|^APPLE_WWDR_BASE64=.*|APPLE_WWDR_BASE64=${WWDR_CERT_BASE64}|" \
  .env.local

echo "✅ Updated APPLE_CERT_BASE64 with real Pass Certificate"
echo "✅ Updated APPLE_WWDR_BASE64 with real WWDR Certificate"

echo ""
echo "⚠️  IMPORTANT: Private Key Still Needed"
echo "======================================"
echo "The APPLE_KEY_BASE64 still contains dummy data because we don't have"
echo "the private key that matches the certificate from Apple Developer Portal."
echo ""
echo "To complete the setup:"
echo "1. 🔑 Generate new private key: bash scripts/extract-private-key.sh"
echo "2. 📝 Create new CSR with the private key"
echo "3. 🌐 Upload CSR to Apple Developer Portal"
echo "4. 📥 Download new certificate from Apple"
echo "5. 🔄 Update environment with new certificate and private key"
echo ""
echo "Current status:"
echo "✅ APPLE_CERT_BASE64: Real certificate from Apple"
echo "✅ APPLE_WWDR_BASE64: Real WWDR certificate"
echo "❌ APPLE_KEY_BASE64: Dummy private key (needs replacement)"
echo "✅ APPLE_TEAM_IDENTIFIER: 39CDB598RF (correct)"
echo "✅ APPLE_PASS_TYPE_IDENTIFIER: pass.com.rewardjar.rewards (correct)"

echo ""
echo "🧪 Testing Apple Wallet configuration..."
curl -s http://localhost:3000/api/health/env | jq '.appleWallet'

echo ""
echo "🍎 Apple Certificate Update Complete"
echo "====================================" 