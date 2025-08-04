-- Enable RLS on core tables and create basic policies
-- This migration focuses on the most critical tables for security

-- 1. CUSTOMERS TABLE
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own data
CREATE POLICY "Users can view own customer record" ON public.customers
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Customers can update their own data
CREATE POLICY "Users can update own customer record" ON public.customers
  FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Service role and authenticated users can insert (for registration)
CREATE POLICY "Authenticated users can create customer records" ON public.customers
  FOR INSERT
  WITH CHECK (true);

-- 2. ORDERS TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
    OR
    -- Admins can view all orders
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Only system can insert orders (via Edge Functions)
CREATE POLICY "Service role can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update orders
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 3. ORDER_ITEMS TABLE
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view items for their orders
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- 4. CART_ITEMS TABLE
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cart
CREATE POLICY "Users can view own cart items" ON public.cart_items
  FOR SELECT
  USING (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can insert own cart items" ON public.cart_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can update own cart items" ON public.cart_items
  FOR UPDATE
  USING (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can delete own cart items" ON public.cart_items
  FOR DELETE
  USING (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

-- 5. USER_PROFILES TABLE
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- 6. WISHLISTS TABLE
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlists
  FOR ALL
  USING (user_id = auth.uid());

-- 7. PRODUCTS TABLE (Public read, admin write)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT
  USING (status = 'active' OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Only admins can modify products
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
      AND (permissions @> ARRAY['products'] OR permissions @> ARRAY['all'])
    )
  );

-- 8. PRODUCT_VARIANTS TABLE
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Everyone can view active variants
CREATE POLICY "Public can view active variants" ON public.product_variants
  FOR SELECT
  USING (active = true OR
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Only admins can modify variants
CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
      AND (permissions @> ARRAY['products'] OR permissions @> ARRAY['all'])
    )
  );

-- 9. INVENTORY TABLE
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Public can view availability (not detailed inventory)
CREATE POLICY "Public can check availability" ON public.inventory
  FOR SELECT
  USING (true)
  WITH CHECK (true);

-- Only admins can modify inventory
CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
      AND (permissions @> ARRAY['inventory'] OR permissions @> ARRAY['all'])
    )
  );

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.product_variants TO authenticated;
GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT ALL ON public.wishlists TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;

-- Note: Additional tables will be secured in the next migration