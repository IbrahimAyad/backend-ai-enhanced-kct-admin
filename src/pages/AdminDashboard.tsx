import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  Eye,
  Crown,
  Settings,
  Star,
  Database,
  Download,
  Bell
} from 'lucide-react';
import { KCTMenswearAPI } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { UserMenu } from '@/components/auth/UserMenu';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { EnhancedDashboardWidgets } from '@/components/admin/EnhancedDashboardWidgets';
import { QuickActionWidgets } from '@/components/admin/QuickActionWidgets';
import { ExportManager } from '@/components/admin/ExportManager';
import { Customer360View } from '@/components/admin/Customer360View';
import { EnhancedInventory } from '@/components/admin/EnhancedInventory';
import { OrderTimeline } from '@/components/admin/OrderTimeline';
import { FinancialDashboard } from '@/components/admin/FinancialDashboard';
import { AnalyticsOverview } from '@/components/admin/AnalyticsOverview';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { CustomerManagement } from '@/components/admin/CustomerManagement';
import { ProductAnalytics } from '@/components/admin/ProductAnalytics';
import { SearchAnalytics } from '@/components/admin/SearchAnalytics';
import { BundleManagement } from '@/components/admin/BundleManagement';
import { LoyaltyManagement } from '@/components/admin/LoyaltyManagement';
import { ReviewManagement } from '@/components/admin/ReviewManagement';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { StripeOrderManagement } from '@/components/admin/StripeOrderManagement';
import { DataImportExport } from '@/components/admin/DataImportExport';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { CollectionManagement } from '@/components/admin/CollectionManagement';
import { ReportsManagement } from '@/components/admin/ReportsManagement';
import { EventsManagement } from '@/components/admin/EventsManagement';
import { IntegrationsManagement } from '@/components/admin/IntegrationsManagement';
import { CustomOrdersManagement } from '@/components/admin/CustomOrdersManagement';
import { RealTimeAnalytics } from '@/components/admin/RealTimeAnalytics';
import { EmailCampaignAnalytics } from '@/components/admin/EmailCampaignAnalytics';
import { RevenueForecasting } from '@/components/admin/RevenueForecasting';
import { AutomationWorkflows } from '@/components/admin/AutomationWorkflows';
import { PredictiveAnalytics } from '@/components/admin/PredictiveAnalytics';
import { CustomerLifetimeValue } from '@/components/admin/CustomerLifetimeValue';
import { ABTestingTools } from '@/components/admin/ABTestingTools';
import { InventoryForecasting } from '@/components/admin/InventoryForecasting';
import { RecommendationEngine } from '@/components/ai/RecommendationEngine';
import AdminOrderManagement from './AdminOrderManagement';

