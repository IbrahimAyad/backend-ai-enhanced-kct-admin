-- Create rate limiting tables for distributed rate limiting
-- This enables rate limiting across multiple Edge Functions and instances

-- Table for sliding window rate limiting (stores individual requests)
CREATE TABLE IF NOT EXISTS rate_limit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    endpoint_type TEXT NOT NULL DEFAULT 'api',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table for fixed window rate limiting (stores window counters)
CREATE TABLE IF NOT EXISTS rate_limit_windows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    window_key TEXT NOT NULL UNIQUE,
    identifier TEXT NOT NULL,
    request_count INTEGER DEFAULT 0 NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    endpoint_type TEXT NOT NULL DEFAULT 'api',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table for token bucket rate limiting (stores bucket state)
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE,
    tokens DECIMAL(10,2) DEFAULT 0 NOT NULL,
    max_tokens INTEGER NOT NULL,
    refill_rate DECIMAL(10,4) NOT NULL,
    last_refill TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    endpoint_type TEXT NOT NULL DEFAULT 'api',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_requests_identifier_timestamp 
    ON rate_limit_requests(identifier, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_requests_timestamp 
    ON rate_limit_requests(timestamp) 
    WHERE timestamp > NOW() - INTERVAL '1 day';

CREATE INDEX IF NOT EXISTS idx_rate_limit_requests_endpoint_type 
    ON rate_limit_requests(endpoint_type);

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_window_key 
    ON rate_limit_windows(window_key);

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_expires_at 
    ON rate_limit_windows(expires_at) 
    WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_identifier 
    ON rate_limit_windows(identifier);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_identifier 
    ON rate_limit_buckets(identifier);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_last_refill 
    ON rate_limit_buckets(last_refill) 
    WHERE last_refill > NOW() - INTERVAL '7 days';

-- Partitioning for rate_limit_requests (optional, for high-volume scenarios)
-- This creates monthly partitions to improve query performance
-- Uncomment if you expect high rate limiting traffic

-- CREATE TABLE rate_limit_requests_template (LIKE rate_limit_requests INCLUDING ALL);
-- 
-- CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
-- RETURNS void AS $$
-- DECLARE
--     partition_name text;
--     end_date date;
-- BEGIN
--     partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
--     end_date := start_date + interval '1 month';
--     
--     EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
--                     FOR VALUES FROM (%L) TO (%L)',
--                    partition_name, table_name, start_date, end_date);
--                    
--     EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(identifier, timestamp DESC)',
--                    partition_name || '_idx', partition_name);
-- END;
-- $$ LANGUAGE plpgsql;

-- Automatic cleanup functions
-- Clean old rate limit requests (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_requests 
    WHERE timestamp < NOW() - INTERVAL '24 hours';
    
    -- Log cleanup
    INSERT INTO system_logs (operation, details) 
    VALUES ('rate_limit_cleanup', json_build_object(
        'table', 'rate_limit_requests',
        'cleaned_at', NOW(),
        'retention_hours', 24
    ));
END;
$$ LANGUAGE plpgsql;

-- Clean expired rate limit windows
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limit_windows()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_windows 
    WHERE expires_at < NOW();
    
    -- Log cleanup
    INSERT INTO system_logs (operation, details) 
    VALUES ('rate_limit_cleanup', json_build_object(
        'table', 'rate_limit_windows',
        'cleaned_at', NOW()
    ));
END;
$$ LANGUAGE plpgsql;

-- Clean old token buckets (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_buckets()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_buckets 
    WHERE last_refill < NOW() - INTERVAL '7 days';
    
    -- Log cleanup
    INSERT INTO system_logs (operation, details) 
    VALUES ('rate_limit_cleanup', json_build_object(
        'table', 'rate_limit_buckets',
        'cleaned_at', NOW(),
        'retention_days', 7
    ));
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage rate_limit_requests" ON rate_limit_requests
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rate_limit_windows" ON rate_limit_windows
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rate_limit_buckets" ON rate_limit_buckets
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Authenticated users can only view their own rate limit data
CREATE POLICY "Users can view own rate_limit_requests" ON rate_limit_requests
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        identifier = 'user:' || auth.uid()::text
    );

CREATE POLICY "Users can view own rate_limit_windows" ON rate_limit_windows
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        identifier = 'user:' || auth.uid()::text
    );

CREATE POLICY "Users can view own rate_limit_buckets" ON rate_limit_buckets
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        identifier = 'user:' || auth.uid()::text
    );

-- Policy: Admin users can view all rate limit data
CREATE POLICY "Admin users can view all rate_limit_requests" ON rate_limit_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
            AND (permissions ? 'admin' OR permissions ? 'rate_limit_admin')
        )
    );

CREATE POLICY "Admin users can view all rate_limit_windows" ON rate_limit_windows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
            AND (permissions ? 'admin' OR permissions ? 'rate_limit_admin')
        )
    );

CREATE POLICY "Admin users can view all rate_limit_buckets" ON rate_limit_buckets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
            AND (permissions ? 'admin' OR permissions ? 'rate_limit_admin')
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rate_limit_windows_updated_at
    BEFORE UPDATE ON rate_limit_windows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_buckets_updated_at
    BEFORE UPDATE ON rate_limit_buckets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create scheduled cleanup jobs (requires pg_cron extension)
-- Uncomment if pg_cron is available and you want automatic cleanup

-- SELECT cron.schedule('cleanup-rate-limit-requests', '0 0 * * *', 'SELECT cleanup_old_rate_limit_requests();');
-- SELECT cron.schedule('cleanup-rate-limit-windows', '*/30 * * * *', 'SELECT cleanup_expired_rate_limit_windows();');
-- SELECT cron.schedule('cleanup-rate-limit-buckets', '0 0 * * 0', 'SELECT cleanup_old_rate_limit_buckets();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON rate_limit_requests TO service_role;
GRANT ALL ON rate_limit_windows TO service_role;
GRANT ALL ON rate_limit_buckets TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant read permissions to authenticated users (for their own data)
GRANT SELECT ON rate_limit_requests TO authenticated;
GRANT SELECT ON rate_limit_windows TO authenticated;
GRANT SELECT ON rate_limit_buckets TO authenticated;

-- Create system_logs table if it doesn't exist (for logging cleanup operations)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_logs_operation_created_at 
    ON system_logs(operation, created_at DESC);

-- Enable RLS on system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage system_logs
CREATE POLICY "Service role can manage system_logs" ON system_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Admin users can view system_logs
CREATE POLICY "Admin users can view system_logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
            AND (permissions ? 'admin' OR permissions ? 'system_logs')
        )
    );

GRANT ALL ON system_logs TO service_role;
GRANT SELECT ON system_logs TO authenticated;

-- Insert initial log entry
INSERT INTO system_logs (operation, details) 
VALUES ('rate_limiting_setup', json_build_object(
    'message', 'Rate limiting tables and functions created',
    'version', '1.0.0',
    'created_at', NOW()
));

COMMENT ON TABLE rate_limit_requests IS 'Stores individual requests for sliding window rate limiting';
COMMENT ON TABLE rate_limit_windows IS 'Stores request counters for fixed window rate limiting';
COMMENT ON TABLE rate_limit_buckets IS 'Stores token bucket state for token bucket rate limiting';
COMMENT ON TABLE system_logs IS 'System operation logs including rate limit cleanup operations';