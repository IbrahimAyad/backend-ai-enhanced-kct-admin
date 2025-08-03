import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Eye, Package, Truck, CheckCircle, XCircle, Search, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface OrderItem {
  id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string;
  color: string;
  category: string;
  image_url: string;
  attributes: any;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  shipping_address: any;
  billing_address: any;
  bundle_info: any;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    console.log('loadOrders function called, current loading state:', loading);
    
    try {
      console.log('Setting loading to true');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      console.log('Orders query completed:', { data, error, dataLength: data?.length });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Transform the data to match expected interface
      const transformedOrders = (data || []).map(order => ({
        ...order,
        // Map database column names to expected property names
        tax: order.tax_amount || 0,
        shipping: order.shipping_amount || 0, 
        discount: order.discount_amount || 0,
        total: order.total_amount || 0,
        customer_name: order.guest_email || 'Guest Customer',
        customer_email: order.guest_email || ''
      }));

      console.log('Setting transformed orders data');
      setOrders(transformedOrders);
      
      toast({
        title: "Orders loaded",
        description: `Loaded ${transformedOrders?.length || 0} orders`,
      });
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error loading orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log('Finally block: setting loading to false');
      setLoading(false);
      console.log('Loading state should now be false');
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Loader2 className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const exportOrders = () => {
    const csvData = filteredOrders.map(order => ({
      'Order Number': order.order_number,
      'Customer': order.customer_name || order.customer_email,
      'Email': order.customer_email,
      'Status': order.status,
      'Items': order.order_items?.length || 0,
      'Total': `$${order.total.toFixed(2)}`,
      'Date': new Date(order.created_at).toLocaleDateString(),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kct-orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${filteredOrders.length} orders`,
    });
  };

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    processing: filteredOrders.filter(o => o.status === 'processing').length,
    shipped: filteredOrders.filter(o => o.status === 'shipped').length,
    totalRevenue: filteredOrders.reduce((sum, o) => sum + o.total, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportOrders} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={loadOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{order.order_number}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                    {order.bundle_info?.is_bundle && (
                      <Badge variant="outline">Bundle</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_name || order.customer_email || 'Guest'} • {order.order_items?.length || 0} items • ${(order.total || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Order Details: {order.order_number}</DialogTitle>
                        <DialogDescription>
                          Complete order information and items
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedOrder && (
                        <div className="space-y-6">
                          {/* Customer Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Customer Information</h4>
                              <p className="text-sm"><strong>Name:</strong> {selectedOrder.customer_name || 'N/A'}</p>
                              <p className="text-sm"><strong>Email:</strong> {selectedOrder.customer_email}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Order Summary</h4>
                              <p className="text-sm"><strong>Status:</strong> 
                                <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                                  {selectedOrder.status}
                                </Badge>
                              </p>
                              <p className="text-sm"><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                            </div>
                          </div>

                          <Separator />

                          {/* Shipping Address */}
                          {selectedOrder.shipping_address && (
                            <div>
                              <h4 className="font-medium mb-2">Shipping Address</h4>
                              <div className="text-sm text-muted-foreground">
                                <p>{selectedOrder.shipping_address.line1}</p>
                                {selectedOrder.shipping_address.line2 && <p>{selectedOrder.shipping_address.line2}</p>}
                                <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}</p>
                                <p>{selectedOrder.shipping_address.country}</p>
                              </div>
                            </div>
                          )}

                          <Separator />

                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-4">Order Items</h4>
                            <div className="space-y-3">
                              {selectedOrder.order_items?.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                                  {item.image_url && (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.product_name}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h5 className="font-medium">{item.product_name}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      SKU: {item.product_sku} • Size: {item.size} • Color: {item.color}
                                    </p>
                                    <p className="text-sm">
                                      Qty: {item.quantity} × ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Order Totals */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                            </div>
                            {(selectedOrder.discount || 0) > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount:</span>
                                <span>-${(selectedOrder.discount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>${(selectedOrder.tax || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping:</span>
                              <span>${(selectedOrder.shipping || 0).toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total:</span>
                              <span>${(selectedOrder.total || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}