-- Admin Schema Updates for RewardJar 4.0
-- Add admin support tables and enhanced RLS policies

-- Add admin role if not exists
INSERT INTO roles (id, name) VALUES (1, 'admin') ON CONFLICT (id) DO NOTHING;

-- Add missing columns to businesses table for admin features
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT NULL;

-- Create admin support logs table
CREATE TABLE IF NOT EXISTS admin_support_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'add_stamp', 'remove_stamp', 'reset_card',
    'extend_membership', 'add_sessions', 'reset_sessions',
    'force_reward', 'mark_redeemed', 'flag_business', 'unflag_business',
    'impersonate_business', 'edit_business_profile'
  )),
  target_type TEXT NOT NULL CHECK (target_type IN ('customer', 'business', 'card')),
  target_id UUID NOT NULL,
  target_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin support logs
CREATE INDEX IF NOT EXISTS idx_admin_support_logs_admin_id ON admin_support_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_support_logs_action ON admin_support_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_support_logs_target_type ON admin_support_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_support_logs_created_at ON admin_support_logs(created_at);

-- Enable RLS on admin support logs
ALTER TABLE admin_support_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin support logs (only admins can access)
CREATE POLICY IF NOT EXISTS "Admin only access to support logs" ON admin_support_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

-- Enhanced RLS policies for businesses table (admin flagging)
CREATE POLICY IF NOT EXISTS "Admin can flag businesses" ON businesses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

-- Enhanced RLS policies for stamp_cards (admin-only creation already exists)
-- Ensure businesses can only view/update their assigned cards
CREATE POLICY IF NOT EXISTS "Business owners view assigned stamp cards" ON stamp_cards
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

CREATE POLICY IF NOT EXISTS "Business owners update assigned stamp cards" ON stamp_cards
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

-- Enhanced RLS policies for membership_cards (admin-only creation already exists)
CREATE POLICY IF NOT EXISTS "Business owners view assigned membership cards" ON membership_cards
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

CREATE POLICY IF NOT EXISTS "Business owners update assigned membership cards" ON membership_cards
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

