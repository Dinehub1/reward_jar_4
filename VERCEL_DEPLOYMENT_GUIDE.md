# Vercel Deployment Guide - RewardJar 4.0

## 🚨 Issue: Test Cards Not Showing on Vercel

**Problem:** The test interface shows "0 Available test cards" on Vercel because the `dev-seed` API was blocked in production.

**Solution:** We've fixed the production block and need to configure environment variables properly on Vercel.

---

## 🔧 Required Environment Variables for Vercel

### 1. Core Database Variables (REQUIRED)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Apple Wallet Variables (REQUIRED for Apple Wallet)
```bash
APPLE_TEAM_IDENTIFIER=your_apple_team_id
APPLE_PASS_TYPE_IDENTIFIER=pass.com.yourcompany.rewardjar
APPLE_CERT_BASE64=your_base64_encoded_certificate
APPLE_KEY_BASE64=your_base64_encoded_private_key
APPLE_WWDR_BASE64=your_base64_encoded_wwdr_certificate
APPLE_CERT_PASSWORD=your_certificate_password
```

### 3. Application Configuration
```bash
BASE_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### 4. Optional Security (for test endpoints)
```bash
DEV_SEED_API_KEY=your_secret_api_key_for_test_endpoints
```

---

## 🚀 Step-by-Step Vercel Setup

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your RewardJar project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the sidebar

### Step 2: Add Required Variables
For each environment variable above:
1. Click "Add New"
2. Enter the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the **Value** (your actual value)
4. Select environments: **Production**, **Preview**, and **Development**
5. Click "Save"

### Step 3: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to "Settings" → "API"
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Configure Apple Wallet (if using)
If you have Apple Wallet certificates:
1. Convert your certificates to base64:
   ```bash
   base64 -i your_certificate.pem -o cert.b64
   base64 -i your_private_key.pem -o key.b64
   base64 -i wwdr.pem -o wwdr.b64
   ```
2. Copy the base64 content to the respective environment variables

### Step 5: Set Base URL
Set `BASE_URL` to your Vercel app URL:
```bash
BASE_URL=https://your-app-name.vercel.app
```

### Step 6: Redeploy
1. Go to "Deployments" tab in Vercel
2. Click "Redeploy" on the latest deployment
3. Wait for the deployment to complete

---

## 🧪 Testing After Deployment

### 1. Check System Health
Visit: `https://your-app.vercel.app/api/system/health`

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "supabase": { "status": "healthy" },
    "wallet_certificates": { "status": "healthy" },
    "file_permissions": { "status": "healthy" },
    "test_pass_generation": { "status": "healthy" }
  }
}
```

### 2. Test Card Generation
Visit: `https://your-app.vercel.app/test/wallet-preview`

1. Click "Generate Test Data"
2. You should see test cards appear
3. System should show "15 Available test cards"

### 3. Test Apple Wallet Generation
Click on any test card's "Apple" button - should download a `.pkpass` file

---

## 🔒 Security Considerations

### Production Test Endpoints
The `dev-seed` API is now available in production for testing purposes. To secure it:

1. **Option A: No Security (Current)**
   - Test endpoints work without authentication
   - Suitable for staging/testing environments

2. **Option B: API Key Protection**
   - Add `DEV_SEED_API_KEY=your_secret_key` to Vercel environment variables
   - Test interface will need to be updated to include the API key

### Database Security
- Ensure Row Level Security (RLS) is enabled on Supabase
- Test users should only access test data
- Production users should not see test data

---

## 🐛 Troubleshooting

### Issue: "0 Available test cards"
**Cause:** Environment variables not set correctly
**Solution:** 
1. Check all required environment variables are set in Vercel
2. Redeploy the application
3. Check `/api/system/health` for specific errors

### Issue: "Supabase connection failed"
**Cause:** Invalid Supabase credentials
**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check Supabase project is active and accessible
3. Ensure service role key has proper permissions

### Issue: "Apple Wallet generation failed"
**Cause:** Missing or invalid Apple certificates
**Solution:**
1. Verify all Apple environment variables are set
2. Check certificate expiration dates
3. Ensure certificates are properly base64 encoded

### Issue: "Database tables not found"
**Cause:** Database schema not properly set up
**Solution:**
1. Run the SQL scripts in `/scripts/` directory
2. Ensure all tables exist: `users`, `businesses`, `stamp_cards`, `customers`, `customer_cards`
3. Check RLS policies are properly configured

---

## 📊 Expected Results After Fix

After following this guide, your Vercel deployment should show:

- **System Health:** 100% (4/4 checks passing)
- **Test Cards:** 15 cards across 8 scenarios
- **Apple Wallet:** PKPass files generating successfully (5-6KB files)
- **Test Interface:** Fully functional with QR codes and download links

---

## 🆘 Need Help?

If you're still experiencing issues:

1. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Functions
   - Check logs for error messages

2. **Test API Endpoints Directly:**
   ```bash
   curl https://your-app.vercel.app/api/system/health
   curl https://your-app.vercel.app/api/dev-seed
   ```

3. **Verify Database Connection:**
   - Check Supabase dashboard for connection errors
   - Ensure your IP is not blocked by Supabase

The test interface should now work perfectly on Vercel! 🎉 