-- Create webhook logs table for tracking all webhook events
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id VARCHAR(255) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'stripe', 'kct', etc.
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  ip_address VARCHAR(45),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for webhook logs
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_source ON webhook_logs(source, created_at DESC);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status, created_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type, created_at DESC);

-- Create payment disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_dispute_id VARCHAR(255) UNIQUE NOT NULL,
  payment_intent_id VARCHAR(255),
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  reason VARCHAR(100),
  status VARCHAR(50),
  evidence_due_by TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for payment disputes
CREATE INDEX idx_payment_disputes_stripe_id ON payment_disputes(stripe_dispute_id);
CREATE INDEX idx_payment_disputes_order_id ON payment_disputes(order_id);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(status);

-- Add webhook-related columns to orders table if they don't exist
DO $$ 
BEGIN
    -- Add kct_order_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'kct_order_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN kct_order_id VARCHAR(255);
        CREATE INDEX idx_orders_kct_order_id ON orders(kct_order_id);
    END IF;

    -- Add payment_received_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_received_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_received_at TIMESTAMPTZ;
    END IF;

    -- Add payment_error if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_error'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_error TEXT;
    END IF;

    -- Add cancellation fields if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'cancellation_reason'
    ) THEN
        ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
        ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add webhook tracking to customers table
DO $$ 
BEGIN
    -- Add kct_customer_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'kct_customer_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN kct_customer_id VARCHAR(255);
        CREATE INDEX idx_customers_kct_customer_id ON customers(kct_customer_id);
    END IF;
END $$;

-- Create RLS policies for webhook logs (admin only)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view webhook logs"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Create RLS policies for payment disputes (admin only)
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view payment disputes"
ON payment_disputes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

CREATE POLICY "Admin users can update payment disputes"
ON payment_disputes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
    AND admin_users.permissions && ARRAY['orders', 'all']
  )
);

-- Create function to clean old webhook logs (keep 90 days)
CREATE OR REPLACE FUNCTION clean_old_webhook_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create inventory restoration functions for webhook use
CREATE OR REPLACE FUNCTION restore_inventory_on_cancel(
  variant_uuid UUID,
  quantity_restored INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE inventory
  SET 
    quantity_available = quantity_available + quantity_restored,
    last_updated = NOW(),
    updated_by = 'webhook_cancellation'
  WHERE variant_id = variant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on webhook functions
GRANT EXECUTE ON FUNCTION clean_old_webhook_logs() TO service_role;
GRANT EXECUTE ON FUNCTION restore_inventory_on_cancel(UUID, INTEGER) TO service_role;