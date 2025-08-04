-- Check which tables need RLS
SELECT 
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename IN (
    'cart_items', 'orders', 'order_items', 
    'products', 'inventory', 'inventory_movements',
    'user_profiles', 'reviews', 'bundles', 
    'bundle_analytics', 'smart_collections'
);

-- CART_ITEMS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'cart_items' 
        AND rowsecurity = false
    ) THEN
        -- Add user_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'cart_items' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.cart_items ADD COLUMN user_id UUID REFERENCES auth.users(id);
        END IF;
        
        ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can manage own cart" ON public.cart_items
            FOR ALL
            USING (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));
            
        GRANT ALL ON public.cart_items TO authenticated;
        RAISE NOTICE 'RLS enabled for cart_items table';
    END IF;
END $$;

-- ORDERS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own orders" ON public.orders
            FOR SELECT
            USING (
                customer_id IN (
                    SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
                )
                OR guest_email IN (
                    SELECT email FROM public.customers WHERE auth_user_id = auth.uid()
                )
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        CREATE POLICY "System can create orders" ON public.orders
            FOR INSERT WITH CHECK (true);
            
        CREATE POLICY "Admins can update orders" ON public.orders
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        GRANT SELECT ON public.orders TO authenticated;
        RAISE NOTICE 'RLS enabled for orders table';
    END IF;
END $$;

-- ORDER_ITEMS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'order_items' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own order items" ON public.order_items
            FOR SELECT
            USING (
                order_id IN (
                    SELECT id FROM public.orders o
                    WHERE o.customer_id IN (
                        SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
                    )
                    OR o.guest_email IN (
                        SELECT email FROM public.customers WHERE auth_user_id = auth.uid()
                    )
                )
                OR EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        GRANT SELECT ON public.order_items TO authenticated;
        RAISE NOTICE 'RLS enabled for order_items table';
    END IF;
END $$;

-- INVENTORY
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'inventory' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public can view inventory" ON public.inventory
            FOR SELECT USING (true);
            
        CREATE POLICY "Admins can manage inventory" ON public.inventory
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        GRANT SELECT ON public.inventory TO authenticated, anon;
        RAISE NOTICE 'RLS enabled for inventory table';
    END IF;
END $$;

-- INVENTORY_MOVEMENTS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'inventory_movements' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Admins can view movements" ON public.inventory_movements
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        CREATE POLICY "System can create movements" ON public.inventory_movements
            FOR INSERT WITH CHECK (true);
            
        RAISE NOTICE 'RLS enabled for inventory_movements table';
    END IF;
END $$;

-- USER_PROFILES
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Check which column to use
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'user_id'
        ) THEN
            CREATE POLICY "Users can manage own profile" ON public.user_profiles
                FOR ALL USING (user_id = auth.uid());
        ELSE
            CREATE POLICY "Users can manage own profile" ON public.user_profiles
                FOR ALL USING (id = auth.uid());
        END IF;
        
        GRANT ALL ON public.user_profiles TO authenticated;
        RAISE NOTICE 'RLS enabled for user_profiles table';
    END IF;
END $$;

-- BUNDLES
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'bundles' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public can view active bundles" ON public.bundles
            FOR SELECT USING (true);
            
        CREATE POLICY "Admins can manage bundles" ON public.bundles
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        GRANT SELECT ON public.bundles TO authenticated, anon;
        RAISE NOTICE 'RLS enabled for bundles table';
    END IF;
END $$;

-- SMART_COLLECTIONS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'smart_collections' 
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.smart_collections ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Public can view collections" ON public.smart_collections
            FOR SELECT USING (true);
            
        CREATE POLICY "Admins can manage collections" ON public.smart_collections
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.admin_users
                    WHERE user_id = auth.uid() AND is_active = true
                )
            );
            
        GRANT SELECT ON public.smart_collections TO authenticated, anon;
        RAISE NOTICE 'RLS enabled for smart_collections table';
    END IF;
END $$;

-- Show final status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN 'Protected'
        ELSE 'NOT Protected'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'cart_items', 'orders', 'order_items', 
    'products', 'inventory', 'inventory_movements',
    'user_profiles', 'reviews', 'bundles', 
    'bundle_analytics', 'smart_collections',
    'customers', 'admin_users'
)
ORDER BY rls_status, tablename;