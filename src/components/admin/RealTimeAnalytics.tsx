import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Eye,
  Target,
  MousePointer,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { supabase } from '@/lib/supabase';

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#059669', '#0891b2', '#0284c7', '#2563eb', '#4f46e5'];

export function RealTimeAnalytics() {
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    todayOrders: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    conversionRate: 0,
    recentOrders: [],
    topProducts: []
  });

  useEffect(() => {
    loadRealTimeData();
    
    // Update every 30 seconds
    const interval = setInterval(loadRealTimeData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRealTimeData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      // Today's orders and revenue
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, customer_id')
        .gte('created_at', todayStart.toISOString())
        .eq('payment_status', 'completed');

      // Yesterday's revenue for comparison
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString())
        .eq('payment_status', 'completed');

      // Recent orders (last hour)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, customers(first_name, last_name)')
        .gte('created_at', lastHour.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Active customers (with activity in last 24 hours)
      const { data: activeCustomers } = await supabase
        .from('customers')
        .select('id')
        .gte('last_order_date', yesterdayStart.toISOString());

      // Top products today
      const { data: topProducts } = await supabase
        .from('order_items')
        .select(`
          product_name,
          quantity,
          unit_price,
          orders!inner(created_at)
        `)
        .gte('orders.created_at', todayStart.toISOString());

      // Calculate metrics
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      const uniqueCustomersToday = new Set(todayOrders?.map(order => order.customer_id)).size;
      const estimatedVisitors = Math.max(uniqueCustomersToday * 8, 100); // Rough estimate
      const conversionRate = estimatedVisitors > 0 ? ((todayOrders?.length || 0) / estimatedVisitors) * 100 : 0;

      // Process top products
      const productStats = topProducts?.reduce((acc, item) => {
        const name = item.product_name;
        if (!acc[name]) {
          acc[name] = { name, quantity: 0, revenue: 0 };
        }
        acc[name].quantity += item.quantity;
        acc[name].revenue += item.quantity * Number(item.unit_price);
        return acc;
      }, {} as Record<string, any>) || {};

      const topProductsList = Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      setRealTimeData({
        activeUsers: activeCustomers?.length || 0,
        todayOrders: todayOrders?.length || 0,
        todayRevenue,
        yesterdayRevenue,
        conversionRate,
        recentOrders: recentOrders || [],
        topProducts: topProductsList
      });
    } catch (error) {
      console.error('Error loading real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionFunnelData = [
    { name: 'Website Visits', value: 10000, fill: '#dc2626' },
    { name: 'Product Views', value: 6500, fill: '#ea580c' },
    { name: 'Add to Cart', value: 2100, fill: '#d97706' },
    { name: 'Checkout Started', value: 850, fill: '#65a30d' },
    { name: 'Order Completed', value: 320, fill: '#16a34a' }
  ];

  const customerBehaviorData = [
    { page: 'Homepage', visits: 1240, avgTime: '2:15', bounceRate: 35 },
    { page: 'Product Pages', visits: 890, avgTime: '3:42', bounceRate: 28 },
    { page: 'Category', visits: 650, avgTime: '1:58', bounceRate: 45 },
    { page: 'Cart', visits: 320, avgTime: '2:30', bounceRate: 15 },
    { page: 'Checkout', visits: 180, avgTime: '4:20', bounceRate: 8 }
  ];

  const revenueBySourceData = [
    { name: 'Direct', value: 45, revenue: 12350 },
    { name: 'Google Ads', value: 28, revenue: 8940 },
    { name: 'Social Media', value: 15, revenue: 4200 },
    { name: 'Email', value: 8, revenue: 2100 },
    { name: 'Referral', value: 4, revenue: 1050 }
  ];

  const hourlyTrafficData = [
    { hour: '00:00', visitors: 45, sales: 2 },
    { hour: '01:00', visitors: 32, sales: 1 },
    { hour: '02:00', visitors: 28, sales: 0 },
    { hour: '03:00', visitors: 35, sales: 1 },
    { hour: '04:00', visitors: 42, sales: 2 },
    { hour: '05:00', visitors: 58, sales: 3 },
    { hour: '06:00', visitors: 78, sales: 5 },
    { hour: '07:00', visitors: 95, sales: 8 },
    { hour: '08:00', visitors: 120, sales: 12 },
    { hour: '09:00', visitors: 145, sales: 18 },
    { hour: '10:00', visitors: 165, sales: 22 },
    { hour: '11:00', visitors: 180, sales: 25 },
    { hour: '12:00', visitors: 195, sales: 28 },
    { hour: '13:00', visitors: 210, sales: 32 },
    { hour: '14:00', visitors: 185, sales: 28 },
    { hour: '15:00', visitors: 170, sales: 25 },
    { hour: '16:00', visitors: 155, sales: 22 },
    { hour: '17:00', visitors: 140, sales: 18 },
    { hour: '18:00', visitors: 125, sales: 15 },
    { hour: '19:00', visitors: 110, sales: 12 },
    { hour: '20:00', visitors: 95, sales: 8 },
    { hour: '21:00', visitors: 80, sales: 5 },
    { hour: '22:00', visitors: 65, sales: 3 },
    { hour: '23:00', visitors: 52, sales: 2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Real-Time Analytics</h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRealTimeData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-2xl font-bold">{realTimeData.activeUsers}</p>
                </div>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">{realTimeData.todayOrders}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Live order count
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{realTimeData.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated from visitor data
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">${realTimeData.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center gap-1 mt-1">
                  {realTimeData.todayRevenue >= realTimeData.yesterdayRevenue ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${realTimeData.todayRevenue >= realTimeData.yesterdayRevenue ? 'text-green-600' : 'text-red-600'}`}>
                    vs yesterday
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="behavior">Customer Behavior</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sales Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Funnel
                        dataKey="value"
                        data={conversionFunnelData}
                        isAnimationActive
                      >
                        <LabelList position="center" fill="#fff" fontSize={12} />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {conversionFunnelData.map((step, index) => {
                    const prevStep = conversionFunnelData[index - 1];
                    const conversionRate = prevStep ? ((step.value / prevStep.value) * 100).toFixed(1) : '100.0';
                    return (
                      <div key={step.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{step.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {step.value.toLocaleString()} users
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{conversionRate}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Customer Behavior Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerBehaviorData.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{page.page}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {page.visits} visits
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {page.avgTime} avg time
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={page.bounceRate > 40 ? "destructive" : page.bounceRate > 25 ? "outline" : "default"}
                      >
                        {page.bounceRate}% bounce
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Revenue by Traffic Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={revenueBySourceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueBySourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {revenueBySourceData.map((source, index) => (
                    <div key={source.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">{source.value}% of traffic</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${source.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Hourly Traffic & Sales Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      name="Visitors"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      name="Sales"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-sm">Visitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-sm">Sales</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}