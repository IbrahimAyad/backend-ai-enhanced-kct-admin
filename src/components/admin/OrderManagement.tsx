import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  product_sku: string;
  product_name: string;
  size?: string;
  color?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  item_status: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  order_type: 'standard' | 'custom' | 'wedding' | 'bulk';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'failed' | 'refunded';
  payment_method?: string;
  shipping_method?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address_line_1?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  special_instructions?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  order_items?: OrderItem[];
}

export function OrderManagement() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive"
        });
        return;
      }

      setOrders(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: "No orders found. Orders will appear here when customers place them.",
        });
      }

    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load order data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updates: Partial<Order> = { status };
      
      // Add timestamps for certain status changes
      if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updates }
          : order
      ));

      toast({
        title: "Success",
        description: `Order status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const updateOrderTracking = async (orderId: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, tracking_number: trackingNumber }
          : order
      ));

      toast({
        title: "Success",
        description: "Tracking number updated"
      });
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast({
        title: "Error",
        description: "Failed to update tracking number",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = orderTypeFilter === 'all' || order.order_type === orderTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    totalRevenue: orders
      .filter(o => !['cancelled', 'refunded'].includes(o.status))
      .reduce((sum, o) => sum + o.total_amount, 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': 
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'refunded': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="bulk">Bulk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{orderStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{orderStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-xl font-bold">{orderStats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-xl font-bold">{orderStats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(orderStats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    
                    <TableCell>
                      {order.customer ? (
                        <div>
                          <p className="font-medium">
                            {order.customer.first_name} {order.customer.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Guest</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="font-medium">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{order.order_type}</Badge>
                    </TableCell>
                    
                    <TableCell className="text-sm">
                      {formatDate(order.created_at)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Select 
                          value={order.status} 
                          onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders found</p>
                <p className="text-sm">Orders will appear here when customers place them</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Order Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="text-sm font-medium">{selectedOrder.order_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <span className="text-sm">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedOrder.customer ? (
                      <>
                        <p className="font-medium">
                          {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customer.email}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Guest Customer</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getPaymentStatusColor(selectedOrder.payment_status)}>
                        {selectedOrder.payment_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Method:</span>
                      <span className="text-sm">{selectedOrder.payment_method || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="text-sm font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address_line_1 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p>{selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}</p>
                      <p>{selectedOrder.shipping_address_line_1}</p>
                      <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}</p>
                      <p>{selectedOrder.shipping_country}</p>
                    </div>
                    
                    {selectedOrder.tracking_number && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Tracking:</span>
                          <span className="text-sm font-medium">{selectedOrder.tracking_number}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-sm font-medium">Add Tracking Number:</label>
                      <div className="flex gap-2 mt-2">
                        <Input 
                          placeholder="Enter tracking number"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              updateOrderTracking(selectedOrder.id, target.value);
                              target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Size/Color</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.order_items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.product_sku}</TableCell>
                            <TableCell className="text-sm">
                              {[item.size, item.color].filter(Boolean).join(' / ') || 'N/A'}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(item.line_total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                        </div>
                      )}
                      {selectedOrder.shipping_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping:</span>
                          <span>{formatCurrency(selectedOrder.shipping_amount)}</span>
                        </div>
                      )}
                      {selectedOrder.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {(selectedOrder.special_instructions || selectedOrder.internal_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrder.special_instructions && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Special Instructions:</h4>
                        <p className="text-sm text-muted-foreground">{selectedOrder.special_instructions}</p>
                      </div>
                    )}
                    {selectedOrder.internal_notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Internal Notes:</h4>
                        <p className="text-sm text-muted-foreground">{selectedOrder.internal_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}