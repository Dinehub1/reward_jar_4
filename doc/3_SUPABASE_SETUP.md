# Supabase Setup for RewardJar 3.0

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys from Settings > API

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Required - Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional - For development
BASE_URL=http://localhost:3000
```

## 3. Database Schema

Run these SQL commands in your Supabase SQL Editor:

### Create Tables

```sql
-- Enable RLS
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id INTEGER NOT NULL CHECK (role_id IN (2, 3)), -- 2=business, 3=customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles reference table (optional, for clarity)
CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES (2, 'business'), (3, 'customer');

-- Business profiles
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stamp card templates
CREATE TABLE stamp_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_stamps INTEGER NOT NULL CHECK (total_stamps > 0 AND total_stamps <= 50),
  reward_description TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer profiles
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer card relationships
CREATE TABLE customer_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stamp_card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  current_stamps INTEGER DEFAULT 0 CHECK (current_stamps >= 0),
  wallet_type TEXT CHECK (wallet_type IN ('apple', 'google', 'pwa')),
  wallet_pass_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (customer_id, stamp_card_id)
);

-- Stamp collection history
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stamp_card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Completed rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stamp_card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY "Users can view and update their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- Businesses manage their own data
CREATE POLICY "Business owners manage their business" ON businesses
  FOR ALL USING (owner_id = auth.uid());

-- Stamp cards are managed by business owners
CREATE POLICY "Business owners manage their stamp cards" ON stamp_cards
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Customers manage their own data
CREATE POLICY "Customers manage their own data" ON customers
  FOR ALL USING (user_id = auth.uid());

-- Customer cards are viewable by both customer and business
CREATE POLICY "Customer cards access" ON customer_cards
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Similar policies for stamps and rewards
CREATE POLICY "Stamps access" ON stamps
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Rewards access" ON rewards
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );
```

### Create Helpful Views (Optional)

```sql
-- Business dashboard stats view
CREATE VIEW business_stats AS
SELECT 
  b.id as business_id,
  b.name as business_name,
  COUNT(DISTINCT sc.id) as total_stamp_cards,
  COUNT(DISTINCT cc.customer_id) as total_customers,
  COUNT(DISTINCT CASE WHEN cc.id IS NOT NULL THEN sc.id END) as active_cards
FROM businesses b
LEFT JOIN stamp_cards sc ON b.id = sc.business_id AND sc.status = 'active'
LEFT JOIN customer_cards cc ON sc.id = cc.stamp_card_id
GROUP BY b.id, b.name;
```

## 4. Test the Setup

1. Start your Next.js app: `npm run dev`
2. Go to `http://localhost:3000/auth/signup`
3. Create a business account
4. Check your Supabase dashboard to see the data

## 5. Troubleshooting

### Common Issues:

1. **"relation does not exist" errors**: Make sure all tables are created in the `public` schema
2. **RLS policy errors**: Ensure RLS is enabled and policies are correctly set
3. **Authentication errors**: Check that your environment variables are correct

### Verification Queries:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE schemaname = 'public';

-- Test business creation
SELECT * FROM businesses;
SELECT * FROM users WHERE role_id = 2;
```

## 6. Next Steps

Once your database is set up and working:

1. Test the signup and login flows
2. Create your first stamp card
3. Set up wallet integration (optional)
4. Configure analytics (optional)

For production deployment, make sure to:
- Use strong, unique passwords
- Enable database backups
- Set up monitoring
- Review and optimize your RLS policies 