-- Create RPC functions for dashboard analytics
-- Run this in Supabase SQL Editor

-- 1. Dashboard Stats Function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'totalOrders', COALESCE((SELECT COUNT(*) FROM orders), 0),
        'totalRevenue', COALESCE((SELECT SUM(total_amount) FROM orders WHERE payment_status = 'paid'), 0),
        'totalCustomers', COALESCE((SELECT COUNT(*) FROM customers), 0),
        'avgOrderValue', COALESCE((SELECT AVG(total_amount) FROM orders WHERE payment_status = 'paid'), 0)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- 2. Recent Orders Function
CREATE OR REPLACE FUNCTION get_recent_orders(limit_count integer DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(t))
         FROM (
             SELECT 
                 o.id,
                 o.order_number,
                 o.total_amount,
                 o.status,
                 o.payment_status,
                 o.created_at,
                 c.email as customer_email,
                 c.first_name || ' ' || c.last_name as customer_name
             FROM orders o
             LEFT JOIN customers c ON o.customer_id = c.id
             ORDER BY o.created_at DESC
             LIMIT limit_count
         ) t),
        '[]'::json
    );
END;
$$;

-- 3. Low Stock Products Function
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold integer DEFAULT 10)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(t))
         FROM (
             SELECT 
                 p.id,
                 p.name as product_name,
                 p.sku,
                 i.quantity as stock_level,
                 i.reserved_quantity,
                 i.available_quantity
             FROM products p
             JOIN inventory i ON p.id = i.product_id
             WHERE i.available_quantity < threshold
             ORDER BY i.available_quantity ASC
         ) t),
        '[]'::json
    );
END;
$$;

-- 4. Revenue by Date Function
CREATE OR REPLACE FUNCTION get_revenue_by_date(days integer DEFAULT 30)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(t))
         FROM (
             SELECT 
                 DATE(created_at) as date,
                 SUM(total_amount) as revenue,
                 COUNT(*) as order_count
             FROM orders
             WHERE payment_status = 'paid'
             AND created_at >= CURRENT_DATE - INTERVAL '1 day' * days
             GROUP BY DATE(created_at)
             ORDER BY date DESC
         ) t),
        '[]'::json
    );
END;
$$;

-- 5. Top Products Function
CREATE OR REPLACE FUNCTION get_top_products(limit_count integer DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT json_agg(row_to_json(t))
         FROM (
             SELECT 
                 p.id,
                 p.name,
                 p.price,
                 COUNT(oi.id) as times_ordered,
                 SUM(oi.quantity) as total_quantity_sold,
                 SUM(oi.total_amount) as total_revenue
             FROM products p
             JOIN order_items oi ON p.id = oi.product_id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.payment_status = 'paid'
             GROUP BY p.id, p.name, p.price
             ORDER BY total_revenue DESC
             LIMIT limit_count
         ) t),
        '[]'::json
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_orders(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_products(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_by_date(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(integer) TO authenticated;