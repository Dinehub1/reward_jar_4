-- Add updated_at columns to existing tables for Apple Wallet synchronization
-- Run this in your Supabase SQL editor to add missing columns

-- 1. Add updated_at column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add updated_at column to stamp_cards table  
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add updated_at column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Add updated_at column to customer_cards table (CRITICAL for wallet updates)
ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Add updated_at column to stamps table
ALTER TABLE stamps 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Add updated_at column to rewards table
ALTER TABLE rewards 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Create wallet_update_queue table for async wallet updates
CREATE TABLE IF NOT EXISTS wallet_update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_card_id UUID NOT NULL REFERENCES customer_cards(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('stamp_update', 'reward_complete', 'card_update')),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  failed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create index on wallet_update_queue for performance
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_processed 
ON wallet_update_queue (processed, created_at);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers to automatically update updated_at on all tables
CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON businesses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stamp_cards_updated_at 
  BEFORE UPDATE ON stamp_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_cards_updated_at 
  BEFORE UPDATE ON customer_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stamps_updated_at 
  BEFORE UPDATE ON stamps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at 
  BEFORE UPDATE ON rewards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_update_queue_updated_at 
  BEFORE UPDATE ON wallet_update_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Create function to trigger wallet updates when customer_cards change
CREATE OR REPLACE FUNCTION trigger_wallet_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on stamp count changes or significant updates
  IF OLD.current_stamps IS DISTINCT FROM NEW.current_stamps 
     OR OLD.wallet_type IS DISTINCT FROM NEW.wallet_type 
     OR OLD.wallet_pass_id IS DISTINCT FROM NEW.wallet_pass_id THEN
    
    -- Insert into update queue for async processing
    INSERT INTO wallet_update_queue (customer_card_id, update_type, created_at)
    VALUES (NEW.id, 
            CASE 
              WHEN NEW.current_stamps >= (SELECT total_stamps FROM stamp_cards WHERE id = NEW.stamp_card_id) 
              THEN 'reward_complete'
              ELSE 'stamp_update'
            END,
            NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for wallet updates on customer_cards
CREATE TRIGGER trigger_customer_cards_wallet_updates
  AFTER UPDATE ON customer_cards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_wallet_updates();

-- 13. Update existing records to have current timestamp for updated_at
UPDATE businesses SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE stamp_cards SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE customers SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE customer_cards SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE stamps SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE rewards SET updated_at = created_at WHERE updated_at IS NULL;

-- 14. Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('businesses', 'stamp_cards', 'customers', 'customer_cards', 'stamps', 'rewards')
  AND column_name = 'updated_at'
ORDER BY table_name;

-- 15. Test the triggers by updating a customer card
-- This should automatically update the updated_at timestamp and trigger wallet updates
-- Example: UPDATE customer_cards SET current_stamps = current_stamps + 1 WHERE id = 'some-uuid'; 