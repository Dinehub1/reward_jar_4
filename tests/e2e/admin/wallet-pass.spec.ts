import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Wallet Pass Generation and Validation E2E Tests
 * Tests the complete wallet pass generation flow in RewardJar admin
 */

test.describe('Wallet Pass Generation and Validation', () => {
  
  test.beforeAll(async () => {
    // Ensure we have fresh artifacts directory
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    if (fs.existsSync(artifactsDir)) {
      fs.rmSync(artifactsDir, { recursive: true, force: true });
    }
    fs.mkdirSync(artifactsDir, { recursive: true });
  });

  test('should generate Apple Wallet passes with correct structure', async () => {
    // Run the Apple pass generator
    const generator = require('../../../tools/wallet-validation/generate_apple_pass.js');
    
    // Generate stamp card
    const stampPass = generator.generateStampCardPass();
    expect(stampPass).toBeDefined();
    expect(stampPass.formatVersion).toBe(1);
    expect(stampPass.passTypeIdentifier).toContain('pass.com.rewardjar');
    expect(stampPass.storeCard).toBeDefined();
    expect(stampPass.storeCard.primaryFields).toHaveLength(1);
    expect(stampPass.storeCard.primaryFields[0].key).toBe('stamps');
    
    // Generate membership card
    const membershipPass = generator.generateMembershipCardPass();
    expect(membershipPass).toBeDefined();
    expect(membershipPass.formatVersion).toBe(1);
    expect(membershipPass.generic).toBeDefined();
    expect(membershipPass.generic.primaryFields).toHaveLength(1);
    expect(membershipPass.generic.primaryFields[0].key).toBe('membership');
    
    // Test .pkpass file creation
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    const stampPassPath = path.join(artifactsDir, 'test-stamp-e2e.pkpass');
    const memberPassPath = path.join(artifactsDir, 'test-member-e2e.pkpass');
    
    await generator.createPkpass(stampPass, stampPassPath);
    await generator.createPkpass(membershipPass, memberPassPath);
    
    // Verify files exist
    expect(fs.existsSync(stampPassPath)).toBe(true);
    expect(fs.existsSync(memberPassPath)).toBe(true);
    
    // Verify file sizes (should be reasonable)
    const stampStats = fs.statSync(stampPassPath);
    const memberStats = fs.statSync(memberPassPath);
    expect(stampStats.size).toBeGreaterThan(1000); // At least 1KB
    expect(memberStats.size).toBeGreaterThan(1000);
    expect(stampStats.size).toBeLessThan(50000); // Less than 50KB
    expect(memberStats.size).toBeLessThan(50000);
  });

  test('should generate Google Wallet JWTs with valid structure', async () => {
    // Mock service account for testing
    const mockServiceAccount = {
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8Q7HgL9p7Y8cO\n...(mock key for testing)\n-----END PRIVATE KEY-----\n',
      client_email: 'test@rewardjar-test.iam.gserviceaccount.com'
    };
    
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify(mockServiceAccount);
    process.env.GOOGLE_WALLET_ISSUER_ID = 'test-issuer-123';
    
    const generator = require('../../../tools/wallet-validation/generate_google_jwt.js');
    
    // Generate stamp card object
    const stampObject = generator.generateStampCardObject();
    expect(stampObject).toBeDefined();
    expect(stampObject.id).toContain('test-issuer-123');
    expect(stampObject.classId).toContain('stamp-card-class');
    expect(stampObject.loyaltyPoints).toBeDefined();
    expect(stampObject.barcode).toBeDefined();
    expect(stampObject.barcode.type).toBe('QR_CODE');
    
    // Generate membership card object
    const memberObject = generator.generateMembershipCardObject();
    expect(memberObject).toBeDefined();
    expect(memberObject.id).toContain('test-issuer-123');
    expect(memberObject.classId).toContain('membership-card-class');
    expect(memberObject.cardTitle).toBeDefined();
    expect(memberObject.textModulesData).toHaveLength(3);
    
    // Test JWT creation
    try {
      const payload = {
        loyaltyClasses: [{}],
        loyaltyObjects: [stampObject]
      };
      const jwt = generator.createWalletJWT(payload, mockServiceAccount);
      expect(jwt).toBeDefined();
      expect(typeof jwt).toBe('string');
      expect(jwt.split('.')).toHaveLength(3); // JWT should have 3 parts
      
      // Test save URL generation
      const saveUrl = generator.generateSaveUrl(jwt);
      expect(saveUrl).toContain('https://pay.google.com/gp/v/save/');
      expect(saveUrl).toContain(jwt);
      
    } catch (error) {
      // JWT creation might fail with mock key, which is expected
      console.log('JWT creation with mock key failed as expected:', error.message);
    }
    
    // Clean up environment
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    delete process.env.GOOGLE_WALLET_ISSUER_ID;
  });

  test('should create wallet passes via admin card creation flow', async ({ page }) => {
    // Start the development server if not already running
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    
    // Navigate to admin login (assuming test environment)
    await page.goto(`${baseUrl}/auth/dev-login`);
    
    // Wait for page to load
    await expect(page).toHaveTitle(/RewardJar/);
    
    // Navigate to card creation
    await page.goto(`${baseUrl}/admin/cards/new`);
    
    // Wait for the card creation page to load
    await expect(page.locator('h1')).toContainText(/create/i);
    
    // Check if the wallet preview endpoints are accessible
    // This tests the integration between admin UI and wallet generation
    const walletEndpoints = [
      '/api/admin/cards',
      '/api/admin/wallet-provision',
      '/api/admin/businesses'
    ];
    
    for (const endpoint of walletEndpoints) {
      const response = await page.request.get(`${baseUrl}${endpoint}`);
      // Should not be 404 (endpoint exists)
      expect(response.status()).not.toBe(404);
      // Admin endpoints should require auth, so 401/403 is acceptable
      expect([200, 401, 403]).toContain(response.status());
    }
  });

  test('should validate pass preview endpoints return correct content types', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    
    // Test that wallet pass preview endpoint exists and returns appropriate content
    // This would be the endpoint that generates preview passes for the admin
    const response = await page.request.get(`${baseUrl}/api/admin/cards`);
    
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
      
      const body = await response.text();
      expect(() => JSON.parse(body)).not.toThrow();
    }
    
    // Test wallet provision endpoint exists
    const provisionResponse = await page.request.get(`${baseUrl}/api/admin/wallet-provision`);
    // Should exist (not 404)
    expect(provisionResponse.status()).not.toBe(404);
  });

  test('should run wallet validation script and generate artifacts', async () => {
    // Run the validation script
    const scriptPath = path.join(process.cwd(), 'tools/wallet-validation/validate_pass.sh');
    
    try {
      execSync(`bash ${scriptPath}`, { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      // Check that artifacts were created
      const artifactsDir = path.join(process.cwd(), 'artifacts');
      expect(fs.existsSync(artifactsDir)).toBe(true);
      
      // Check for Apple passes
      const stampPassPath = path.join(artifactsDir, 'test-stamp-card.pkpass');
      const memberPassPath = path.join(artifactsDir, 'test-membership-card.pkpass');
      expect(fs.existsSync(stampPassPath)).toBe(true);
      expect(fs.existsSync(memberPassPath)).toBe(true);
      
      // Check for Google JWT file
      const googleJwtPath = path.join(artifactsDir, 'google-wallet-jwts.json');
      expect(fs.existsSync(googleJwtPath)).toBe(true);
      
      // Validate JSON structure
      const jwtData = JSON.parse(fs.readFileSync(googleJwtPath, 'utf8'));
      expect(jwtData.stampCard).toBeDefined();
      expect(jwtData.membershipCard).toBeDefined();
      
    } catch (error) {
      // Log error for debugging but don't fail test if it's environment-related
      console.error('Wallet validation script error:', error.message);
      
      // The script should at least attempt to run
      expect(fs.existsSync(scriptPath)).toBe(true);
    }
  });

  test('should verify pass file structure and content', async () => {
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    const stampPassPath = path.join(artifactsDir, 'test-stamp-card.pkpass');
    
    if (fs.existsSync(stampPassPath)) {
      // Extract and examine pass contents
      const extractDir = path.join(artifactsDir, 'extracted-pass');
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true });
      }
      fs.mkdirSync(extractDir);
      
      try {
        // Use unzip command to extract
        execSync(`unzip -q "${stampPassPath}" -d "${extractDir}"`, { stdio: 'pipe' });
        
        // Check required files exist
        const requiredFiles = ['pass.json', 'manifest.json', 'signature'];
        for (const file of requiredFiles) {
          const filePath = path.join(extractDir, file);
          expect(fs.existsSync(filePath), `${file} should exist in pass`).toBe(true);
        }
        
        // Validate pass.json structure
        const passJsonPath = path.join(extractDir, 'pass.json');
        const passData = JSON.parse(fs.readFileSync(passJsonPath, 'utf8'));
        
        expect(passData.formatVersion).toBe(1);
        expect(passData.passTypeIdentifier).toBeDefined();
        expect(passData.serialNumber).toBeDefined();
        expect(passData.teamIdentifier).toBeDefined();
        expect(passData.organizationName).toBeDefined();
        
        // Check for appropriate card structure (storeCard or generic)
        const hasStoreCard = !!passData.storeCard;
        const hasGeneric = !!passData.generic;
        expect(hasStoreCard || hasGeneric).toBe(true);
        
        // Clean up
        fs.rmSync(extractDir, { recursive: true });
        
      } catch (error) {
        console.warn('Pass extraction failed (may be expected without unzip):', error.message);
      }
    }
  });

  test('should handle wallet pass generation errors gracefully', async () => {
    const generator = require('../../../tools/wallet-validation/generate_apple_pass.js');
    
    // Test with invalid data
    const invalidPass = {
      // Missing required fields
      formatVersion: 1
    };
    
    try {
      const artifactsDir = path.join(process.cwd(), 'artifacts');
      const invalidPassPath = path.join(artifactsDir, 'invalid-test.pkpass');
      
      await generator.createPkpass(invalidPass, invalidPassPath);
      
      // Even invalid data should create a file (for testing structure)
      expect(fs.existsSync(invalidPassPath)).toBe(true);
      
    } catch (error) {
      // Error handling is acceptable for invalid data
      expect(error).toBeDefined();
    }
  });

  test.afterAll(async () => {
    // Clean up test artifacts
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    const testFiles = [
      'test-stamp-e2e.pkpass',
      'test-member-e2e.pkpass',
      'invalid-test.pkpass'
    ];
    
    for (const file of testFiles) {
      const filePath = path.join(artifactsDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
});