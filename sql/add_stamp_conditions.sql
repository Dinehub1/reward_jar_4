-- RewardJar 4.0 - Stamp Conditions Database Schema Update
-- Generated: January 1, 2025
-- Purpose: Add stamp condition logic to support per_visit vs min_bill_amount

-- Add stamp condition fields to stamp_cards table
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS stamp_condition TEXT CHECK (stamp_condition IN ('per_visit', 'min_bill_amount')) DEFAULT 'per_visit';

ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS min_bill_amount DECIMAL(10,2) DEFAULT NULL;

-- Add bill amount tracking to session_usage table
ALTER TABLE session_usage 
ADD COLUMN IF NOT EXISTS bill_amount DECIMAL(10,2) DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN stamp_cards.stamp_condition IS 'Determines how stamps are earned: per_visit (automatic) or min_bill_amount (requires minimum purchase)';
COMMENT ON COLUMN stamp_cards.min_bill_amount IS 'Minimum bill amount required to earn a stamp (only used when stamp_condition = min_bill_amount)';
COMMENT ON COLUMN session_usage.bill_amount IS 'Bill amount for this transaction (used for analytics and min_bill_amount validation)';

-- Update existing stamp cards to have default condition
UPDATE stamp_cards 
SET stamp_condition = 'per_visit' 
WHERE stamp_condition IS NULL;