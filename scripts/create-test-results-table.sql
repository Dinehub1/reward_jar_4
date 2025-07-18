-- Create test_results table for tracking PKPass generation performance
-- This table stores results from the Apple Wallet test suite

CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id VARCHAR(255) NOT NULL,
  test_type VARCHAR(50) NOT NULL, -- 'apple', 'google', 'pwa'
  customer_card_id UUID REFERENCES customer_cards(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'pending'
  response_time_ms INTEGER DEFAULT 0,
  file_size_bytes INTEGER DEFAULT 0,
  content_type VARCHAR(100),
  error_message TEXT,
  pass_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_customer_card_id ON test_results(customer_card_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_test_type ON test_results(test_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_test_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER test_results_updated_at_trigger
  BEFORE UPDATE ON test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_test_results_updated_at();

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
  AVG(response_time_ms) as avg_response_time_ms,
  AVG(file_size_bytes) as avg_file_size_bytes,
  MIN(created_at) as first_test,
  MAX(created_at) as last_test
FROM test_results
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY test_type;

-- Grant access to the view
GRANT SELECT ON test_performance_metrics TO authenticated, anon;

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
GRANT EXECUTE ON FUNCTION cleanup_old_test_results() TO authenticated;

-- Insert some sample test results for demonstration
INSERT INTO test_results (
  test_id, test_type, url, status, response_time_ms, file_size_bytes, content_type
) VALUES 
  ('sample-apple-1', 'apple', '/api/wallet/apple/sample-1', 'success', 1250, 15360, 'application/vnd.apple.pkpass'),
  ('sample-apple-2', 'apple', '/api/wallet/apple/sample-2', 'success', 980, 14720, 'application/vnd.apple.pkpass'),
  ('sample-google-1', 'google', '/api/wallet/google/sample-1', 'success', 750, 2048, 'application/json'),
  ('sample-pwa-1', 'pwa', '/api/wallet/pwa/sample-1', 'success', 420, 8192, 'text/html')
ON CONFLICT DO NOTHING;

-- Add comment to table
COMMENT ON TABLE test_results IS 'Tracks Apple Wallet test suite results and performance metrics';
COMMENT ON COLUMN test_results.test_id IS 'Unique identifier for the test run';
COMMENT ON COLUMN test_results.test_type IS 'Type of wallet test: apple, google, or pwa';
COMMENT ON COLUMN test_results.customer_card_id IS 'Reference to the customer card being tested';
COMMENT ON COLUMN test_results.response_time_ms IS 'Response time in milliseconds';
COMMENT ON COLUMN test_results.file_size_bytes IS 'Size of generated file in bytes';
COMMENT ON COLUMN test_results.pass_data IS 'JSON data of the generated pass (for debugging)'; 