-- Check current field names in your database
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'stamp_cards' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'customer_cards' AND table_schema = 'public'  
ORDER BY ordinal_position;
