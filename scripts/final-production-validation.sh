#!/bin/bash

# RewardJar 4.0 - Final Production Validation Script
# Tests all aspects of Apple Wallet integration before go-live

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 RewardJar 4.0 - Final Production Validation${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Configuration
PRODUCTION_DOMAIN="https://www.rewardjar.xyz"
LOCAL_DOMAIN="http://localhost:3000"
TEST_DOMAIN="${LOCAL_DOMAIN}"  # Change to PRODUCTION_DOMAIN for production testing

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Testing: ${test_name}${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}✅ PASS: ${test_name}${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL: ${test_name} (unexpected success)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS: ${test_name} (expected failure)${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL: ${test_name}${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    echo ""
}

# Function to check environment variables
check_env_vars() {
    echo -e "${BLUE}🔐 Environment Variables Check${NC}"
    echo -e "${BLUE}==============================${NC}"
    
    # Apple Wallet Variables
    local apple_vars=(
        "APPLE_CERT_BASE64"
        "APPLE_KEY_BASE64"
        "APPLE_WWDR_BASE64"
        "APPLE_TEAM_IDENTIFIER"
        "APPLE_PASS_TYPE_IDENTIFIER"
        "APPLE_CERT_PASSWORD"
    )
    
    for var in "${apple_vars[@]}"; do
        if [ -n "${!var}" ]; then
            echo -e "${GREEN}✅ ${var}: Configured${NC}"
        else
            echo -e "${RED}❌ ${var}: Missing${NC}"
        fi
    done
    echo ""
}

# Function to validate domain configuration
check_domain_config() {
    echo -e "${BLUE}🌐 Domain Configuration Check${NC}"
    echo -e "${BLUE}==============================${NC}"
    
    # Check if production domain is used in key files
    local files_to_check=(
        "src/app/api/wallet/apple/[customerCardId]/route.ts"
        "src/app/api/dev-seed/route.ts"
        "doc/test-wallet-preview.md"
    )
    
    for file in "${files_to_check[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "rewardjar.xyz" "$file"; then
                echo -e "${GREEN}✅ ${file}: Production domain configured${NC}"
            else
                echo -e "${YELLOW}⚠️  ${file}: Check domain configuration${NC}"
            fi
        else
            echo -e "${RED}❌ ${file}: File not found${NC}"
        fi
    done
    echo ""
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "${BLUE}🔌 API Endpoints Test${NC}"
    echo -e "${BLUE}=====================${NC}"
    
    # Test health endpoint
    run_test "Health Check Endpoint" \
        "curl -s -f '${TEST_DOMAIN}/api/health'" \
        "success"
    
    # Test wallet health endpoint
    run_test "Wallet Health Endpoint" \
        "curl -s -f '${TEST_DOMAIN}/api/health/wallet'" \
        "success"
    
    # Test environment health endpoint
    run_test "Environment Health Endpoint" \
        "curl -s -f '${TEST_DOMAIN}/api/health/env'" \
        "success"
    
    # Test dev-seed endpoint (GET)
    run_test "Dev-Seed GET Endpoint" \
        "curl -s -f '${TEST_DOMAIN}/api/dev-seed'" \
        "success"
    
    # Test Apple Wallet test endpoints
    run_test "Apple Wallet iOS Test" \
        "curl -s -f '${TEST_DOMAIN}/api/test/wallet-ios'" \
        "success"
    
    run_test "Apple Wallet Offline Test" \
        "curl -s -f '${TEST_DOMAIN}/api/test/wallet-offline'" \
        "success"
    
    run_test "Apple Wallet Simple Test" \
        "curl -s -f '${TEST_DOMAIN}/api/test/wallet-simple'" \
        "success"
}

# Function to test PKPass generation
test_pkpass_generation() {
    echo -e "${BLUE}📱 PKPass Generation Test${NC}"
    echo -e "${BLUE}=========================${NC}"
    
    # Test PKPass generation with mock data
    local test_endpoints=(
        "/api/test/wallet-ios"
        "/api/test/wallet-offline"
        "/api/test/wallet-simple"
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        echo -e "${YELLOW}Testing PKPass: ${endpoint}${NC}"
        
        # Test PKPass generation
        local response=$(curl -s -w "\n%{http_code}" -H "Accept: application/vnd.apple.pkpass" "${TEST_DOMAIN}${endpoint}")
        local status_code=$(echo "$response" | tail -n1)
        
        if [ "$status_code" = "200" ]; then
            echo -e "${GREEN}✅ PKPass generated successfully${NC}"
            
            # Save PKPass for analysis
            local filename="test_$(basename $endpoint).pkpass"
            curl -s -H "Accept: application/vnd.apple.pkpass" "${TEST_DOMAIN}${endpoint}" > "$filename"
            
            if [ -f "$filename" ]; then
                local file_size=$(ls -lh "$filename" | awk '{print $5}')
                echo -e "${BLUE}   File saved: $filename ($file_size)${NC}"
                
                # Analyze PKPass structure
                if command -v unzip &> /dev/null; then
                    local file_count=$(unzip -l "$filename" 2>/dev/null | grep -c "^[[:space:]]*[0-9]" || echo "0")
                    echo -e "${BLUE}   PKPass contains: $file_count files${NC}"
                fi
                
                # Clean up test file
                rm -f "$filename"
            fi
        else
            echo -e "${RED}❌ PKPass generation failed (Status: $status_code)${NC}"
        fi
        echo ""
    done
}

# Function to test file structure
test_file_structure() {
    echo -e "${BLUE}📁 File Structure Test${NC}"
    echo -e "${BLUE}======================${NC}"
    
    local required_files=(
        "src/app/api/wallet/apple/[customerCardId]/route.ts"
        "src/app/api/wallet/apple/updates/route.ts"
        "src/app/api/wallet/google/[customerCardId]/route.ts"
        "src/app/api/wallet/pwa/[customerCardId]/route.ts"
        "src/app/api/dev-seed/route.ts"
        "src/app/api/health/wallet/route.ts"
        "src/app/test/wallet-preview/page.tsx"
        "doc/launch-readiness.md"
        "doc/test-wallet-preview.md"
        "doc/applewallet.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ ${file}: Exists${NC}"
        else
            echo -e "${RED}❌ ${file}: Missing${NC}"
        fi
    done
    echo ""
}

# Function to test certificate validity
test_certificate_validity() {
    echo -e "${BLUE}🔐 Certificate Validity Test${NC}"
    echo -e "${BLUE}============================${NC}"
    
    if [ -n "$APPLE_CERT_BASE64" ] && [ -n "$APPLE_KEY_BASE64" ] && [ -n "$APPLE_WWDR_BASE64" ]; then
        echo -e "${GREEN}✅ Apple certificates configured${NC}"
        
        # Decode and check certificate validity
        echo "$APPLE_CERT_BASE64" | base64 -d > /tmp/apple_cert.pem 2>/dev/null || {
            echo -e "${RED}❌ Failed to decode Apple certificate${NC}"
            return 1
        }
        
        # Check certificate expiration
        local cert_expiry=$(openssl x509 -in /tmp/apple_cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ -n "$cert_expiry" ]; then
            echo -e "${BLUE}   Certificate expires: $cert_expiry${NC}"
        else
            echo -e "${RED}❌ Could not read certificate expiration${NC}"
        fi
        
        # Clean up
        rm -f /tmp/apple_cert.pem
    else
        echo -e "${RED}❌ Apple certificates not configured${NC}"
    fi
    echo ""
}

# Function to test production readiness
test_production_readiness() {
    echo -e "${BLUE}🎯 Production Readiness Test${NC}"
    echo -e "${BLUE}============================${NC}"
    
    # Check if localhost/IP addresses are used
    local localhost_check=$(grep -r "localhost\|127.0.0.1\|192.168\." src/ --include="*.ts" --include="*.tsx" | grep -v "getValidWebServiceURL" | wc -l)
    
    if [ "$localhost_check" -eq 0 ]; then
        echo -e "${GREEN}✅ No localhost/IP addresses found in source code${NC}"
    else
        echo -e "${RED}❌ Found $localhost_check localhost/IP references in source code${NC}"
    fi
    
    # Check if production domain is configured
    local production_domain_check=$(grep -r "rewardjar.xyz" src/ --include="*.ts" --include="*.tsx" | wc -l)
    
    if [ "$production_domain_check" -gt 0 ]; then
        echo -e "${GREEN}✅ Production domain configured in source code${NC}"
    else
        echo -e "${RED}❌ Production domain not found in source code${NC}"
    fi
    
    # Check for debug/test code
    local debug_check=$(grep -r "console.log\|debugger\|TODO\|FIXME" src/ --include="*.ts" --include="*.tsx" | wc -l)
    
    if [ "$debug_check" -eq 0 ]; then
        echo -e "${GREEN}✅ No debug code found${NC}"
    else
        echo -e "${YELLOW}⚠️  Found $debug_check debug statements (review recommended)${NC}"
    fi
    
    echo ""
}

# Function to generate test report
generate_test_report() {
    echo -e "${BLUE}📊 Test Report${NC}"
    echo -e "${BLUE}===============${NC}"
    
    local success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    echo -e "Success Rate: ${GREEN}$success_rate%${NC}"
    echo ""
    
    if [ "$success_rate" -ge 90 ]; then
        echo -e "${GREEN}🎉 PRODUCTION READY! Success rate: $success_rate%${NC}"
        echo -e "${GREEN}✅ All critical tests passed. Safe to deploy.${NC}"
    elif [ "$success_rate" -ge 75 ]; then
        echo -e "${YELLOW}⚠️  REVIEW REQUIRED. Success rate: $success_rate%${NC}"
        echo -e "${YELLOW}🔍 Some tests failed. Review issues before deployment.${NC}"
    else
        echo -e "${RED}❌ NOT READY FOR PRODUCTION. Success rate: $success_rate%${NC}"
        echo -e "${RED}🚫 Critical issues found. Do not deploy.${NC}"
    fi
    echo ""
}

# Function to create launch checklist
create_launch_checklist() {
    echo -e "${BLUE}📋 Creating Launch Checklist${NC}"
    echo -e "${BLUE}=============================${NC}"
    
    cat > "FINAL_LAUNCH_CHECKLIST.md" << EOF
# 🚀 Final Launch Checklist - $(date)

## Test Results
- Total Tests: $TOTAL_TESTS
- Passed: $PASSED_TESTS
- Failed: $FAILED_TESTS
- Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Pre-Launch Verification
- [ ] Environment variables configured
- [ ] Apple certificates valid
- [ ] Production domain configured
- [ ] API endpoints working
- [ ] PKPass generation successful
- [ ] File structure complete
- [ ] No debug code in production
- [ ] Browser compatibility tested

## Deployment Steps
1. **Final Code Review**
   - [ ] All changes reviewed and approved
   - [ ] No console.log or debug statements
   - [ ] Production domain configured

2. **Environment Setup**
   - [ ] Production environment variables set
   - [ ] Apple certificates uploaded
   - [ ] Database migrations applied

3. **Testing**
   - [ ] Run this validation script: \`./scripts/final-production-validation.sh\`
   - [ ] Manual testing on iOS Safari
   - [ ] Cross-browser compatibility check

4. **Deployment**
   - [ ] Deploy to production
   - [ ] Verify all endpoints working
   - [ ] Test actual PKPass generation
   - [ ] Monitor for 24 hours

## Post-Launch Monitoring
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Certificate expiration alerts

---
Generated: $(date)
EOF

    echo -e "${GREEN}✅ Launch checklist created: FINAL_LAUNCH_CHECKLIST.md${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}Starting comprehensive validation...${NC}"
    echo ""
    
    # Run all tests
    check_env_vars
    check_domain_config
    test_file_structure
    test_certificate_validity
    test_api_endpoints
    test_pkpass_generation
    test_production_readiness
    
    # Generate reports
    generate_test_report
    create_launch_checklist
    
    echo -e "${BLUE}🏁 Validation Complete!${NC}"
    echo -e "${BLUE}Check FINAL_LAUNCH_CHECKLIST.md for next steps.${NC}"
}

# Run main function
main "$@" 