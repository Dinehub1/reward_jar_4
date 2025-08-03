-- RewardJar 4.0 - Add Barcode Type Support
-- Generated: January 1, 2025
-- Purpose: Add barcode_type column to support PDF417 and QR Code options

-- Add barcode_type column to stamp_cards table
ALTER TABLE stamp_cards 
ADD COLUMN IF NOT EXISTS barcode_type TEXT CHECK (barcode_type IN ('PDF417', 'QR_CODE')) DEFAULT 'QR_CODE';

-- Add column comment for clarity
COMMENT ON COLUMN stamp_cards.barcode_type IS 'Type of barcode/QR code to display on loyalty cards (PDF417 or QR_CODE)';

-- Update existing stamp cards with default value
UPDATE stamp_cards 
SET barcode_type = 'QR_CODE' 
WHERE barcode_type IS NULL;

-- Verify the column was added successfully
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stamp_cards' 
  AND table_schema = 'public'
  AND column_name = 'barcode_type'
ORDER BY ordinal_position;