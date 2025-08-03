-- RewardJar 4.0 - Wallet Provisioning Status Table
-- Generated: December 29, 2024
-- Purpose: Track multi-wallet provisioning status for loyalty cards

-- Create wallet provisioning status tracking table
CREATE TABLE IF NOT EXISTS wallet_provisioning_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  apple_status TEXT CHECK (apple_status IN ('pending', 'provisioned', 'failed', 'not_supported')) DEFAULT 'pending',
  google_status TEXT CHECK (google_status IN ('pending', 'provisioned', 'failed', 'not_supported')) DEFAULT 'pending',
  pwa_status TEXT CHECK (pwa_status IN ('pending', 'provisioned', 'failed', 'not_supported')) DEFAULT 'pending',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one status record per card
  UNIQUE(card_id)
);

-- Add RLS policies for wallet provisioning status
ALTER TABLE wallet_provisioning_status ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admin only wallet provisioning access" ON wallet_provisioning_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role_id = 1
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_provisioning_status_card_id ON wallet_provisioning_status(card_id);
CREATE INDEX IF NOT EXISTS idx_wallet_provisioning_status_last_updated ON wallet_provisioning_status(last_updated);

-- Add comments for documentation
COMMENT ON TABLE wallet_provisioning_status IS 'Tracks multi-platform wallet provisioning status for loyalty cards';
COMMENT ON COLUMN wallet_provisioning_status.card_id IS 'Reference to the stamp card being provisioned';
COMMENT ON COLUMN wallet_provisioning_status.apple_status IS 'Apple Wallet provisioning status';
COMMENT ON COLUMN wallet_provisioning_status.google_status IS 'Google Wallet provisioning status';
COMMENT ON COLUMN wallet_provisioning_status.pwa_status IS 'PWA wallet provisioning status';
COMMENT ON COLUMN wallet_provisioning_status.metadata IS 'Additional provisioning data and admin context';

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_wallet_provisioning_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallet_provisioning_status_updated_at
  BEFORE UPDATE ON wallet_provisioning_status
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_provisioning_status_timestamp();

-- Insert initial status for existing cards (optional)
-- This can be run to backfill status for existing cards
/*
INSERT INTO wallet_provisioning_status (card_id, apple_status, google_status, pwa_status)
SELECT 
  id as card_id,
  'pending' as apple_status,
  'pending' as google_status,
  'pending' as pwa_status
FROM stamp_cards
WHERE id NOT IN (SELECT card_id FROM wallet_provisioning_status)
ON CONFLICT (card_id) DO NOTHING;
*/