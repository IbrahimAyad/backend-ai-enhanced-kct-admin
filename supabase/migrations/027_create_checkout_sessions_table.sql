-- Create checkout sessions table for tracking and analytics
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID UNIQUE NOT NULL,
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_email VARCHAR(255),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  items JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'created', -- created, completed, expired, abandoned
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_checkout_sessions_session_id ON checkout_sessions(session_id);
CREATE INDEX idx_checkout_sessions_stripe_id ON checkout_sessions(stripe_session_id);
CREATE INDEX idx_checkout_sessions_status ON checkout_sessions(status, created_at DESC);
CREATE INDEX idx_checkout_sessions_customer ON checkout_sessions(customer_id);
CREATE INDEX idx_checkout_sessions_email ON checkout_sessions(customer_email);
CREATE INDEX idx_checkout_sessions_expires ON checkout_sessions(expires_at);

-- Create stock reservations table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  session_id UUID NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  CONSTRAINT unique_reservation UNIQUE (variant_id, session_id)
);

-- Create indexes for stock reservations
CREATE INDEX idx_stock_reservations_variant ON stock_reservations(variant_id);
CREATE INDEX idx_stock_reservations_session ON stock_reservations(session_id);
CREATE INDEX idx_stock_reservations_expires ON stock_reservations(expires_at);
CREATE INDEX idx_stock_reservations_released ON stock_reservations(released_at);

-- Function to get available inventory (considering reservations)
CREATE OR REPLACE FUNCTION get_available_inventory(variant_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_inventory INTEGER;
  reserved_quantity INTEGER;
BEGIN
  -- Get total inventory
  SELECT COALESCE(i.quantity_available, 0)
  INTO total_inventory
  FROM inventory i
  WHERE i.variant_id = variant_uuid;

  -- Get active reservations
  SELECT COALESCE(SUM(sr.quantity), 0)
  INTO reserved_quantity
  FROM stock_reservations sr
  WHERE sr.variant_id = variant_uuid
    AND sr.expires_at > NOW()
    AND sr.released_at IS NULL;

  -- Return available quantity
  RETURN GREATEST(0, total_inventory - reserved_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired reservations
CREATE OR REPLACE FUNCTION clean_expired_reservations()
RETURNS void AS $$
BEGIN
  UPDATE stock_reservations
  SET released_at = NOW()
  WHERE expires_at < NOW()
    AND released_at IS NULL;
    
  -- Update checkout sessions status
  UPDATE checkout_sessions
  SET status = 'expired',
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND status = 'created';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release reservations when order is completed
CREATE OR REPLACE FUNCTION release_order_reservations(order_session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE stock_reservations
  SET released_at = NOW()
  WHERE session_id = order_session_id
    AND released_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for checkout sessions
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Admin users can view all checkout sessions
CREATE POLICY "Admin users can view checkout sessions"
ON checkout_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- Customers can view their own checkout sessions
CREATE POLICY "Customers can view own checkout sessions"
ON checkout_sessions FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers 
    WHERE auth_user_id = auth.uid()
  )
);

-- RLS policies for stock reservations (admin only)
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage stock reservations"
ON stock_reservations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
    AND admin_users.permissions && ARRAY['inventory', 'all']
  )
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_inventory(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION clean_expired_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION release_order_reservations(UUID) TO service_role;

-- Create a scheduled job to clean expired reservations (requires pg_cron extension)
-- Run every 5 minutes
-- SELECT cron.schedule('clean-expired-reservations', '*/5 * * * *', 'SELECT clean_expired_reservations();');