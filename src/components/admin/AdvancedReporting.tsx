import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Download,
  Filter,
  Calendar as CalendarIcon,
  Target,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  overview: {
    total_revenue: number;
    revenue_change: number;
    total_orders: number;
    orders_change: number;
    conversion_rate: number;
    conversion_change: number;
    avg_order_value: number;
    aov_change: number;
  };
  revenue_trends: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  customer_segments: Array<{
    name: string;
    value: number;
    count: number;
    color: string;
  }>;
  top_products: Array<{
    name: string;
    revenue: number;
    units_sold: number;
    conversion_rate: number;
  }>;
  geographic_data: Array<{
    country: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  campaign_performance: Array<{
    name: string;
    type: string;
    revenue: number;
    roi: number;
    conversions: number;
  }>;
  funnel_data: Array<{
    stage: string;
    visitors: number;
    conversion_rate: number;
  }>;
}

export function AdvancedReporting() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [reportType, setReportType] = useState('overview');
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  // Mock data for reports
  const mockReportData: ReportData = {
    overview: {
      total_revenue: 847250,
      revenue_change: 12.5,
      total_orders: 3890,
      orders_change: 8.3,
      conversion_rate: 3.2,
      conversion_change: -0.3,
      avg_order_value: 217.80,
      aov_change: 4.1
    },
    revenue_trends: [
      { date: '2024-01-01', revenue: 25400, orders: 123 },
      { date: '2024-01-02', revenue: 28900, orders: 142 },
      { date: '2024-01-03', revenue: 32100, orders: 156 },
      { date: '2024-01-04', revenue: 29800, orders: 138 },
      { date: '2024-01-05', revenue: 35200, orders: 167 },
      { date: '2024-01-06', revenue: 31700, orders: 149 },
      { date: '2024-01-07', revenue: 27900, orders: 134 },
      { date: '2024-01-08', revenue: 33600, orders: 161 },
      { date: '2024-01-09', revenue: 36800, orders: 178 },
      { date: '2024-01-10', revenue: 39200, orders: 189 },
      { date: '2024-01-11', revenue: 34500, orders: 164 },
      { date: '2024-01-12', revenue: 41300, orders: 198 },
      { date: '2024-01-13', revenue: 38700, orders: 185 },
      { date: '2024-01-14', revenue: 35900, orders: 172 }
    ],
    customer_segments: [
      { name: 'High Value', value: 45, count: 2847, color: '#8884d8' },
      { name: 'Regular', value: 35, count: 5620, color: '#82ca9d' },
      { name: 'New', value: 15, count: 1892, color: '#ffc658' },
      { name: 'At Risk', value: 5, count: 734, color: '#ff7c7c' }
    ],
    top_products: [
      { name: 'Premium Sneakers', revenue: 125400, units_sold: 342, conversion_rate: 8.5 },
      { name: 'Designer Backpack', revenue: 89200, units_sold: 198, conversion_rate: 6.2 },
      { name: 'Wireless Headphones', revenue: 76800, units_sold: 256, conversion_rate: 7.1 },
      { name: 'Smart Watch', revenue: 98500, units_sold: 167, conversion_rate: 5.8 },
      { name: 'Bluetooth Speaker', revenue: 54300, units_sold: 289, conversion_rate: 4.9 }
    ],
    geographic_data: [
      { country: 'United States', revenue: 345600, orders: 1567, customers: 8900 },
      { country: 'Canada', revenue: 123400, orders: 567, customers: 3200 },
      { country: 'United Kingdom', revenue: 98700, orders: 445, customers: 2600 },
      { country: 'Germany', revenue: 87300, orders: 398, customers: 2100 },
      { country: 'France', revenue: 76500, orders: 356, customers: 1900 },
      { country: 'Australia', revenue: 65200, orders: 298, customers: 1700 }
    ],
    campaign_performance: [
      { name: 'Holiday Sale', type: 'Email', revenue: 125400, roi: 450, conversions: 567 },
      { name: 'Social Media Ads', type: 'Social', revenue: 89200, roi: 320, conversions: 423 },
      { name: 'Search Ads', type: 'PPC', revenue: 76800, roi: 280, conversions: 389 },
      { name: 'Influencer Campaign', type: 'Social', revenue: 54300, roi: 210, conversions: 234 },
      { name: 'Retargeting', type: 'Display', revenue: 43200, roi: 380, conversions: 198 }
    ],
    funnel_data: [
      { stage: 'Visitors', visitors: 125400, conversion_rate: 100 },
      { stage: 'Product Views', visitors: 89200, conversion_rate: 71.2 },
      { stage: 'Add to Cart', visitors: 23400, conversion_rate: 18.7 },
      { stage: 'Checkout', visitors: 8900, conversion_rate: 7.1 },
      { stage: 'Purchase', visitors: 3890, conversion_rate: 3.1 }
    ]
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange, reportType]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData(mockReportData);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Reporting</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your business performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range: any) => range && setDateRange(range)}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.overview.total_revenue)}</div>
                <div className={`flex items-center text-xs ${getChangeColor(reportData.overview.revenue_change)}`}>
                  {getChangeIcon(reportData.overview.revenue_change)}
                  {formatPercentage(reportData.overview.revenue_change)} from last period
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.overview.total_orders.toLocaleString()}</div>
                <div className={`flex items-center text-xs ${getChangeColor(reportData.overview.orders_change)}`}>
                  {getChangeIcon(reportData.overview.orders_change)}
                  {formatPercentage(reportData.overview.orders_change)} from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.overview.conversion_rate}%</div>
                <div className={`flex items-center text-xs ${getChangeColor(reportData.overview.conversion_change)}`}>
                  {getChangeIcon(reportData.overview.conversion_change)}
                  {formatPercentage(reportData.overview.conversion_change)} from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.overview.avg_order_value)}</div>
                <div className={`flex items-center text-xs ${getChangeColor(reportData.overview.aov_change)}`}>
                  {getChangeIcon(reportData.overview.aov_change)}
                  {formatPercentage(reportData.overview.aov_change)} from last period
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue and order volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={reportData.revenue_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(Number(value)) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Segments and Conversion Funnel */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
                <CardDescription>Revenue distribution by customer type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.customer_segments}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                    >
                      {reportData.customer_segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Customer journey through purchase process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.funnel_data.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{stage.stage}</span>
                        <span>{stage.visitors.toLocaleString()} ({stage.conversion_rate.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-500"
                          style={{ width: `${stage.conversion_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {/* Geographic Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Performance</CardTitle>
              <CardDescription>Revenue and orders by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.geographic_data.map((country) => (
                  <div key={country.country} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{country.country}</p>
                      <p className="text-sm text-muted-foreground">{country.customers.toLocaleString()} customers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(country.revenue)}</p>
                      <p className="text-sm text-muted-foreground">{country.orders.toLocaleString()} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Best selling products by revenue and conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.top_products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(Number(value)) : value,
                    name === 'revenue' ? 'Revenue' : name === 'units_sold' ? 'Units Sold' : 'Conversion Rate (%)'
                  ]} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Segment Details */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reportData.customer_segments.map((segment) => (
              <Card key={segment.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{segment.name} Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{segment.count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{segment.value}% of total</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customer Acquisition Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition</CardTitle>
              <CardDescription>New vs returning customer trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Customer Analysis</h3>
                <p className="text-muted-foreground">
                  Detailed customer acquisition and retention analytics would be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          {/* Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>ROI and conversion metrics by marketing channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.campaign_performance.map((campaign) => (
                  <div key={campaign.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge variant="outline" className="text-xs">{campaign.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatCurrency(campaign.revenue)}</p>
                        <p className="text-sm text-green-600">{campaign.roi}% ROI</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.conversions} conversions
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {/* Product Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Analysis</CardTitle>
              <CardDescription>Detailed metrics for top performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.top_products.map((product) => (
                  <div key={product.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">{product.conversion_rate}% conversion</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {product.units_sold} units sold
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}