-- Admin function to log support actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_name TEXT,
  p_comment TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role_id = 1
  ) THEN
    RAISE EXCEPTION 'Only admin users can perform support actions';
  END IF;
  
  -- Insert log entry
  INSERT INTO admin_support_logs (
    admin_id, action, target_type, target_id, target_name, comment, metadata
  ) VALUES (
    p_admin_id, p_action, p_target_type, p_target_id, p_target_name, p_comment, p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to manually add stamps
CREATE OR REPLACE FUNCTION admin_add_stamps(
  p_admin_id UUID,
  p_customer_card_id UUID,
  p_stamp_count INTEGER,
  p_comment TEXT
)
RETURNS JSON AS $$
DECLARE
  v_customer_card customer_cards%ROWTYPE;
  v_customer_name TEXT;
  v_card_name TEXT;
  v_log_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role_id = 1
  ) THEN
    RAISE EXCEPTION 'Only admin users can add stamps manually';
  END IF;
  
  -- Get customer card details
  SELECT cc.*, c.name, sc.name INTO v_customer_card, v_customer_name, v_card_name
  FROM customer_cards cc
  JOIN customers c ON cc.customer_id = c.id
  JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
  WHERE cc.id = p_customer_card_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer card not found');
  END IF;
  
  -- Update stamps
  UPDATE customer_cards 
  SET current_stamps = current_stamps + p_stamp_count
  WHERE id = p_customer_card_id;
  
  -- Log the action
  SELECT log_admin_action(
    p_admin_id,
    'add_stamp',
    'customer',
    v_customer_card.customer_id,
    v_customer_name,
    p_comment,
    json_build_object('stamps_added', p_stamp_count, 'card_name', v_card_name)
  ) INTO v_log_id;
  
  RETURN json_build_object(
    'success', true,
    'new_stamp_count', v_customer_card.current_stamps + p_stamp_count,
    'log_id', v_log_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to extend membership
CREATE OR REPLACE FUNCTION admin_extend_membership(
  p_admin_id UUID,
  p_customer_card_id UUID,
  p_days_to_add INTEGER,
  p_comment TEXT
)
RETURNS JSON AS $$
DECLARE
  v_customer_card customer_cards%ROWTYPE;
  v_customer_name TEXT;
  v_card_name TEXT;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_log_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role_id = 1
  ) THEN
    RAISE EXCEPTION 'Only admin users can extend memberships';
  END IF;
  
  -- Get customer card details
  SELECT cc.*, c.name, mc.name INTO v_customer_card, v_customer_name, v_card_name
  FROM customer_cards cc
  JOIN customers c ON cc.customer_id = c.id
  JOIN membership_cards mc ON cc.stamp_card_id = mc.id
  WHERE cc.id = p_customer_card_id
  AND cc.membership_type = 'gym';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Membership card not found');
  END IF;
  
  -- Calculate new expiry date
  v_new_expiry := COALESCE(v_customer_card.expiry_date, NOW()) + (p_days_to_add || ' days')::INTERVAL;
  
  -- Update expiry date
  UPDATE customer_cards 
  SET expiry_date = v_new_expiry
  WHERE id = p_customer_card_id;
  
  -- Log the action
  SELECT log_admin_action(
    p_admin_id,
    'extend_membership',
    'customer',
    v_customer_card.customer_id,
    v_customer_name,
    p_comment,
    json_build_object('days_added', p_days_to_add, 'new_expiry', v_new_expiry, 'card_name', v_card_name)
  ) INTO v_log_id;
  
  RETURN json_build_object(
    'success', true,
    'new_expiry_date', v_new_expiry,
    'log_id', v_log_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to flag/unflag businesses
CREATE OR REPLACE FUNCTION admin_flag_business(
  p_admin_id UUID,
  p_business_id UUID,
  p_flag_status BOOLEAN,
  p_comment TEXT
)
RETURNS JSON AS $$
DECLARE
  v_business_name TEXT;
  v_log_id UUID;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role_id = 1
  ) THEN
    RAISE EXCEPTION 'Only admin users can flag businesses';
  END IF;
  
  -- Get business name
  SELECT name INTO v_business_name
  FROM businesses
  WHERE id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Business not found');
  END IF;
  
  -- Update flag status
  UPDATE businesses 
  SET is_flagged = p_flag_status
  WHERE id = p_business_id;
  
  -- Log the action
  SELECT log_admin_action(
    p_admin_id,
    CASE WHEN p_flag_status THEN 'flag_business' ELSE 'unflag_business' END,
    'business',
    p_business_id,
    v_business_name,
    p_comment,
    json_build_object('flagged', p_flag_status)
  ) INTO v_log_id;
  
  RETURN json_build_object(
    'success', true,
    'business_name', v_business_name,
    'flagged', p_flag_status,
    'log_id', v_log_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for admin dashboard metrics
CREATE OR REPLACE VIEW admin_dashboard_metrics AS
SELECT 
  (SELECT COUNT(*) FROM businesses WHERE status = 'active') as active_businesses,
  (SELECT COUNT(*) FROM businesses WHERE is_flagged = true) as flagged_businesses,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM customer_cards) as total_customer_cards,
  (SELECT COUNT(*) FROM stamp_cards) as total_stamp_cards,
  (SELECT COUNT(*) FROM membership_cards) as total_membership_cards,
  (SELECT COUNT(*) FROM session_usage WHERE created_at >= NOW() - INTERVAL '24 hours') as recent_activity,
  (SELECT COUNT(*) FROM businesses WHERE created_at >= NOW() - INTERVAL '7 days') as new_businesses_week,
  (SELECT COUNT(*) FROM customers WHERE created_at >= NOW() - INTERVAL '7 days') as new_customers_week;

-- Grant access to admin dashboard metrics view
GRANT SELECT ON admin_dashboard_metrics TO authenticated;

-- Create RLS policy for admin dashboard metrics (admin only)
CREATE POLICY IF NOT EXISTS "Admin only dashboard metrics" ON admin_dashboard_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

-- Add updated_at trigger for businesses table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column to businesses if it doesn't exist
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for businesses updated_at
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (for testing)
-- Note: This should be done carefully in production
DO $$
BEGIN
  -- Only insert if no admin exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE role_id = 1) THEN
    INSERT INTO users (id, email, role_id) 
    VALUES (
      '00000000-0000-0000-0000-000000000001'::UUID,
      'admin@rewardjar.com',
      1
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$; 