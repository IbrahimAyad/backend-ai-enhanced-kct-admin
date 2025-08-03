import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, DollarSign, Users, TrendingUp, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripeOrder {
  id: string;
  order_number: string;
  stripe_checkout_session_id: string;
  customer_id?: string;
  guest_email?: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  shipping_address: any;
  billing_address: any;
  items: any[];
  customer?: {
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string;
  };
}

export function StripeOrderManagement() {
  const [orders, setOrders] = useState<StripeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<StripeOrder | null>(null);
  const { toast } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(first_name, last_name, email, phone)
        `)
        .not('stripe_checkout_session_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load Stripe orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.email || order.guest_email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCoreProductCount = (items: any[]) => {
    return items.filter(item => item.stripe_price_id && item.stripe_product_id).length;
  };

  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    coreProductOrders: filteredOrders.filter(order => getCoreProductCount(order.items) > 0).length,
    avgOrderValue: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length 
      : 0
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading Stripe orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stripe Order Management</h2>
        <Button onClick={loadOrders} variant="outline">
          Refresh Orders
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Core Product Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coreProductOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders with Stripe core products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">#{order.order_number}</h3>
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {order.status}
                      </Badge>
                      {getCoreProductCount(order.items) > 0 && (
                        <Badge variant="outline" className="border-blue-500 text-blue-600">
                          Core Products
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>Customer: {order.customer?.email || order.guest_email}</div>
                      <div>Total: ${order.total.toFixed(2)} {order.currency.toUpperCase()}</div>
                      <div>Items: {order.items.length}</div>
                      <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - #{order.order_number}</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Customer Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <p><strong>Email:</strong> {selectedOrder.customer?.email || selectedOrder.guest_email}</p>
                                  {selectedOrder.customer?.first_name && (
                                    <p><strong>Name:</strong> {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}</p>
                                  )}
                                  {selectedOrder.customer?.phone && (
                                    <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                                  )}
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Shipping Address
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {selectedOrder.shipping_address ? (
                                    <div className="space-y-1 text-sm">
                                      <p>{selectedOrder.shipping_address.line1}</p>
                                      {selectedOrder.shipping_address.line2 && <p>{selectedOrder.shipping_address.line2}</p>}
                                      <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}</p>
                                      <p>{selectedOrder.shipping_address.country}</p>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">No shipping address</p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>

                            {/* Order Items */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Order Items</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {selectedOrder.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium">{item.name}</h4>
                                          {item.stripe_product_id && (
                                            <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">
                                              Core Product
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                                          <div className="text-xs">
                                            <strong>Customization:</strong> {JSON.stringify(item.attributes)}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">${item.unit_price.toFixed(2)} × {item.quantity}</p>
                                        <p className="text-sm text-muted-foreground">${item.total_price.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Order Status Update */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Update Order Status</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex gap-2">
                                  <Select 
                                    value={selectedOrder.status} 
                                    onValueChange={(newStatus) => updateOrderStatus(selectedOrder.id, newStatus)}
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}