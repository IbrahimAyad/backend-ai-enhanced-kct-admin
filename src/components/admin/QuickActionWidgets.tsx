import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart,
  Crown,
  Star,
  FileText,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Mail,
  Settings,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuickActionWidget {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  badge?: string;
  shortcuts?: string;
}

interface QuickStats {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
}

export function QuickActionWidgets() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [quickOrderData, setQuickOrderData] = useState({
    customer: '',
    products: '',
    notes: ''
  });

  // Quick stats for dashboard
  const quickStats: QuickStats[] = [
    {
      title: 'Pending Orders',
      value: 12,
      change: '+3 today',
      trend: 'up',
      icon: Clock
    },
    {
      title: 'Low Stock',
      value: 8,
      change: '2 critical',
      trend: 'warning' as 'up',
      icon: AlertTriangle
    },
    {
      title: 'New Reviews',
      value: 5,
      change: '4.8 avg rating',
      trend: 'up',
      icon: Star
    },
    {
      title: 'Revenue Today',
      value: '$3,247',
      change: '+12% vs yesterday',
      trend: 'up',
      icon: DollarSign
    }
  ];

  // Quick action widgets
  const quickActions: QuickActionWidget[] = [
    {
      id: 'add-product',
      title: 'Add Product',
      description: 'Create new product listing',
      icon: Plus,
      action: () => navigate('/admin/products'),
      shortcuts: 'Ctrl+Shift+P'
    },
    {
      id: 'search-orders',
      title: 'Search Orders',
      description: 'Find specific order',
      icon: Search,
      action: () => navigate('/admin/orders'),
      shortcuts: 'Ctrl+/'
    },
    {
      id: 'customer-lookup',
      title: 'Customer Lookup',
      description: 'Find customer details',
      icon: Users,
      action: () => navigate('/admin/customers')
    },
    {
      id: 'inventory-check',
      title: 'Inventory Check',
      description: 'View stock levels',
      icon: Package,
      action: () => navigate('/admin/inventory'),
      badge: '8 low'
    },
    {
      id: 'wedding-schedule',
      title: 'Wedding Schedule',
      description: 'Upcoming events',
      icon: Crown,
      action: () => navigate('/admin/weddings'),
      badge: '3 this month'
    },
    {
      id: 'daily-report',
      title: 'Daily Report',
      description: 'Generate today\'s summary',
      icon: FileText,
      action: () => handleGenerateReport('daily')
    },
    {
      id: 'send-newsletter',
      title: 'Send Newsletter',
      description: 'Email marketing campaign',
      icon: Mail,
      action: () => handleSendNewsletter()
    },
    {
      id: 'sync-inventory',
      title: 'Sync Inventory',
      description: 'Update stock from suppliers',
      icon: RefreshCw,
      action: () => handleSyncInventory(),
      variant: 'warning' as 'default'
    }
  ];

  const handleGenerateReport = (type: string) => {
    toast({
      title: "Report Generated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} report is being prepared...`,
    });
    // Simulate report generation
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      toast({
        title: "Report Ready",
        description: "Your report has been generated and is ready for download.",
      });
    }, 2000);
  };

  const handleSendNewsletter = () => {
    toast({
      title: "Newsletter Campaign",
      description: "Redirecting to email campaign builder...",
    });
    navigate('/admin/email-analytics');
  };

  const handleSyncInventory = () => {
    toast({
      title: "Inventory Sync",
      description: "Syncing inventory data from suppliers...",
    });
    // Simulate sync process
    setTimeout(() => {
      toast({
        title: "Sync Complete",
        description: "Inventory has been updated successfully.",
      });
    }, 3000);
  };

  const handleQuickOrder = () => {
    if (!quickOrderData.customer || !quickOrderData.products) {
      toast({
        title: "Missing Information",
        description: "Please fill in customer and products fields.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    // Simulate order creation
    setTimeout(() => {
      toast({
        title: "Order Created",
        description: `Order #ORD-${Date.now().toString().slice(-4)} created successfully.`,
      });
      setQuickOrderData({ customer: '', products: '', notes: '' });
      setIsCreating(false);
    }, 1500);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={cn("text-xs flex items-center gap-1", getTrendColor(stat.trend))}>
                      <span>{getTrendIcon(stat.trend)}</span>
                      {stat.change}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Use keyboard shortcuts for faster access
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-start gap-2 text-left hover:bg-accent/50",
                    action.variant === 'warning' && "border-orange-200 hover:border-orange-300",
                    action.variant === 'success' && "border-green-200 hover:border-green-300",
                    action.variant === 'destructive' && "border-red-200 hover:border-red-300"
                  )}
                  onClick={action.action}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="h-5 w-5 text-primary" />
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    {action.shortcuts && (
                      <p className="text-xs text-primary font-mono">{action.shortcuts}</p>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Order Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Order Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-customer">Customer</Label>
              <Input
                id="quick-customer"
                placeholder="Customer name or email"
                value={quickOrderData.customer}
                onChange={(e) => setQuickOrderData({ ...quickOrderData, customer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-products">Products</Label>
              <Input
                id="quick-products"
                placeholder="Product names or SKUs"
                value={quickOrderData.products}
                onChange={(e) => setQuickOrderData({ ...quickOrderData, products: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-notes">Notes (optional)</Label>
              <Input
                id="quick-notes"
                placeholder="Order notes"
                value={quickOrderData.notes}
                onChange={(e) => setQuickOrderData({ ...quickOrderData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleQuickOrder}
              disabled={isCreating || !quickOrderData.customer || !quickOrderData.products}
              className="min-w-[120px]"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Last Backup</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Users</p>
                <p className="text-xs text-muted-foreground">23 online now</p>
              </div>
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}