# Vercel Deployment Guide - RewardJar 4.0

**Status**: ✅ Complete Setup Guide  
**Last Updated**: January 2025  
**Target**: Production deployment with Google Wallet integration

---

## 📋 Executive Summary

This guide provides step-by-step instructions for deploying RewardJar 4.0 on Vercel with complete Google Wallet integration, environment variable configuration, and troubleshooting for common deployment issues.

**🎯 Deployment Goals:**
- ✅ Full Google Wallet functionality on production
- ✅ Proper environment variable configuration
- ✅ Test interface working with live data
- ✅ All API endpoints functional
- ✅ Security best practices implemented

---

## 🚀 Quick Start (5 Minutes)

### 1. Deploy to Vercel
```bash
# Clone and deploy
git clone https://github.com/yourusername/rewardjar_4.0.git
cd rewardjar_4.0
npx vercel --prod

# Or use the Vercel dashboard
# 1. Go to vercel.com
# 2. Import from GitHub
# 3. Configure environment variables (see below)
```

### 2. Essential Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Core Application (Required)
NEXT_PUBLIC_SUPABASE_URL=https://qxomkkjgbqmscxjppkeu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Google Wallet (Required for testing)
GOOGLE_SERVICE_ACCOUNT_EMAIL=rewardjar@rewardjar-461310.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----"
GOOGLE_CLASS_ID=issuer.loyalty.rewardjar

# Optional (for enhanced security)
DEV_SEED_API_KEY=your_secure_api_key_here
```

### 3. Verify Deployment
- Visit: `https://your-app.vercel.app/test/wallet-preview`
- Check: `https://your-app.vercel.app/api/health/env`

---

## 📊 Complete Environment Variable Setup

### Required Variables (9 total)

#### Core Application (5 variables)
```env
NEXT_PUBLIC_SUPABASE_URL=https://qxomkkjgbqmscxjppkeu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

#### Google Wallet Integration (3 variables)
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=rewardjar@rewardjar-461310.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
GOOGLE_CLASS_ID=issuer.loyalty.rewardjar
```

#### Security & Testing (1 variable - Optional)
```env
DEV_SEED_API_KEY=your_secure_random_key_for_test_endpoints
```

### Optional Variables (Advanced Features)
```env
# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Additional Security (Optional)
API_KEY=secure_random_key_for_protected_endpoints

# Google Maps (Optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB...
```

---

## ⚙️ Step-by-Step Vercel Configuration

### Step 1: Repository Setup
1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Check .gitignore**: Verify `.env.local` is in `.gitignore`
3. **Commit latest changes**: `git add . && git commit -m "Ready for Vercel deployment"`

### Step 2: Create Vercel Project
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 3: Environment Variables Configuration

#### Method 1: Vercel Dashboard (Recommended)
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable individually:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://qxomkkjgbqmscxjppkeu.supabase.co`
   - **Environments**: Production, Preview, Development (all)
3. Repeat for all required variables

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY production
# ... continue for all variables
```

#### Method 3: Import from .env file
```bash
# Create a temporary .env file with production values
cat > .env.production << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://qxomkkjgbqmscxjppkeu.supabase.co
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
# ... all your variables
EOF

# Import to Vercel (requires Vercel CLI)
vercel env pull .env.local
```

### Step 4: Private Key Configuration ⚠️ CRITICAL

The `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` requires special handling:

#### Correct Format:
```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
```

#### Common Mistakes to Avoid:
❌ **Wrong**: Missing quotes
❌ **Wrong**: No `\n` characters
❌ **Wrong**: Spaces in the key
❌ **Wrong**: Missing BEGIN/END markers

#### Verification Steps:
1. Check format with: `curl https://your-app.vercel.app/api/health/env`
2. Look for: `"privateKeyValid": true`
3. Verify: `"jwtSigningReady": true`

---

## 🔍 Testing & Verification

### Automated Health Checks
```bash
# Check overall system health
curl https://your-app.vercel.app/api/health

# Check environment configuration
curl https://your-app.vercel.app/api/health/env

# Test Google Wallet API
curl https://your-app.vercel.app/api/wallet/google/test-id
```

### Expected Responses

#### Healthy Environment (`/api/health/env`):
```json
{
  "status": "healthy",
  "googleWallet": {
    "status": "healthy",
    "privateKeyValid": true,
    "jwtSigningReady": true
  },
  "validation": {
    "privateKeyFormat": "valid",
    "jwtCompatible": true,
    "rs256Ready": true
  }
}
```

#### Working Test Interface:
- Visit: `https://your-app.vercel.app/test/wallet-preview`
- Should show: Test cards loaded
- Google Wallet button: Should generate valid `saveUrl`
- QR codes: Should point to `https://www.rewardjar.xyz/join/[cardId]`

### Manual Testing Checklist
- [ ] **Homepage loads**: `https://your-app.vercel.app`
- [ ] **Test interface works**: `/test/wallet-preview`
- [ ] **Test data generates**: Click "Generate Test Data"
- [ ] **Google Wallet link works**: Click "Add to Google Wallet"
- [ ] **QR codes display**: Proper production domain
- [ ] **Environment validation**: Green status in `/api/health/env`

