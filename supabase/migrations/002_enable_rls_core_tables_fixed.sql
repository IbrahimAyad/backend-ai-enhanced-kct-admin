-- Enable RLS on core tables and create basic policies
-- FIXED VERSION: Handles different possible column names

-- First, let's check what columns exist and add missing ones if needed
DO $$
BEGIN
    -- Check if auth_user_id exists in customers table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'auth_user_id'
    ) THEN
        -- Check if there's a user_id column instead
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'user_id'
        ) THEN
            -- Rename user_id to auth_user_id for consistency
            ALTER TABLE public.customers RENAME COLUMN user_id TO auth_user_id;
        ELSE
            -- Add the column if it doesn't exist at all
            ALTER TABLE public.customers ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
            
            -- Try to populate it based on email matching
            UPDATE public.customers c
            SET auth_user_id = u.id
            FROM auth.users u
            WHERE c.email = u.email
            AND c.auth_user_id IS NULL;
        END IF;
    END IF;
END $$;

-- 1. CUSTOMERS TABLE
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customer records" ON public.customers;

-- Customers can only see their own data
CREATE POLICY "Users can view own customer record" ON public.customers
  FOR SELECT
  USING (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- Customers can update their own data
CREATE POLICY "Users can update own customer record" ON public.customers
  FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Service role and authenticated users can insert (for registration)
CREATE POLICY "Authenticated users can create customer records" ON public.customers
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid() OR auth_user_id IS NULL);

-- 2. ORDERS TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

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
  WITH CHECK (true); -- Edge functions use service role

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

-- 3. ORDER_ITEMS TABLE (only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
        
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
    END IF;
END $$;

-- 4. CART_ITEMS TABLE
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;

-- Check if user_id column exists in cart_items
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.cart_items ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

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

-- 5. USER_PROFILES TABLE (only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
        
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
    END IF;
END $$;

-- 6. WISHLISTS TABLE (only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'wishlists'
    ) THEN
        ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
        
        -- Users can only manage their own wishlist
        CREATE POLICY "Users can manage own wishlist" ON public.wishlists
          FOR ALL
          USING (user_id = auth.uid());
    END IF;
END $$;

-- 7. PRODUCTS TABLE (Public read, admin write)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

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

-- 8. PRODUCT_VARIANTS TABLE (only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_variants'
    ) THEN
        ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public can view active variants" ON public.product_variants;
        DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
        
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
    END IF;
END $$;

-- 9. INVENTORY TABLE (only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'inventory'
    ) THEN
        ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Public can check availability" ON public.inventory;
        DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
        
        -- Public can view availability (not detailed inventory)
        CREATE POLICY "Public can check availability" ON public.inventory
          FOR SELECT
          USING (true);

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
    END IF;
END $$;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;

-- Grant permissions only if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
        GRANT SELECT ON public.product_variants TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        GRANT SELECT ON public.inventory TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlists') THEN
        GRANT ALL ON public.wishlists TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        GRANT SELECT ON public.orders TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        GRANT SELECT ON public.order_items TO authenticated;
    END IF;
END $$;

-- Note: This migration is defensive and checks for table/column existence before applying changes