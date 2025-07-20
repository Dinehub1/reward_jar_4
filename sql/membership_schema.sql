-- RewardJar 4.0 - Gym Membership Schema Extensions
-- Add support for gym membership cards with session tracking and expiry

-- Add unique constraint to businesses table (fix for 42P10 error)
-- Check if constraint exists first, then add if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_business_email' 
        AND table_name = 'businesses'
    ) THEN
        ALTER TABLE businesses ADD CONSTRAINT unique_business_email UNIQUE (email);
    END IF;
END $$;

-- Add membership fields to customer_cards table
ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS membership_type TEXT CHECK (membership_type IN ('loyalty', 'gym')) DEFAULT 'loyalty',
ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sessions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create membership cards table for gym membership templates
CREATE TABLE IF NOT EXISTS membership_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'gym',
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  cost DECIMAL(10,2) NOT NULL,
  duration_days INTEGER DEFAULT 365,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session usage tracking table
CREATE TABLE IF NOT EXISTS session_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_card_id UUID NOT NULL REFERENCES customer_cards(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id),
  marked_by UUID REFERENCES users(id),
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_type TEXT NOT NULL CHECK (usage_type IN ('session', 'stamp')) DEFAULT 'session',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet update queue for real-time synchronization
CREATE TABLE IF NOT EXISTS wallet_update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_card_id UUID NOT NULL REFERENCES customer_cards(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('session_update', 'stamp_update', 'membership_update')),
  metadata JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  failed BOOLEAN DEFAULT FALSE,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_update_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for membership_cards
CREATE POLICY IF NOT EXISTS "membership_cards_business_access" ON membership_cards
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- RLS policies for session_usage  
CREATE POLICY IF NOT EXISTS "session_usage_business_access" ON session_usage
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN customers c ON cc.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- RLS policies for wallet_update_queue
CREATE POLICY IF NOT EXISTS "wallet_update_queue_access" ON wallet_update_queue
  FOR ALL USING (
    customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN customers c ON cc.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
    OR customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Function to update membership status and trigger wallet updates
CREATE OR REPLACE FUNCTION update_membership_wallet_passes()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle membership cards
  IF NEW.membership_type = 'gym' THEN
    -- Update expiry status if needed
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= NOW() THEN
      -- Don't automatically update status - let business logic handle it
      NULL;
    END IF;
    
    -- Only trigger wallet updates on session/stamp count changes
    IF OLD.sessions_used IS DISTINCT FROM NEW.sessions_used 
       OR OLD.current_stamps IS DISTINCT FROM NEW.current_stamps THEN
      -- Insert into update queue for async processing
      INSERT INTO wallet_update_queue (
        customer_card_id, 
        update_type, 
        metadata,
        created_at
      ) VALUES (
        NEW.id, 
        CASE 
          WHEN OLD.sessions_used IS DISTINCT FROM NEW.sessions_used THEN 'session_update'
          WHEN OLD.current_stamps IS DISTINCT FROM NEW.current_stamps THEN 'stamp_update'
          ELSE 'membership_update'
        END,
        jsonb_build_object(
          'sessions_used', NEW.sessions_used,
          'sessions_remaining', COALESCE(NEW.total_sessions, 0) - NEW.sessions_used,
          'current_stamps', NEW.current_stamps,
          'total_stamps', COALESCE((
            SELECT total_stamps FROM stamp_cards WHERE id = NEW.stamp_card_id
          ), 0),
          'expiry_date', NEW.expiry_date,
          'cost', NEW.cost,
          'membership_type', NEW.membership_type
        ),
        NOW()
      );
    END IF;
  ELSE
    -- Handle loyalty cards (existing logic)
    IF OLD.current_stamps IS DISTINCT FROM NEW.current_stamps THEN
      INSERT INTO wallet_update_queue (customer_card_id, update_type, created_at)
      VALUES (NEW.id, 'stamp_update', NOW());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger on customer_cards table
DROP TRIGGER IF EXISTS trigger_membership_wallet_updates ON customer_cards;
CREATE TRIGGER trigger_membership_wallet_updates
  AFTER UPDATE ON customer_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_wallet_passes();

-- Function to mark session usage
CREATE OR REPLACE FUNCTION mark_session_usage(
  p_customer_card_id UUID,
  p_business_id UUID,
  p_marked_by UUID DEFAULT NULL,
  p_usage_type TEXT DEFAULT 'session',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_customer_card customer_cards%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get customer card details
  SELECT * INTO v_customer_card 
  FROM customer_cards 
  WHERE id = p_customer_card_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer card not found');
  END IF;
  
  -- Validate membership type and usage type
  IF v_customer_card.membership_type = 'gym' AND p_usage_type = 'session' THEN
    -- Check if sessions remaining
    IF v_customer_card.sessions_used >= COALESCE(v_customer_card.total_sessions, 0) THEN
      RETURN json_build_object('success', false, 'error', 'No sessions remaining');
    END IF;
    
    -- Check expiry
    IF v_customer_card.expiry_date IS NOT NULL AND v_customer_card.expiry_date < NOW() THEN
      RETURN json_build_object('success', false, 'error', 'Membership expired');
    END IF;
    
    -- Record session usage
    INSERT INTO session_usage (
      customer_card_id, business_id, marked_by, usage_type, notes
    ) VALUES (
      p_customer_card_id, p_business_id, p_marked_by, p_usage_type, p_notes
    );
    
    -- Update sessions used
    UPDATE customer_cards 
    SET sessions_used = sessions_used + 1
    WHERE id = p_customer_card_id;
    
    v_result := json_build_object(
      'success', true,
      'sessions_used', v_customer_card.sessions_used + 1,
      'sessions_remaining', COALESCE(v_customer_card.total_sessions, 0) - (v_customer_card.sessions_used + 1)
    );
    
  ELSIF p_usage_type = 'stamp' THEN
    -- Handle stamp addition for loyalty cards
    INSERT INTO session_usage (
      customer_card_id, business_id, marked_by, usage_type, notes
    ) VALUES (
      p_customer_card_id, p_business_id, p_marked_by, p_usage_type, p_notes
    );
    
    -- Update stamps
    UPDATE customer_cards 
    SET current_stamps = current_stamps + 1
    WHERE id = p_customer_card_id;
    
    v_result := json_build_object(
      'success', true,
      'current_stamps', v_customer_card.current_stamps + 1
    );
    
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid usage type for card type');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customer_cards_membership_type ON customer_cards(membership_type);
CREATE INDEX IF NOT EXISTS idx_session_usage_customer_card ON session_usage(customer_card_id);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_processed ON wallet_update_queue(processed, created_at);

-- Insert sample gym membership card template for testing (using ON CONFLICT DO NOTHING)
INSERT INTO membership_cards (
  business_id, name, membership_type, total_sessions, cost, duration_days
) 
SELECT 
  b.id,
  'Premium Gym Membership',
  'gym',
  20,
  15000.00,
  365
FROM businesses b 
WHERE b.name LIKE '%Test%' OR b.name LIKE '%Gym%'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMENT ON TABLE membership_cards IS 'Templates for gym memberships and other session-based cards';
COMMENT ON TABLE session_usage IS 'Tracks individual session or stamp usage events';
COMMENT ON TABLE wallet_update_queue IS 'Queue for async wallet pass updates';
COMMENT ON FUNCTION mark_session_usage IS 'Function to mark session or stamp usage with validation'; 