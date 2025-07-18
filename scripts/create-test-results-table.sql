-- Create test_results table for tracking PKPass generation performance
-- This table stores results from the Apple Wallet test suite

-- Drop existing table if it exists (for clean recreation)
DROP TABLE IF EXISTS test_results CASCADE;

-- Create the test_results table
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID, -- Made nullable since customer_cards might not exist
  test_type VARCHAR(50) NOT NULL, -- 'apple', 'google', 'pwa'
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'pending'
  duration_ms INTEGER DEFAULT 0,
  response_size_kb INTEGER DEFAULT 0,
  error_message TEXT,
  test_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_test_results_card_id ON test_results(card_id);
CREATE INDEX idx_test_results_test_type ON test_results(test_type);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_results_created_at ON test_results(created_at);

-- Add RLS policies
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (development/testing)
CREATE POLICY "Allow all operations for authenticated users" ON test_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous read access for test results (for public test interface)
CREATE POLICY "Allow anonymous read access" ON test_results
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous insert for test logging
CREATE POLICY "Allow anonymous insert" ON test_results
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create view for test performance metrics
CREATE OR REPLACE VIEW test_performance_metrics AS
SELECT 
  test_type,
  COUNT(*) as total_tests,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_tests,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_tests,
  ROUND(
    (COUNT(CASE WHEN status = 'success' THEN 1 END)::decimal / COUNT(*)) * 100, 
    2
  ) as success_rate_percent,
  AVG(duration_ms) as avg_duration_ms,
  AVG(response_size_kb) as avg_response_size_kb,
  MIN(created_at) as first_test,
  MAX(created_at) as last_test
FROM test_results
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY test_type;

-- Grant access to the view
GRANT SELECT ON test_performance_metrics TO authenticated, anon;

-- Insert some sample test results for demonstration
INSERT INTO test_results (
  card_id, test_type, status, duration_ms, response_size_kb, test_url
) VALUES 
  (NULL, 'apple', 'success', 1250, 15, '/api/wallet/apple/sample-1'),
  (NULL, 'apple', 'success', 980, 14, '/api/wallet/apple/sample-2'),
  (NULL, 'google', 'success', 750, 2, '/api/wallet/google/sample-1'),
  (NULL, 'pwa', 'success', 420, 8, '/api/wallet/pwa/sample-1'),
  (NULL, 'apple', 'error', 5000, 0, '/api/wallet/apple/error-test'),
  (NULL, 'google', 'error', 3000, 0, '/api/wallet/google/error-test')
ON CONFLICT DO NOTHING;

-- Create function to clean up old test results (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_test_results()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM test_results 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_test_results() TO authenticated, anon;

-- Add comments to table and columns
COMMENT ON TABLE test_results IS 'Tracks Apple Wallet test suite results and performance metrics';
COMMENT ON COLUMN test_results.card_id IS 'Reference to the customer card being tested (nullable)';
COMMENT ON COLUMN test_results.test_type IS 'Type of wallet test: apple, google, or pwa';
COMMENT ON COLUMN test_results.status IS 'Test result status: success, error, or pending';
COMMENT ON COLUMN test_results.duration_ms IS 'Test duration in milliseconds';
COMMENT ON COLUMN test_results.response_size_kb IS 'Size of response in kilobytes';
COMMENT ON COLUMN test_results.error_message IS 'Error message if test failed';
COMMENT ON COLUMN test_results.test_url IS 'URL that was tested';

-- Display table info
SELECT 
  'test_results table created successfully' as message,
  COUNT(*) as sample_records
FROM test_results; 