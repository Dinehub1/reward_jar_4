# 🔧 RewardJar Environment Configuration Guide

## Required Environment Variables

### Core Configuration
```bash
# Next.js & Base URL
NEXT_PUBLIC_BASE_URL=https://www.rewardjar.xyz
NODE_ENV=production

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Wallet Integration Setup

#### Apple Wallet (Optional)
```bash
APPLE_TEAM_IDENTIFIER=your_team_id
APPLE_PASS_TYPE_IDENTIFIER=pass.com.company.rewardjar
```

#### Google Wallet (Optional) 
```bash
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nkey\n-----END PRIVATE KEY-----"
GOOGLE_WALLET_ISSUER_ID=your_issuer_id
```

## Environment-Specific Configurations

### Development (.env.local)
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Use test/sandbox wallet credentials
```

### Staging (.env.staging)
```bash
NEXT_PUBLIC_BASE_URL=https://staging.rewardjar.xyz
# Use staging wallet credentials
```

### Production (.env.production)
```bash
NEXT_PUBLIC_BASE_URL=https://www.rewardjar.xyz
# Use production wallet credentials
```