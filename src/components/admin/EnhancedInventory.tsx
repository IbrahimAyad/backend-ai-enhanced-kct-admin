import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Eye,
  Edit,
  RefreshCw,
  Truck,
  BarChart3,
  Calendar,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductVariant {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  color: string;
  size: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  reorder_point: number;
  max_stock: number;
  cost_price: number;
  selling_price: number;
  supplier_id: string;
  supplier_name: string;
  lead_time_days: number;
  last_restock_date: string;
  stock_movements: Array<{
    id: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    reason: string;
    date: string;
    reference: string;
  }>;
}

interface StockAlert {
  id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  color: string;
  size: string;
  current_stock: number;
  reorder_point: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  priority: 'high' | 'medium' | 'low';
  days_until_stockout: number;
}

interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  lead_time_days: number;
  reliability_score: number;
  active_products: number;
}

export function EnhancedInventory() {
  const { toast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockVariants: ProductVariant[] = [
        {
          id: '1',
          product_id: 'prod_1',
          product_name: 'Classic Navy Suit',
          sku: 'CNS-42R-NAVY',
          color: 'Navy',
          size: '42R',
          current_stock: 5,
          reserved_stock: 2,
          available_stock: 3,
          reorder_point: 10,
          max_stock: 50,
          cost_price: 180.00,
          selling_price: 399.99,
          supplier_id: 'sup_1',
          supplier_name: 'Premium Textiles Ltd',
          lead_time_days: 14,
          last_restock_date: '2024-01-10T00:00:00Z',
          stock_movements: [
            {
              id: '1',
              type: 'out',
              quantity: -2,
              reason: 'Sale - Order #ORD-2024-001',
              date: '2024-01-20T10:30:00Z',
              reference: 'ORD-2024-001'
            },
            {
              id: '2',
              type: 'in',
              quantity: 20,
              reason: 'Restock from supplier',
              date: '2024-01-10T14:00:00Z',
              reference: 'PO-2024-005'
            }
          ]
        },
        {
          id: '2',
          product_id: 'prod_1',
          product_name: 'Classic Navy Suit',
          sku: 'CNS-40R-NAVY',
          color: 'Navy',
          size: '40R',
          current_stock: 2,
          reserved_stock: 1,
          available_stock: 1,
          reorder_point: 8,
          max_stock: 40,
          cost_price: 180.00,
          selling_price: 399.99,
          supplier_id: 'sup_1',
          supplier_name: 'Premium Textiles Ltd',
          lead_time_days: 14,
          last_restock_date: '2024-01-10T00:00:00Z',
          stock_movements: [
            {
              id: '3',
              type: 'out',
              quantity: -3,
              reason: 'Sale - Order #ORD-2024-003',
              date: '2024-01-18T15:20:00Z',
              reference: 'ORD-2024-003'
            }
          ]
        },
        {
          id: '3',
          product_id: 'prod_2',
          product_name: 'Premium Leather Shoes',
          sku: 'PLS-10.5-BLK',
          color: 'Black',
          size: '10.5',
          current_stock: 0,
          reserved_stock: 0,
          available_stock: 0,
          reorder_point: 5,
          max_stock: 25,
          cost_price: 89.99,
          selling_price: 199.99,
          supplier_id: 'sup_2',
          supplier_name: 'Italian Leather Co',
          lead_time_days: 21,
          last_restock_date: '2023-12-15T00:00:00Z',
          stock_movements: [
            {
              id: '4',
              type: 'out',
              quantity: -1,
              reason: 'Sale - Order #ORD-2024-002',
              date: '2024-01-19T11:45:00Z',
              reference: 'ORD-2024-002'
            }
          ]
        }
      ];

      const mockAlerts: StockAlert[] = [
        {
          id: '1',
          variant_id: '2',
          product_name: 'Classic Navy Suit',
          sku: 'CNS-40R-NAVY',
          color: 'Navy',
          size: '40R',
          current_stock: 2,
          reorder_point: 8,
          alert_type: 'low_stock',
          priority: 'high',
          days_until_stockout: 7
        },
        {
          id: '2',
          variant_id: '3',
          product_name: 'Premium Leather Shoes',
          sku: 'PLS-10.5-BLK',
          color: 'Black',
          size: '10.5',
          current_stock: 0,
          reorder_point: 5,
          alert_type: 'out_of_stock',
          priority: 'high',
          days_until_stockout: 0
        }
      ];

      const mockSuppliers: Supplier[] = [
        {
          id: 'sup_1',
          name: 'Premium Textiles Ltd',
          contact_email: 'orders@premiumtextiles.com',
          contact_phone: '+1 (555) 234-5678',
          address: '123 Industrial Ave, Fashion District, NY 10018',
          lead_time_days: 14,
          reliability_score: 95,
          active_products: 45
        },
        {
          id: 'sup_2',
          name: 'Italian Leather Co',
          contact_email: 'sales@italianleather.com',
          contact_phone: '+39 02 1234 5678',
          address: 'Via del Cuoio 15, Milano, Italy',
          lead_time_days: 21,
          reliability_score: 88,
          active_products: 23
        }
      ];

      setVariants(mockVariants);
      setAlerts(mockAlerts);
      setSuppliers(mockSuppliers);
      
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVariants = variants.filter(variant => {
    const matchesSearch = 
      variant.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.size.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'low_stock' && variant.current_stock <= variant.reorder_point) ||
      (statusFilter === 'out_of_stock' && variant.current_stock === 0) ||
      (statusFilter === 'in_stock' && variant.current_stock > variant.reorder_point);
    
    return matchesSearch && matchesStatus;
  });

  const getStockStatus = (variant: ProductVariant) => {
    if (variant.current_stock === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (variant.current_stock <= variant.reorder_point) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStockValue = () => {
    return variants.reduce((total, variant) => 
      total + (variant.current_stock * variant.cost_price), 0
    );
  };

  const getLowStockCount = () => {
    return variants.filter(v => v.current_stock <= v.reorder_point && v.current_stock > 0).length;
  };

  const getOutOfStockCount = () => {
    return variants.filter(v => v.current_stock === 0).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced Inventory Management</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, SKU, color, size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadInventoryData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(calculateStockValue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{getLowStockCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{getOutOfStockCount()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Variants</p>
                <p className="text-2xl font-bold">{variants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Variants ({filteredVariants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVariants.map(variant => {
                  const stockStatus = getStockStatus(variant);
                  const stockPercent = (variant.current_stock / variant.max_stock) * 100;
                  
                  return (
                    <div 
                      key={variant.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="flex items-center gap-4">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{variant.product_name}</span>
                            <Badge className={stockStatus.color}>
                              {stockStatus.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.sku} • {variant.color} • {variant.size}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Supplier: {variant.supplier_name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Current</div>
                          <div className="font-medium">{variant.current_stock}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Available</div>
                          <div className="font-medium">{variant.available_stock}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Reorder Point</div>
                          <div className="font-medium">{variant.reorder_point}</div>
                        </div>
                        <div className="w-24">
                          <div className="text-sm text-muted-foreground mb-1">Stock Level</div>
                          <Progress value={stockPercent} className="h-2" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Value</div>
                          <div className="font-medium">{formatCurrency(variant.current_stock * variant.cost_price)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <Alert key={alert.id} className="border-l-4 border-l-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.product_name}</span>
                            <Badge className={getPriorityColor(alert.priority)}>
                              {alert.priority} priority
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {alert.sku} • {alert.color} • {alert.size}
                          </div>
                          <div className="text-sm">
                            Current stock: {alert.current_stock} | Reorder point: {alert.reorder_point}
                          </div>
                          {alert.days_until_stockout > 0 && (
                            <div className="text-sm text-yellow-600">
                              Estimated stockout in {alert.days_until_stockout} days
                            </div>
                          )}
                        </div>
                        <Button size="sm" className="gap-2">
                          <Truck className="h-4 w-4" />
                          Reorder
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers.map(supplier => (
                  <div key={supplier.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{supplier.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{supplier.contact_email}</span>
                          <span>{supplier.contact_phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {supplier.reliability_score}% reliable
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Lead Time:</span>
                        <span className="ml-2">{supplier.lead_time_days} days</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active Products:</span>
                        <span className="ml-2">{supplier.active_products}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{supplier.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stock Movement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Analytics dashboard coming soon...
                  <br />
                  Will include stock movement charts, turnover rates, and forecasting
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Supplier performance metrics coming soon...
                  <br />
                  Will include delivery times, quality scores, and cost analysis
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Variant Detail Modal */}
      <Dialog open={!!selectedVariant} onOpenChange={() => setSelectedVariant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Variant Details</DialogTitle>
          </DialogHeader>
          
          {selectedVariant && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <p className="text-lg">{selectedVariant.product_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <p className="text-lg">{selectedVariant.sku}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <p className="text-lg">{selectedVariant.color}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Size</label>
                  <p className="text-lg">{selectedVariant.size}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedVariant.current_stock}</div>
                  <div className="text-sm text-muted-foreground">Current Stock</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedVariant.available_stock}</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedVariant.reserved_stock}</div>
                  <div className="text-sm text-muted-foreground">Reserved</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Recent Stock Movements</h3>
                <div className="space-y-2">
                  {selectedVariant.stock_movements.map(movement => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="flex items-center gap-2">
                          {movement.type === 'in' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">{movement.reason}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{formatDate(movement.date)}</div>
                        <div className="text-muted-foreground">{movement.reference}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}