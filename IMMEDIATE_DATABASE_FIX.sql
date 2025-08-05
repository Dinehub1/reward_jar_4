-- IMMEDIATE FIX: Apply Real-Time Triggers for Admin Dashboard
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This will enable immediate admin dashboard updates when data changes

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_admin_customer_cards_change ON customer_cards;
DROP TRIGGER IF EXISTS notify_admin_businesses_change ON businesses;
DROP TRIGGER IF EXISTS notify_admin_customers_change ON customers;
DROP TRIGGER IF EXISTS notify_admin_stamp_cards_change ON stamp_cards;
DROP TRIGGER IF EXISTS notify_admin_membership_cards_change ON membership_cards;

DROP FUNCTION IF EXISTS notify_admin_dashboard();

-- Create notification function
CREATE OR REPLACE FUNCTION notify_admin_dashboard()
RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  -- Build notification payload
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'timestamp', NOW(),
    'record_id', CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END
  );

  -- Send notification on admin dashboard channel
  PERFORM pg_notify('admin_dashboard_update', payload::text);
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all relevant tables

-- Customer cards trigger (most important - affects stats and activity)
CREATE TRIGGER notify_admin_customer_cards_change
  AFTER INSERT OR UPDATE OR DELETE ON customer_cards
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_dashboard();

-- Businesses trigger (affects business count and flagged status)
CREATE TRIGGER notify_admin_businesses_change
  AFTER INSERT OR UPDATE OR DELETE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_dashboard();

-- Customers trigger (affects customer count)
CREATE TRIGGER notify_admin_customers_change
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_dashboard();

-- Stamp cards trigger (affects card templates count)
CREATE TRIGGER notify_admin_stamp_cards_change
  AFTER INSERT OR UPDATE OR DELETE ON stamp_cards
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_dashboard();

-- Membership cards trigger (affects card templates count)
CREATE TRIGGER notify_admin_membership_cards_change
  AFTER INSERT OR UPDATE OR DELETE ON membership_cards
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_dashboard();

-- Enable real-time for admin dashboard tables
ALTER PUBLICATION supabase_realtime ADD TABLE customer_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE stamp_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE membership_cards;

-- Success message
SELECT 'Admin dashboard triggers installed successfully! Real-time sync is now active.' as status;