const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const { isAdmin, adminUser, loading: adminLoading } = useAdminAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the new dashboard data hook
  const { 
    loading: dataLoading, 
    stats: dashboardStats, 
    recentOrders, 
    lowStockProducts 
  } = useDashboardData();

  // Get current page info based on route
  const getPageInfo = () => {
    const path = location.pathname;
    switch (path) {
      case '/admin/analytics':
        return { title: 'Analytics', icon: BarChart3 };
      case '/admin/products':
        return { title: 'Products', icon: Package };
      case '/admin/collections':
        return { title: 'Collections', icon: Package };
      case '/admin/orders':
        return { title: 'Orders', icon: ShoppingCart };
      case '/admin/customers':
        return { title: 'Customers', icon: Users };
      case '/admin/weddings':
        return { title: 'Weddings', icon: Crown };
      case '/admin/reviews':
        return { title: 'Reviews', icon: Star };
      case '/admin/inventory':
        return { title: 'Inventory', icon: Database };
      case '/admin/settings':
        return { title: 'Settings', icon: Settings };
      default:
        return { title: 'Business Dashboard', icon: Crown };
    }
  };

  const currentPage = getPageInfo();

  // Render content based on current route
  const renderContent = () => {
    const path = location.pathname;
    console.log('Current admin path:', path);
    switch (path) {
      case '/admin/analytics':
        return <RealTimeAnalytics />;
      case '/admin/email-analytics':
        return <EmailCampaignAnalytics />;
      case '/admin/revenue-forecast':
        return <RevenueForecasting />;
      case '/admin/automation':
        return <AutomationWorkflows />;
      case '/admin/ai-recommendations':
        return <RecommendationEngine />;
      case '/admin/predictive-analytics':
        return <PredictiveAnalytics />;
      case '/admin/customer-lifetime-value':
        return <CustomerLifetimeValue />;
      case '/admin/ab-testing':
        return <ABTestingTools />;
      case '/admin/inventory-forecasting':
        return <InventoryForecasting />;
      case '/admin/products':
        return <ProductManagement />;
      case '/admin/collections':
        return <CollectionManagement />;
      case '/admin/orders':
        return <AdminOrderManagement />;
      case '/admin/stripe-orders':
        return <StripeOrderManagement />;
      case '/admin/data':
        return <DataImportExport />;
      case '/admin/data-management':
        return <DataImportExport />;
      case '/admin/customers':
        return <CustomerManagement />;
      case '/admin/weddings':
        return <BundleManagement />;
      case '/admin/reviews':
        return <ReviewManagement />;
      case '/admin/inventory':
        return <InventoryManagement />;
      case '/admin/search':
      case '/admin/search-analytics':
        return <SearchAnalytics />;
      case '/admin/reports':
        return <ReportsManagement />;
      case '/admin/events':
        return <EventsManagement />;
      case '/admin/custom-orders':
        return <CustomOrdersManagement />;
      case '/admin/integrations':
        return <IntegrationsManagement />;
      case '/admin/settings':
        return <div className="p-6"><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground">Settings panel coming soon...</p></div>;
      default:
        return renderDashboardHome();
    }
  };

  // Render the default dashboard home content
  const renderDashboardHome = () => (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
        <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
        <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        <TabsTrigger value="export" className="text-xs sm:text-sm">Export</TabsTrigger>
        <TabsTrigger value="quick-actions" className="text-xs sm:text-sm">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-medium ${stat.color}`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-muted-foreground">from last month</span>
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Action Widgets */}
        <QuickActionWidgets />
        
        {/* Enhanced Dashboard Widgets */}
        <EnhancedDashboardWidgets />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsOverview />
      </TabsContent>

      <TabsContent value="export" className="space-y-6">
        <ExportManager />
      </TabsContent>

      <TabsContent value="quick-actions" className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Package className="h-5 w-5" />
                  Add Product
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Eye className="h-5 w-5" />
                  View Inventory
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Download className="h-5 w-5" />
                  Export Products
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Product Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer & Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-5 w-5" />
                  New Customer
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  View Orders
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Crown className="h-5 w-5" />
                  Wedding Event
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Star className="h-5 w-5" />
                  Manage Reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{order.customer_name || order.customer_email}</p>
                          <Badge variant="outline" className="text-xs">
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold">${(order.total_amount || 0).toFixed(2)}</p>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                          {order.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No recent orders</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{item.product_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.available_quantity} units available</span>
                          {item.reserved_quantity > 0 && (
                            <>
                              <span>•</span>
                              <span>{item.reserved_quantity} reserved</span>
                            </>
                          )}
                          {item.sku && (
                            <>
                              <span>•</span>
                              <span>SKU: {item.sku}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge 
                          variant={
                            item.available_quantity === 0 ? 'destructive' : 
                            item.available_quantity < 5 ? 'destructive' : 
                            'outline'
                          }
                          className="text-xs"
                        >
                          {item.available_quantity === 0 ? 'Out of Stock' : 
                           item.available_quantity < 5 ? 'Critical' : 
                           'Low Stock'}
                        </Badge>
                        <Button size="sm" variant="outline" className="text-xs h-6">
                          Restock
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">All products are well stocked</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!adminLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, adminLoading, navigate]);

  // Remove access control - this is now a dedicated admin system

  const quickStats = [
    {
      title: "Total Orders",
      value: dashboardStats.totalOrders,
      icon: ShoppingCart,
      change: "+12%",
      color: "text-green-600"
    },
    {
      title: "Revenue",
      value: `$${dashboardStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+8.2%",
      color: "text-green-600"
    },
    {
      title: "Customers",
      value: dashboardStats.totalCustomers,
      icon: Users,
      change: "+3.1%",
      color: "text-green-600"
    },
    {
      title: "Avg Order Value",
      value: `$${dashboardStats.avgOrderValue}`,
      icon: TrendingUp,
      change: "+5.4%",
      color: "text-green-600"
    }
  ];

  // Show loading state while checking admin status or loading data
  if (adminLoading || (!user && !adminLoading) || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        <Button onClick={() => window.location.href = '/'} className="mt-4">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        
        <main className="flex-1 overflow-hidden">
          {/* Top Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2 min-w-0">
                <currentPage.icon className="h-5 w-5 text-primary shrink-0" />
                <h1 className="text-lg font-semibold truncate">{currentPage.title}</h1>
              </div>
              
              {/* Global Search - Hidden on mobile */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <GlobalSearch />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Notification Center */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
                
                {/* Export Quick Access */}
                <Button variant="outline" size="sm" className="hidden lg:flex">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                <Badge variant="outline" className="hidden sm:flex">
                  Last updated: {new Date().toLocaleTimeString()}
                </Badge>
                
                {/* User Menu for Sign In/Out */}
                <UserMenu />
              </div>
            </div>
            
            {/* Mobile Search */}
            <div className="md:hidden px-6 pb-4">
              <GlobalSearch />
            </div>
          </header>

          {/* Main Content */}
          <div className="p-6 space-y-8">
            <EmailVerificationBanner />
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;