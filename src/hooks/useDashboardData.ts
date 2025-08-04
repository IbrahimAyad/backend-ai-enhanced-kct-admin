import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_email: string;
  customer_name: string;
}

interface LowStockProduct {
  id: string;
  product_name: string;
  sku: string;
  stock_level: number;
  reserved_quantity: number;
  available_quantity: number;
}

export function useDashboardData() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    avgOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadDashboardData(); // Reload data when orders change
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats');
      
      if (statsError) throw statsError;
      setStats(statsData);

      // Load recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .rpc('get_recent_orders', { limit_count: 5 });
      
      if (ordersError) throw ordersError;
      setRecentOrders(ordersData || []);

      // Load low stock products
      const { data: stockData, error: stockError } = await supabase
        .rpc('get_low_stock_products', { threshold: 10 });
      
      if (stockError) throw stockError;
      setLowStockProducts(stockData || []);

    } catch (error) {
      console.error('Dashboard data error:', error);
      
      // If RPC functions don't exist yet, load data directly
      try {
        await loadDirectData();
      } catch (directError) {
        toast({
          title: "Data Loading Error",
          description: "Some dashboard features may be limited",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback direct data loading if RPC functions aren't created yet
  const loadDirectData = async () => {
    // Get stats directly from tables
    const [
      { count: orderCount },
      { data: revenueData },
      { count: customerCount },
      { data: ordersForAvg }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('payment_status', 'paid')
    ]);

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const avgOrderValue = ordersForAvg?.length ? totalRevenue / ordersForAvg.length : 0;

    setStats({
      totalOrders: orderCount || 0,
      totalRevenue: totalRevenue,
      totalCustomers: customerCount || 0,
      avgOrderValue: avgOrderValue
    });

    // Get recent orders
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(email, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentOrdersData) {
      setRecentOrders(recentOrdersData.map(order => ({
        ...order,
        customer_email: order.customer?.email || 'Unknown',
        customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 'Unknown'
      })));
    }

    // Get low stock products
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(name, sku)
      `)
      .lt('available_quantity', 10)
      .order('available_quantity', { ascending: true });

    if (inventoryData) {
      setLowStockProducts(inventoryData.map(item => ({
        id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        sku: item.product?.sku || '',
        stock_level: item.quantity || 0,
        reserved_quantity: item.reserved_quantity || 0,
        available_quantity: item.available_quantity || 0
      })));
    }
  };

  return {
    loading,
    stats,
    recentOrders,
    lowStockProducts,
    refresh: loadDashboardData
  };
}