---

## 🚨 Troubleshooting Common Issues

### Issue 1: "0 Available test cards"
**Symptoms**: Test interface shows no cards
**Causes**: 
- Missing `SUPABASE_SERVICE_ROLE_KEY`
- Incorrect Supabase URL
- Dev-seed API blocked in production

**Solutions**:
```bash
# Check Supabase connection
curl https://your-app.vercel.app/api/health/env

# Test dev-seed API directly
curl -X POST https://your-app.vercel.app/api/dev-seed \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_dev_seed_api_key" \
  -d '{"createAll": true}'
```

### Issue 2: "Invalid JWT signature"
**Symptoms**: Google Wallet API returns JWT errors
**Causes**: 
- Malformed `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- Missing newline escaping
- Wrong key format

**Solutions**:
```bash
# Validate private key format
curl https://your-app.vercel.app/api/health/env | jq '.validation'

# Expected output:
# {
#   "privateKeyFormat": "valid",
#   "jwtCompatible": true,
#   "rs256Ready": true
# }
```

### Issue 3: "secretOrPrivateKey must be an asymmetric key"
**Symptoms**: JWT signing fails
**Cause**: Private key not in proper PEM format

**Solution**:
1. Ensure private key starts with `-----BEGIN PRIVATE KEY-----`
2. Ensure private key ends with `-----END PRIVATE KEY-----`
3. Ensure newlines are escaped as `\n`
4. Wrap entire key in double quotes

### Issue 4: Build Failures
**Symptoms**: Deployment fails during build
**Causes**: 
- Environment variables not available during build
- Missing dependencies
- Type errors

**Solutions**:
```bash
# Check build logs in Vercel dashboard
# Ensure all NEXT_PUBLIC_ variables are set
# Verify no TypeScript errors locally:
npm run build
npm run lint
```

### Issue 5: API Routes Return 500
**Symptoms**: Internal server errors on API calls
**Causes**: 
- Missing environment variables
- Database connection issues
- Incorrect Supabase keys

**Solutions**:
1. Check Vercel Function logs
2. Verify all environment variables are set
3. Test Supabase connection locally
4. Check RLS policies

---

## 🔒 Security Best Practices

### Environment Variable Security
1. **Never commit `.env.local`** to version control
2. **Use unique keys** for each environment (dev, staging, prod)
3. **Rotate keys regularly** (every 90 days)
4. **Limit access** to Vercel dashboard

### Google Wallet Security
1. **Validate JWT signatures** server-side
2. **Use HTTPS only** for production
3. **Implement rate limiting** on test endpoints
4. **Monitor API usage** for anomalies

### Production Checklist
- [ ] `.env.local` in `.gitignore`
- [ ] Production domains configured
- [ ] API keys are unique for production
- [ ] Security headers enabled
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting set up

---

## 📊 Performance Optimization

### Vercel-Specific Optimizations
```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    // Enable optimizations for Vercel
  },
  images: {
    domains: ['storage.googleapis.com', 'api.qrserver.com']
  },
  env: {
    // Custom environment variables
  }
}
```

### Database Optimization
- Use connection pooling
- Implement proper indexing
- Cache frequent queries
- Use CDN for static assets

### Monitoring Setup
```bash
# Add performance monitoring
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Monitor Vercel metrics
vercel analytics enable
```

---

## 🎯 Go-Live Checklist

### Pre-Deploy Verification
- [ ] All environment variables configured
- [ ] Google Wallet private key validated
- [ ] Supabase connection working
- [ ] Test data generation functional
- [ ] QR codes pointing to production domain

### Post-Deploy Testing
- [ ] Homepage loads without errors
- [ ] Test interface shows cards
- [ ] Google Wallet link generation works
- [ ] JWT validation passes
- [ ] Performance metrics within targets
- [ ] Error logging functional

### Production Monitoring
- [ ] Set up alerts for failed deployments
- [ ] Monitor API response times
- [ ] Track error rates
- [ ] Monitor Google Wallet usage
- [ ] Set up backup and recovery

---

## 🆘 Support & Resources

### Quick Commands
```bash
# Deploy latest changes
git push && vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Test environment
curl https://your-app.vercel.app/api/health/env
```

### Useful Links
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Wallet Console**: https://pay.google.com/business/console
- **Supabase Dashboard**: https://app.supabase.com
- **JWT Validator**: https://jwt.io

### Getting Help
1. **Check Vercel logs** in dashboard
2. **Validate environment** via `/api/health/env`
3. **Test locally first** with same variables
4. **Review this guide** for common solutions

---

**Status**: ✅ **READY FOR PRODUCTION**  
**Deployment Time**: ~10 minutes with this guide  
**Next Steps**: Monitor performance and user adoption

---

*Last updated: January 2025 | Version: 4.0 Production* 