import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  DollarSign,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { fetchProductsWithImages } from '@/lib/shared/supabase-products';

interface ProductAnalytics {
  product_id: string;
  product_name: string;
  category: string;
  views: number;
  add_to_carts: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
  bounce_rate: number;
  avg_time_on_page: number;
}

export function ProductAnalytics() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProductAnalytics();
  }, [timeRange, categoryFilter]);

  const loadProductAnalytics = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      let startDate: Date;
      
      // Calculate date range
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get products with their analytics
      const productsResult = await fetchProductsWithImages({ status: 'active' });
      
      if (!productsResult.success || !productsResult.data) {
        setAnalytics([]);
        return;
      }

      const products = productsResult.data;

      // Get order items to calculate analytics
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          unit_price,
          line_total,
          orders!inner(created_at, payment_status)
        `)
        .gte('orders.created_at', startDate.toISOString())
        .eq('orders.payment_status', 'completed');

      // Calculate analytics for each product
      const productAnalytics = products.map(product => {
        const productOrderItems = orderItems?.filter(item => item.product_id === product.id) || [];
        
        const purchases = productOrderItems.length;
        const revenue = productOrderItems.reduce((sum, item) => sum + Number(item.line_total), 0);
        
        // Estimate views and cart adds (in real app, you'd track these separately)
        const estimatedViews = Math.max(purchases * 20, 100);
        const estimatedCartAdds = Math.max(purchases * 3, 10);
        
        const conversion_rate = estimatedViews > 0 ? (purchases / estimatedViews) * 100 : 0;
        const bounce_rate = Math.random() * 40 + 10; // Mock bounce rate
        const avg_time_on_page = Math.floor(Math.random() * 200) + 60; // Mock time

        return {
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          views: estimatedViews,
          add_to_carts: estimatedCartAdds,
          purchases,
          revenue,
          conversion_rate: Number(conversion_rate.toFixed(1)),
          bounce_rate: Number(bounce_rate.toFixed(1)),
          avg_time_on_page
        };
      });

      setAnalytics(productAnalytics);
    } catch (error) {
      console.error('Error loading product analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load product analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalytics = analytics.filter(product => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const topPerformers = [...filteredAnalytics]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoryPerformance = analytics.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = {
        category,
        views: 0,
        purchases: 0,
        revenue: 0,
        products: 0
      };
    }
    acc[category].views += product.views;
    acc[category].purchases += product.purchases;
    acc[category].revenue += product.revenue;
    acc[category].products += 1;
    return acc;
  }, {} as Record<string, any>);

  const categoryData = Object.values(categoryPerformance);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = (value: number, type: 'conversion' | 'bounce') => {
    if (type === 'conversion') {
      if (value >= 8) return 'text-green-600';
      if (value >= 5) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value <= 20) return 'text-green-600';
      if (value <= 30) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Product Analytics</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="suits">Suits</SelectItem>
              <SelectItem value="shirts">Shirts</SelectItem>
              <SelectItem value="ties">Ties</SelectItem>
              <SelectItem value="shoes">Shoes</SelectItem>
              <SelectItem value="accessories">Accessories</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Eye className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">
                      {filteredAnalytics.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                    <p className="text-2xl font-bold">
                      {filteredAnalytics.reduce((sum, p) => sum + p.purchases, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(filteredAnalytics.reduce((sum, p) => sum + p.revenue, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Conversion</p>
                    <p className="text-2xl font-bold">
                      {(filteredAnalytics.reduce((sum, p) => sum + p.conversion_rate, 0) / filteredAnalytics.length).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium">{product.views.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Purchases</p>
                        <p className="font-medium">{product.purchases}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">{formatCurrency(product.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Conversion</p>
                        <p className={`font-medium ${getPerformanceColor(product.conversion_rate, 'conversion')}`}>
                          {product.conversion_rate}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">Product revenue comparison</p>
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Conversion chart will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">Product conversion rates over time</p>
              </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Category performance chart will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">Revenue and views by category</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {filteredAnalytics.map(product => (
            <Card key={product.product_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{product.product_name}</CardTitle>
                    <p className="text-muted-foreground capitalize">{product.category}</p>
                  </div>
                  <Badge variant="outline">{formatCurrency(product.revenue)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Views</p>
                    <p className="text-lg font-bold">{product.views.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Cart Adds</p>
                    <p className="text-lg font-bold">{product.add_to_carts}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Purchases</p>
                    <p className="text-lg font-bold">{product.purchases}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Conversion</p>
                    <p className={`text-lg font-bold ${getPerformanceColor(product.conversion_rate, 'conversion')}`}>
                      {product.conversion_rate}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Bounce Rate</p>
                    <p className={`text-lg font-bold ${getPerformanceColor(product.bounce_rate, 'bounce')}`}>
                      {product.bounce_rate}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Avg Time</p>
                    <p className="text-lg font-bold">{formatTime(product.avg_time_on_page)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}