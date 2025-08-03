import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  RefreshCw,
  PieChart,
  BarChart3,
  Calculator,
  Receipt,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinancialMetrics {
  revenue: {
    total: number;
    growth_percentage: number;
    by_category: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    by_month: Array<{
      month: string;
      amount: number;
    }>;
  };
  profit: {
    gross_profit: number;
    gross_margin: number;
    net_profit: number;
    net_margin: number;
    by_product: Array<{
      product_name: string;
      revenue: number;
      cost: number;
      profit: number;
      margin_percentage: number;
    }>;
  };
  payments: {
    total_processed: number;
    by_method: Array<{
      method: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    pending: number;
    failed: number;
    refunded: number;
  };
  taxes: {
    collected: number;
    by_state: Array<{
      state: string;
      amount: number;
      rate: number;
    }>;
    remitted: number;
    pending: number;
  };
  refunds: {
    total_amount: number;
    count: number;
    by_reason: Array<{
      reason: string;
      amount: number;
      count: number;
    }>;
    processing: number;
  };
}

interface CashFlowItem {
  id: string;
  date: string;
  type: 'in' | 'out';
  category: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

export function FinancialDashboard() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock financial data
      const mockMetrics: FinancialMetrics = {
        revenue: {
          total: 125400.00,
          growth_percentage: 15.3,
          by_category: [
            { category: 'Suits', amount: 89500.00, percentage: 71.4 },
            { category: 'Shirts', amount: 18200.00, percentage: 14.5 },
            { category: 'Accessories', amount: 12300.00, percentage: 9.8 },
            { category: 'Shoes', amount: 5400.00, percentage: 4.3 }
          ],
          by_month: [
            { month: 'Dec', amount: 45200 },
            { month: 'Jan', amount: 52100 },
            { month: 'Feb', amount: 28100 }
          ]
        },
        profit: {
          gross_profit: 68970.00,
          gross_margin: 55.0,
          net_profit: 52400.00,
          net_margin: 41.8,
          by_product: [
            {
              product_name: 'Classic Navy Suit',
              revenue: 25400.00,
              cost: 11430.00,
              profit: 13970.00,
              margin_percentage: 55.0
            },
            {
              product_name: 'Premium Leather Shoes',
              revenue: 8900.00,
              cost: 4005.00,
              profit: 4895.00,
              margin_percentage: 55.0
            },
            {
              product_name: 'White Dress Shirt',
              revenue: 6200.00,
              cost: 2170.00,
              profit: 4030.00,
              margin_percentage: 65.0
            }
          ]
        },
        payments: {
          total_processed: 125400.00,
          by_method: [
            { method: 'Credit Card', amount: 89540.00, count: 156, percentage: 71.4 },
            { method: 'PayPal', amount: 23420.00, count: 45, percentage: 18.7 },
            { method: 'Bank Transfer', amount: 8950.00, count: 12, percentage: 7.1 },
            { method: 'Apple Pay', amount: 3490.00, count: 23, percentage: 2.8 }
          ],
          pending: 2400.00,
          failed: 890.00,
          refunded: 3200.00
        },
        taxes: {
          collected: 10850.00,
          by_state: [
            { state: 'NY', amount: 4250.00, rate: 8.25 },
            { state: 'CA', amount: 3100.00, rate: 7.75 },
            { state: 'TX', amount: 2200.00, rate: 6.25 },
            { state: 'FL', amount: 1300.00, rate: 6.0 }
          ],
          remitted: 8650.00,
          pending: 2200.00
        },
        refunds: {
          total_amount: 3200.00,
          count: 8,
          by_reason: [
            { reason: 'Size Exchange', amount: 1400.00, count: 3 },
            { reason: 'Defective Item', amount: 980.00, count: 2 },
            { reason: 'Customer Cancellation', amount: 820.00, count: 3 }
          ],
          processing: 450.00
        }
      };

      const mockCashFlow: CashFlowItem[] = [
        {
          id: '1',
          date: '2024-01-22T10:30:00Z',
          type: 'in',
          category: 'Sales',
          description: 'Order #ORD-2024-001 payment',
          amount: 1299.99,
          status: 'completed',
          reference: 'ORD-2024-001'
        },
        {
          id: '2',
          date: '2024-01-22T09:15:00Z',
          type: 'out',
          category: 'Refund',
          description: 'Refund for Order #ORD-2024-089',
          amount: -450.00,
          status: 'completed',
          reference: 'REF-2024-003'
        },
        {
          id: '3',
          date: '2024-01-21T14:20:00Z',
          type: 'in',
          category: 'Sales',
          description: 'Wedding party bulk order',
          amount: 8500.00,
          status: 'completed',
          reference: 'ORD-2024-055'
        },
        {
          id: '4',
          date: '2024-01-21T11:00:00Z',
          type: 'out',
          category: 'Supplier Payment',
          description: 'Premium Textiles Ltd - Inventory',
          amount: -12500.00,
          status: 'pending',
          reference: 'INV-PT-2024-015'
        }
      ];

      setMetrics(mockMetrics);
      setCashFlow(mockCashFlow);
      
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadFinancialData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.revenue.total)}</p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +{metrics.revenue.growth_percentage}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calculator className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.profit.net_profit)}</p>
                <p className="text-sm text-muted-foreground">{metrics.profit.net_margin}% margin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Payments Processed</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.payments.total_processed)}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.payments.pending > 0 && `${formatCurrency(metrics.payments.pending)} pending`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Receipt className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tax Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.taxes.collected)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(metrics.taxes.pending)} pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit">Profit Analysis</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.revenue.by_category.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{category.category}</span>
                        <span className="font-medium">{formatCurrency(category.amount)}</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground text-right">
                        {category.percentage}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.revenue.by_month.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(month.amount / 60000) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(month.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(metrics.profit.gross_profit)}</div>
                    <div className="text-sm text-muted-foreground">Gross Profit</div>
                    <div className="text-xs text-green-600">{metrics.profit.gross_margin}% margin</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{formatCurrency(metrics.profit.net_profit)}</div>
                    <div className="text-sm text-muted-foreground">Net Profit</div>
                    <div className="text-xs text-green-600">{metrics.profit.net_margin}% margin</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.profit.by_product.map((product, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{product.product_name}</span>
                        <Badge variant="outline">{product.margin_percentage}% margin</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>Revenue: {formatCurrency(product.revenue)}</div>
                        <div>Cost: {formatCurrency(product.cost)}</div>
                        <div>Profit: {formatCurrency(product.profit)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.payments.by_method.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{method.method}</div>
                        <div className="text-sm text-muted-foreground">
                          {method.count} transactions • {method.percentage}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(method.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Completed</span>
                    <span className="font-bold">{formatCurrency(metrics.payments.total_processed)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Pending</span>
                    <span className="font-bold">{formatCurrency(metrics.payments.pending)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Failed</span>
                    <span className="font-bold">{formatCurrency(metrics.payments.failed)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Refunded</span>
                    <span className="font-bold">{formatCurrency(metrics.payments.refunded)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax by State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.taxes.by_state.map((state, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{state.state}</div>
                        <div className="text-sm text-muted-foreground">{state.rate}% rate</div>
                      </div>
                      <div className="font-medium">{formatCurrency(state.amount)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Total Collected</span>
                    <span className="font-bold">{formatCurrency(metrics.taxes.collected)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Remitted</span>
                    <span className="font-bold">{formatCurrency(metrics.taxes.remitted)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Pending Remittance</span>
                    <span className="font-bold">{formatCurrency(metrics.taxes.pending)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashFlow.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-full p-2 ${
                        item.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.type === 'in' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.category} • {formatDate(item.date)}
                        </div>
                        {item.reference && (
                          <div className="text-xs text-muted-foreground">
                            Ref: {item.reference}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-bold ${
                          item.type === 'in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.type === 'in' ? '+' : ''}{formatCurrency(item.amount)}
                        </div>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {item.status}
                        </div>
                      </Badge>
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