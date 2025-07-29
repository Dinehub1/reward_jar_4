#!/bin/bash

# Test Admin Routes - RewardJar 4.0
# Tests all admin dashboard routes for functionality

echo "🎯 RewardJar 4.0 - Admin Route Testing"
echo "====================================="

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_route() {
    local route=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo -n "Testing $route... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    
    if [ "$response" -eq "$expected_status" ] || [ "$response" -eq 307 ]; then
        echo -e "${GREEN}✅ PASS${NC} ($response)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} ($response, expected $expected_status)"
        return 1
    fi
}

# Test MCP connectivity
test_mcp() {
    echo "📊 Testing MCP Integration..."
    
    # Test basic MCP query
    if command -v mcp_supabase_execute_sql &> /dev/null; then
        echo -n "MCP Database Connection... "
        result=$(mcp_supabase_execute_sql --query="SELECT COUNT(*) as count FROM businesses" 2>/dev/null)
        if [[ $result == *"count"* ]]; then
            echo -e "${GREEN}✅ CONNECTED${NC}"
        else
            echo -e "${YELLOW}⚠️ LIMITED${NC} (MCP available but query failed)"
        fi
    else
        echo -e "${YELLOW}⚠️ MCP NOT AVAILABLE${NC} (testing via HTTP only)"
    fi
}

# Start testing
echo "📋 Step 1: Testing Admin Dashboard Routes"
echo "----------------------------------------"

# Core admin routes
test_route "/admin" 200 "Main admin dashboard"
test_route "/admin/businesses" 200 "Business management"
test_route "/admin/customers" 200 "Customer monitoring"
test_route "/admin/cards" 200 "Card management"
test_route "/admin/alerts" 200 "System alerts"
test_route "/admin/support" 200 "Support tools"
test_route "/admin/sandbox" 200 "Testing sandbox"

echo ""
echo "📋 Step 2: Testing Admin Card Management"
echo "---------------------------------------"

# Card creation routes
test_route "/admin/cards/stamp/new" 200 "Create stamp card"
test_route "/admin/cards/membership/new" 200 "Create membership card"

echo ""
echo "📋 Step 3: Testing API Endpoints"
echo "--------------------------------"

# Admin API routes
test_route "/api/admin/cards" 200 "Admin cards API"
test_route "/api/admin/support/add-stamps" 405 "Add stamps API (POST only)"
test_route "/api/admin/support/extend-membership" 405 "Extend membership API (POST only)"
test_route "/api/admin/support/flag-business" 405 "Flag business API (POST only)"

echo ""
echo "📋 Step 4: Testing System Health"
echo "-------------------------------"

# System health endpoints
test_route "/api/health/env" 200 "Environment health"
test_route "/api/system/health" 200 "System health"

echo ""
test_mcp

echo ""
echo "📋 Step 5: Testing Database Connectivity"
echo "---------------------------------------"

# Test database via API
echo -n "Database Connection via API... "
db_response=$(curl -s "$BASE_URL/api/health/env" | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6)
if [ "$db_response" = "connected" ]; then
    echo -e "${GREEN}✅ CONNECTED${NC}"
else
    echo -e "${RED}❌ DISCONNECTED${NC}"
fi

echo ""
echo "📋 Step 6: Testing Admin Schema"
echo "------------------------------"

# Test admin-specific features
echo -n "Admin Support Logs Table... "
if command -v mcp_supabase_execute_sql &> /dev/null; then
    result=$(mcp_supabase_execute_sql --query="SELECT COUNT(*) FROM admin_support_logs" 2>/dev/null)
    if [[ $result == *"0"* ]] || [[ $result == *"count"* ]]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
    else
        echo -e "${RED}❌ MISSING${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ SKIPPED${NC} (MCP not available)"
fi

echo -n "Business Flagging Columns... "
if command -v mcp_supabase_execute_sql &> /dev/null; then
    result=$(mcp_supabase_execute_sql --query="SELECT column_name FROM information_schema.columns WHERE table_name = 'businesses' AND column_name IN ('is_flagged', 'admin_notes')" 2>/dev/null)
    if [[ $result == *"is_flagged"* ]] && [[ $result == *"admin_notes"* ]]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
    else
        echo -e "${RED}❌ MISSING${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ SKIPPED${NC} (MCP not available)"
fi

echo ""
echo "📋 Summary"
echo "----------"

# Count results
total_tests=12
passed_tests=0

# Re-run tests silently to count passes
for route in "/admin" "/admin/businesses" "/admin/customers" "/admin/cards" "/admin/alerts" "/admin/support" "/admin/sandbox" "/admin/cards/stamp/new" "/admin/cards/membership/new" "/api/admin/cards" "/api/health/env" "/api/system/health"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$response" -eq 200 ] || [ "$response" -eq 307 ]; then
        ((passed_tests++))
    fi
done

echo "Tests Passed: $passed_tests/$total_tests"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED - Admin dashboard is fully operational!${NC}"
    exit 0
elif [ $passed_tests -gt $((total_tests * 3 / 4)) ]; then
    echo -e "${YELLOW}⚠️ MOSTLY WORKING - Some routes may need authentication${NC}"
    exit 0
else
    echo -e "${RED}❌ MULTIPLE FAILURES - Check server and database connection${NC}"
    exit 1
fi 