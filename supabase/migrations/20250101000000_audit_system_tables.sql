-- RewardJar 4.0 - Audit System Tables
-- Migration for audit history and alert notification tracking
-- Created: January 2025

-- Create audit_history table for storing audit results
CREATE TABLE IF NOT EXISTS audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL CHECK (audit_type IN ('health-check', 'route-testing', 'comprehensive-audit', 'daily-report', 'custom')),
  audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  results JSONB NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_history_type ON audit_history(audit_type);
CREATE INDEX IF NOT EXISTS idx_audit_history_date ON audit_history(audit_date);
CREATE INDEX IF NOT EXISTS idx_audit_history_created_at ON audit_history(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_history_created_by ON audit_history(created_by);

-- Create alert_notifications table for tracking alert deliveries
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('info', 'warning', 'error', 'critical')),
  alert_message TEXT NOT NULL,
  notification_channel TEXT NOT NULL CHECK (notification_channel IN ('slack', 'email', 'sms', 'webhook')),
  notification_success BOOLEAN NOT NULL DEFAULT false,
  notification_error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alert notifications
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_level ON alert_notifications(alert_level);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_channel ON alert_notifications(notification_channel);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_sent_at ON alert_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_success ON alert_notifications(notification_success);

-- Create system_metrics table for performance tracking
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('response_time', 'error_rate', 'uptime', 'resource_usage')),
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT NOT NULL,
  service_name TEXT,
  endpoint_name TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_metrics_service ON system_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_endpoint ON system_metrics(endpoint_name);

-- Create audit_events table for real-time event tracking
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('route_test', 'health_check', 'simulation', 'auth_event', 'system_alert')),
  event_severity TEXT NOT NULL CHECK (event_severity IN ('info', 'warning', 'error', 'critical')),
  event_data JSONB NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit events
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(event_severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

-- Create RLS policies for audit_history table
ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;

-- Admin users can read all audit history
CREATE POLICY "Admin users can read all audit history" ON audit_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Admin users can insert audit history
CREATE POLICY "Admin users can insert audit history" ON audit_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Admin users can update their own audit history
CREATE POLICY "Admin users can update audit history" ON audit_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Admin users can delete old audit history
CREATE POLICY "Admin users can delete audit history" ON audit_history
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Create RLS policies for alert_notifications table
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Admin users can read all alert notifications
CREATE POLICY "Admin users can read all alert notifications" ON alert_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Admin users can insert alert notifications
CREATE POLICY "Admin users can insert alert notifications" ON alert_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Create RLS policies for system_metrics table
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Admin users can read all system metrics
CREATE POLICY "Admin users can read all system metrics" ON system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Admin users can insert system metrics
CREATE POLICY "Admin users can insert system metrics" ON system_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Create RLS policies for audit_events table
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Admin users can read all audit events
CREATE POLICY "Admin users can read all audit events" ON audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Admin users can insert audit events
CREATE POLICY "Admin users can insert audit events" ON audit_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role_id = 1
    )
  );

-- Users can read their own audit events
CREATE POLICY "Users can read their own audit events" ON audit_events
  FOR SELECT USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for audit_history table
DROP TRIGGER IF EXISTS update_audit_history_updated_at ON audit_history;
CREATE TRIGGER update_audit_history_updated_at
  BEFORE UPDATE ON audit_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old audit data
CREATE OR REPLACE FUNCTION cleanup_old_audit_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Keep last 90 days of audit history
  cutoff_date := NOW() - INTERVAL '90 days';
  
  -- Delete old audit history
  DELETE FROM audit_history WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old alert notifications (keep 30 days)
  DELETE FROM alert_notifications WHERE created_at < (NOW() - INTERVAL '30 days');
  
  -- Delete old system metrics (keep 7 days)
  DELETE FROM system_metrics WHERE created_at < (NOW() - INTERVAL '7 days');
  
  -- Delete old audit events (keep 30 days)
  DELETE FROM audit_events WHERE created_at < (NOW() - INTERVAL '30 days');
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get audit summary statistics
CREATE OR REPLACE FUNCTION get_audit_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '24 hours'),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_audits', COUNT(*),
    'health_checks', COUNT(*) FILTER (WHERE audit_type = 'health-check'),
    'route_tests', COUNT(*) FILTER (WHERE audit_type = 'route-testing'),
    'comprehensive_audits', COUNT(*) FILTER (WHERE audit_type = 'comprehensive-audit'),
    'critical_alerts', (
      SELECT COUNT(*) FROM alert_notifications 
      WHERE alert_level = 'critical' 
      AND sent_at BETWEEN start_date AND end_date
    ),
    'average_response_time', (
      SELECT AVG((results->>'averageResponseTime')::numeric) 
      FROM audit_history 
      WHERE audit_type = 'route-testing' 
      AND created_at BETWEEN start_date AND end_date
    ),
    'system_uptime_percentage', (
      SELECT 
        ROUND(
          (COUNT(*) FILTER (WHERE results->>'status' = 'healthy') * 100.0 / COUNT(*))::numeric, 2
        )
      FROM audit_history 
      WHERE audit_type = 'health-check' 
      AND created_at BETWEEN start_date AND end_date
    )
  ) INTO result
  FROM audit_history
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comments to tables for documentation
COMMENT ON TABLE audit_history IS 'Stores comprehensive audit results for trend analysis and reporting';
COMMENT ON TABLE alert_notifications IS 'Tracks all alert notifications sent through various channels';
COMMENT ON TABLE system_metrics IS 'Stores system performance metrics for monitoring and analysis';
COMMENT ON TABLE audit_events IS 'Real-time audit events for WebSocket monitoring and immediate alerts';

COMMENT ON COLUMN audit_history.audit_type IS 'Type of audit performed (health-check, route-testing, comprehensive-audit, daily-report, custom)';
COMMENT ON COLUMN audit_history.results IS 'JSON object containing the complete audit results';
COMMENT ON COLUMN alert_notifications.notification_channel IS 'Channel used to send the alert (slack, email, sms, webhook)';
COMMENT ON COLUMN system_metrics.metric_type IS 'Type of metric being recorded (response_time, error_rate, uptime, resource_usage)';
COMMENT ON COLUMN audit_events.event_severity IS 'Severity level of the audit event (info, warning, error, critical)';

-- Insert initial data for testing (optional)
-- This can be removed in production
INSERT INTO audit_history (audit_type, audit_date, results, created_by) 
VALUES (
  'health-check',
  NOW(),
  '{"status": "healthy", "services": {"supabase": "connected", "database": "connected"}, "timestamp": "' || NOW()::text || '"}',
  NULL
) ON CONFLICT DO NOTHING;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON audit_history TO authenticated;
GRANT SELECT ON alert_notifications TO authenticated;
GRANT SELECT ON system_metrics TO authenticated;
GRANT SELECT ON audit_events TO authenticated;