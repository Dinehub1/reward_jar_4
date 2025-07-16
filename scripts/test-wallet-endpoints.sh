#!/bin/bash

# Test Wallet Endpoints with Generated Scenarios
# Run this after executing test-wallet-loop.sql

echo "🧪 Testing RewardJar Wallet Endpoints with Generated Scenarios"
echo "============================================================"

# Base URL for local development
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test a wallet endpoint
test_wallet_endpoint() {
    local card_id=$1
    local wallet_type=$2
    local scenario_name=$3
    local debug=${4:-false}
    
    local url="$BASE_URL/api/wallet/$wallet_type/$card_id"
    if [ "$debug" = "true" ]; then
        url="$url?debug=true"
    fi
    
    echo -e "\n${YELLOW}Testing:${NC} $scenario_name - $wallet_type wallet"
    echo "URL: $url"
    
    # Test the endpoint
    response=$(curl -s -w "%{http_code}" -o /tmp/wallet_response "$url")
    http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ]; then
        if [ "$debug" = "true" ]; then
            echo -e "${GREEN}✅ Debug response:${NC}"
            cat /tmp/wallet_response | head -10
        else
            file_size=$(stat -f%z /tmp/wallet_response 2>/dev/null || stat -c%s /tmp/wallet_response 2>/dev/null)
            echo -e "${GREEN}✅ Success:${NC} Generated ${wallet_type} wallet (${file_size} bytes)"
        fi
    else
        echo -e "${RED}❌ Failed:${NC} HTTP $http_code"
        cat /tmp/wallet_response | head -5
    fi
}

# Get test scenario card IDs from the database
echo "📋 Fetching test scenario card IDs..."

# You'll need to replace these with actual card IDs from your test_scenario_summary
# Run this SQL query in Supabase to get the card IDs:
# SELECT customer_card_id, stamp_card_name, current_stamps, total_stamps FROM test_scenario_summary ORDER BY completion_percentage;

# Example test card IDs (replace with actual IDs from your database)
declare -A test_scenarios=(
    ["empty"]="REPLACE_WITH_EMPTY_CARD_ID"
    ["small"]="REPLACE_WITH_SMALL_CARD_ID"
    ["large"]="REPLACE_WITH_LARGE_CARD_ID"
    ["long_names"]="REPLACE_WITH_LONG_NAMES_CARD_ID"
    ["half_complete"]="REPLACE_WITH_HALF_COMPLETE_CARD_ID"
    ["almost_complete"]="REPLACE_WITH_ALMOST_COMPLETE_CARD_ID"
    ["completed"]="REPLACE_WITH_COMPLETED_CARD_ID"
    ["over_complete"]="REPLACE_WITH_OVER_COMPLETE_CARD_ID"
)

# Test all scenarios
for scenario in "${!test_scenarios[@]}"; do
    card_id="${test_scenarios[$scenario]}"
    
    if [ "$card_id" = "REPLACE_WITH_${scenario^^}_CARD_ID" ]; then
        echo -e "${YELLOW}⚠️  Skipping $scenario:${NC} Card ID not set"
        continue
    fi
    
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Testing Scenario: $scenario${NC}"
    echo -e "${YELLOW}========================================${NC}"
    
    # Test Apple Wallet (debug mode first)
    test_wallet_endpoint "$card_id" "apple" "$scenario" true
    
    # Test Apple Wallet (actual PKPass)
    test_wallet_endpoint "$card_id" "apple" "$scenario" false
    
    # Test Google Wallet
    test_wallet_endpoint "$card_id" "google" "$scenario" false
    
    # Test PWA Wallet
    test_wallet_endpoint "$card_id" "pwa" "$scenario" false
    
    echo -e "${GREEN}✅ Completed testing scenario: $scenario${NC}"
done

echo -e "\n${GREEN}🎉 Wallet endpoint testing completed!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Check the wallet preview UI at: $BASE_URL/test/wallet-preview"
echo "2. Test PKPass files on iOS Safari"
echo "3. Verify wallet update queue is working"
echo "4. Test real-time synchronization"

# Clean up
rm -f /tmp/wallet_response

echo -e "\n${YELLOW}💡 To get actual card IDs, run this SQL in Supabase:${NC}"
echo "SELECT customer_card_id, stamp_card_name, current_stamps, total_stamps FROM test_scenario_summary ORDER BY completion_percentage;" 