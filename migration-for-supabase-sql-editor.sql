-- RewardJar 4.0 - Complete Schema Migration for Supabase SQL Editor
-- Purpose: Add all missing canonical schema columns to support admin card creation
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Date: 2025-08-04

-- ================================
-- 1. ADD MISSING CANONICAL COLUMNS
-- ================================

-- Add card_name (maps to legacy 'name')
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS card_name TEXT;

-- Add reward (new field)
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS reward TEXT;

-- Add stamps_required (maps to legacy 'total_stamps')
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS stamps_required INTEGER 
CHECK (stamps_required > 0 AND stamps_required <= 20);

-- Add barcode_type (THE MAIN MISSING COLUMN)
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS barcode_type TEXT 
CHECK (barcode_type IN ('PDF417', 'QR_CODE')) 
DEFAULT 'QR_CODE';

-- Add card_expiry_days (maps to legacy 'expiry_days')
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS card_expiry_days INTEGER DEFAULT 60 
CHECK (card_expiry_days > 0);

-- Add information fields
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS card_description TEXT DEFAULT 'Collect stamps to get rewards';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS how_to_earn_stamp TEXT DEFAULT 'Buy anything to get a stamp';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS reward_details TEXT DEFAULT '';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS earned_stamp_message TEXT DEFAULT 'Just [#] more stamps to get your reward!';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS earned_reward_message TEXT DEFAULT 'Reward is earned and waiting for you!';

-- ================================
-- 2. MIGRATE EXISTING DATA
-- ================================

-- Copy legacy data to canonical columns
UPDATE stamp_cards 
SET card_name = name 
WHERE card_name IS NULL AND name IS NOT NULL;

UPDATE stamp_cards 
SET reward = reward_description 
WHERE reward IS NULL AND reward_description IS NOT NULL;

UPDATE stamp_cards 
SET stamps_required = total_stamps 
WHERE stamps_required IS NULL AND total_stamps IS NOT NULL;

UPDATE stamp_cards 
SET card_expiry_days = expiry_days 
WHERE card_expiry_days IS NULL AND expiry_days IS NOT NULL;

-- Set default barcode_type for all existing records
UPDATE stamp_cards 
SET barcode_type = 'QR_CODE' 
WHERE barcode_type IS NULL;

-- Set default values for information fields
UPDATE stamp_cards 
SET card_description = 'Collect stamps to get rewards'
WHERE card_description IS NULL OR card_description = '';

UPDATE stamp_cards 
SET how_to_earn_stamp = 'Buy anything to get a stamp'
WHERE how_to_earn_stamp IS NULL OR how_to_earn_stamp = '';

UPDATE stamp_cards 
SET reward_details = COALESCE(reward_description, '')
WHERE reward_details IS NULL OR reward_details = '';

UPDATE stamp_cards 
SET earned_stamp_message = 'Just ' || COALESCE(stamps_required::text, total_stamps::text, '5') || ' stamps to get your reward!'
WHERE earned_stamp_message IS NULL OR earned_stamp_message = '';

UPDATE stamp_cards 
SET earned_reward_message = 'Reward is earned and waiting for you!'
WHERE earned_reward_message IS NULL OR earned_reward_message = '';

-- ================================
-- 3. ADD COLUMN COMMENTS
-- ================================

COMMENT ON COLUMN stamp_cards.barcode_type IS 'Type of barcode/QR code to display on loyalty cards (PDF417 or QR_CODE)';
COMMENT ON COLUMN stamp_cards.card_name IS 'Display name for the loyalty card (canonical field, maps from legacy name)';
COMMENT ON COLUMN stamp_cards.reward IS 'Reward description (canonical field, maps from legacy reward_description)';
COMMENT ON COLUMN stamp_cards.stamps_required IS 'Number of stamps needed for reward (canonical field, maps from legacy total_stamps)';
COMMENT ON COLUMN stamp_cards.card_expiry_days IS 'Days until customer card expires (canonical field, maps from legacy expiry_days)';

-- ================================
-- 4. VERIFICATION QUERIES
-- ================================

-- Check if all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stamp_cards' 
  AND table_schema = 'public'
  AND column_name IN (
    'barcode_type',
    'card_name',
    'reward',
    'stamps_required',
    'card_expiry_days',
    'card_description',
    'how_to_earn_stamp',
    'reward_details',
    'earned_stamp_message',
    'earned_reward_message'
  )
ORDER BY column_name;

-- Check barcode_type values
SELECT 
  barcode_type,
  COUNT(*) as count
FROM stamp_cards 
GROUP BY barcode_type;

-- Verify data migration
SELECT 
  id,
  -- Legacy columns
  name as legacy_name,
  total_stamps as legacy_total_stamps,
  reward_description as legacy_reward_desc,
  expiry_days as legacy_expiry,
  -- Canonical columns
  card_name,
  stamps_required,
  reward,
  card_expiry_days,
  barcode_type
FROM stamp_cards
LIMIT 5;

-- Count records
SELECT 
  COUNT(*) as total_cards,
  COUNT(barcode_type) as cards_with_barcode_type,
  COUNT(card_name) as cards_with_card_name,
  COUNT(reward) as cards_with_reward,
  COUNT(stamps_required) as cards_with_stamps_required
FROM stamp_cards;

-- ================================
-- 5. SUCCESS MESSAGE
-- ================================

DO $$
BEGIN
  RAISE NOTICE '✅ RewardJar 4.0 Schema Migration Complete!';
  RAISE NOTICE '🔧 Added missing canonical columns to stamp_cards table';
  RAISE NOTICE '📊 Migrated existing data from legacy to canonical columns';
  RAISE NOTICE '🎯 barcode_type column added - this was the main issue!';
  RAISE NOTICE '🚀 Admin card creation should now work without schema errors';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '1. Wait 5-10 minutes for Supabase schema cache to refresh';
  RAISE NOTICE '2. Or manually refresh: Dashboard → Database → API → Refresh';
  RAISE NOTICE '3. Test admin card creation at /admin/cards/new';
  RAISE NOTICE '4. Run test suite: node scripts/test-admin-schema-fix.js';
END $$;