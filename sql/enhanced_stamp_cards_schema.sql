-- RewardJar 4.0 - Enhanced Stamp Cards Schema Update
-- Generated: December 29, 2024
-- Purpose: Add new fields for admin card creation as per documentation

-- Add new columns to stamp_cards table for enhanced card creation
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '#8B4513';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS icon_emoji TEXT DEFAULT '☕';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS expiry_days INTEGER DEFAULT 60 CHECK (expiry_days > 0);

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS reward_expiry_days INTEGER DEFAULT 15 CHECK (reward_expiry_days > 0);

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS stamp_config JSONB DEFAULT '{
  "manualStampOnly": true,
  "minSpendAmount": 0,
  "billProofRequired": false,
  "maxStampsPerDay": 1,
  "duplicateVisitBuffer": "12h"
}'::jsonb;

-- Add column comments for clarity
COMMENT ON COLUMN stamp_cards.card_color IS 'Hex color code for card background (e.g., #FF5733)';
COMMENT ON COLUMN stamp_cards.icon_emoji IS 'Emoji icon for card display (e.g., 🍕, ☕, 🛍️)';
COMMENT ON COLUMN stamp_cards.expiry_days IS 'Number of days until customer card expires (default: 60)';
COMMENT ON COLUMN stamp_cards.reward_expiry_days IS 'Number of days reward remains valid after unlock (default: 15)';
COMMENT ON COLUMN stamp_cards.stamp_config IS 'JSON configuration for stamp logic rules and anti-abuse settings';

-- Update existing stamp cards with default values where null
UPDATE stamp_cards 
SET card_color = '#8B4513' 
WHERE card_color IS NULL;

UPDATE stamp_cards 
SET icon_emoji = '☕' 
WHERE icon_emoji IS NULL;

UPDATE stamp_cards 
SET expiry_days = 60 
WHERE expiry_days IS NULL;

UPDATE stamp_cards 
SET reward_expiry_days = 15 
WHERE reward_expiry_days IS NULL;

UPDATE stamp_cards 
SET stamp_config = '{
  "manualStampOnly": true,
  "minSpendAmount": 0,
  "billProofRequired": false,
  "maxStampsPerDay": 1,
  "duplicateVisitBuffer": "12h"
}'::jsonb
WHERE stamp_config IS NULL;

-- Verify the schema update
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stamp_cards' 
  AND table_schema = 'public'
  AND column_name IN ('card_color', 'icon_emoji', 'expiry_days', 'reward_expiry_days', 'stamp_config')
ORDER BY ordinal_position;