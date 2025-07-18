-- Migration script to fix test_results table duration_ms column type
-- Run this if you're getting "invalid input syntax for type integer" errors

-- Check if test_results table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_results') THEN
        
        -- Check current column type
        RAISE NOTICE 'Checking current duration_ms column type...';
        
        -- Update duration_ms column to ensure it's integer type
        ALTER TABLE test_results 
        ALTER COLUMN duration_ms TYPE INTEGER USING ROUND(duration_ms::NUMERIC);
        
        -- Update response_size_kb column to ensure it's integer type  
        ALTER TABLE test_results 
        ALTER COLUMN response_size_kb TYPE INTEGER USING ROUND(response_size_kb::NUMERIC);
        
        RAISE NOTICE 'Successfully updated duration_ms and response_size_kb to INTEGER type';
        
    ELSE
        RAISE NOTICE 'test_results table does not exist. Creating it...';
        
        -- Create the table with correct types
        CREATE TABLE test_results (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            card_id TEXT NOT NULL,
            test_type TEXT NOT NULL CHECK (test_type IN ('google_wallet', 'apple_wallet', 'pwa_wallet', 'qr_code')),
            status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
            duration_ms INTEGER NOT NULL DEFAULT 0,
            response_size_kb INTEGER DEFAULT 0,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes for better performance
        CREATE INDEX idx_test_results_test_type ON test_results(test_type);
        CREATE INDEX idx_test_results_status ON test_results(status);
        CREATE INDEX idx_test_results_created_at ON test_results(created_at DESC);
        CREATE INDEX idx_test_results_card_id ON test_results(card_id);
        
        -- Enable Row Level Security
        ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy for authenticated users
        CREATE POLICY "Enable access for authenticated users" ON test_results
            FOR ALL USING (auth.role() = 'authenticated');
            
        -- Create RLS policy for service role
        CREATE POLICY "Enable full access for service role" ON test_results
            FOR ALL USING (auth.role() = 'service_role');
        
        RAISE NOTICE 'Successfully created test_results table with INTEGER types';
        
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'test_results' 
    AND column_name IN ('duration_ms', 'response_size_kb')
ORDER BY column_name; 