#!/bin/bash

# Test script for Apple Wallet API endpoints
# This script tests various scenarios and outputs results

set -e

echo "🧪 Testing Apple Wallet API Endpoints"
echo "======================================"

# Base URL (adjust if needed)
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "\n${BLUE}Testing:${NC} $description"
    echo -e "${YELLOW}URL:${NC} $BASE_URL$endpoint"
    
    # Make the request and capture response
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    
    # Extract response body (all but last line)
    response_body=$(echo "$response" | sed '$d')
    
    # Check status code
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ Status: $status_code (Expected: $expected_status)${NC}"
    else
        echo -e "${RED}❌ Status: $status_code (Expected: $expected_status)${NC}"
    fi
    
    # Show response preview
    if command -v jq &> /dev/null && echo "$response_body" | jq . &> /dev/null; then
        echo -e "${BLUE}Response (JSON):${NC}"
        echo "$response_body" | jq . | head -20
        if [ $(echo "$response_body" | jq . | wc -l) -gt 20 ]; then
            echo "... (truncated)"
        fi
    else
        echo -e "${BLUE}Response (Text):${NC}"
        echo "$response_body" | head -10
        if [ $(echo "$response_body" | wc -l) -gt 10 ]; then
            echo "... (truncated)"
        fi
    fi
}

# Test 1: Health check
echo -e "\n${YELLOW}=== HEALTH CHECKS ===${NC}"
test_endpoint "/api/health" "General health check"
test_endpoint "/api/health/wallet" "Wallet health check"

# Test 2: Test with non-existent customer card
echo -e "\n${YELLOW}=== ERROR HANDLING ===${NC}"
test_endpoint "/api/wallet/apple/non-existent-card" "Non-existent customer card" 404
test_endpoint "/api/wallet/google/non-existent-card" "Non-existent customer card (Google)" 404

# Test 3: Debug endpoints (if customer cards exist)
echo -e "\n${YELLOW}=== DEBUG ENDPOINTS ===${NC}"

# Try to find existing customer cards by checking recent ones
echo -e "\n${BLUE}Checking for existing customer cards...${NC}"

# Common test IDs to try
TEST_IDS=(
    "test-customer-card-123"
    "customer-card-1"
    "customer-card-2"
    "customer-card-3"
)

FOUND_CARD=""
for test_id in "${TEST_IDS[@]}"; do
    response=$(curl -s -w "%{http_code}" "$BASE_URL/api/wallet/apple/$test_id?debug=true")
    status_code=$(echo "$response" | tail -c 3)
    
    if [ "$status_code" -eq 200 ]; then
        FOUND_CARD=$test_id
        echo -e "${GREEN}✅ Found working customer card: $test_id${NC}"
        break
    fi
done

if [ -n "$FOUND_CARD" ]; then
    echo -e "\n${YELLOW}=== TESTING WITH REAL CUSTOMER CARD ===${NC}"
    test_endpoint "/api/wallet/apple/$FOUND_CARD?debug=true" "Apple Wallet debug"
    test_endpoint "/api/wallet/google/$FOUND_CARD?debug=true" "Google Wallet debug"
    test_endpoint "/api/wallet/pwa/$FOUND_CARD" "PWA Wallet"
    
    # Test actual PKPass generation (if certificates are configured)
    echo -e "\n${YELLOW}=== PKPASS GENERATION ===${NC}"
    echo -e "${BLUE}Testing PKPass generation...${NC}"
    
    pkpass_response=$(curl -s -w "\n%{http_code}" -H "Accept: application/vnd.apple.pkpass" "$BASE_URL/api/wallet/apple/$FOUND_CARD")
    pkpass_status=$(echo "$pkpass_response" | tail -n1)
    
    if [ "$pkpass_status" -eq 200 ]; then
        echo -e "${GREEN}✅ PKPass generated successfully${NC}"
        
        # Save PKPass for inspection
        curl -s -H "Accept: application/vnd.apple.pkpass" "$BASE_URL/api/wallet/apple/$FOUND_CARD" > "test_generated.pkpass"
        
        if [ -f "test_generated.pkpass" ]; then
            file_size=$(ls -lh test_generated.pkpass | awk '{print $5}')
            echo -e "${BLUE}PKPass file saved as test_generated.pkpass ($file_size)${NC}"
            
            # Analyze PKPass contents
            if command -v unzip &> /dev/null; then
                echo -e "${BLUE}PKPass contents:${NC}"
                unzip -l test_generated.pkpass
                
                # Extract and show pass.json
                echo -e "\n${BLUE}Pass.json preview:${NC}"
                unzip -p test_generated.pkpass pass.json | jq . | head -30
            fi
        fi
    else
        echo -e "${RED}❌ PKPass generation failed (Status: $pkpass_status)${NC}"
        echo "$pkpass_response" | sed '$d'
    fi
else
    echo -e "${RED}❌ No working customer cards found${NC}"
    echo -e "${YELLOW}To create test data, run:${NC}"
    echo "  - Visit /business/dashboard to create a stamp card"
    echo "  - Use the QR code to join as a customer"
    echo "  - Or run the SQL script: scripts/create-test-customer-card.sql"
fi

# Test 4: Environment validation
echo -e "\n${YELLOW}=== ENVIRONMENT VALIDATION ===${NC}"
test_endpoint "/api/health/env" "Environment validation"

# Summary
echo -e "\n${YELLOW}=== SUMMARY ===${NC}"
echo "✅ Tests completed!"
echo ""
echo "Next steps:"
echo "1. If no customer cards found, create test data"
echo "2. Check Apple Wallet certificates configuration"
echo "3. Test on actual iOS device with Safari"
echo ""
echo "Test files created:"
if [ -f "test_generated.pkpass" ]; then
    echo "  - test_generated.pkpass (ready for iOS testing)"
fi
echo ""
echo "🍎 To test on iOS:"
echo "  - Copy test_generated.pkpass to iPhone"
echo "  - Tap in Safari or Files app"
echo "  - Should open in Apple Wallet" 