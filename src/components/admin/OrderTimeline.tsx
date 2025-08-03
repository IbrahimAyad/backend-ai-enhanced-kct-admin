import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Eye,
  Calendar,
  MapPin,
  User,
  CreditCard,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderTimelineItem {
  id: string;
  status: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  estimated_date?: string;
  actual_date?: string;
  notes?: string;
  staff_member?: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: 'pending' | 'processing' | 'manufactured' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  estimated_delivery: string;
  tracking_number?: string;
  payment_status: string;
  items_count: number;
  timeline: OrderTimelineItem[];
  shipping_address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  items: Array<{
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    price: number;
    customizations?: string[];
  }>;
}

interface ReturnExchange {
  id: string;
  order_id: string;
  type: 'return' | 'exchange';
  status: 'pending' | 'approved' | 'processing' | 'completed';
  reason: string;
  items: string[];
  created_at: string;
  resolved_at?: string;
}

export function OrderTimeline() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [returns, setReturns] = useState<ReturnExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock order data
      const mockOrders: OrderDetails[] = [
        {
          id: '1',
          order_number: 'ORD-2024-001',
          customer_name: 'John Doe',
          customer_email: 'john.doe@email.com',
          total: 1299.99,
          status: 'processing',
          created_at: '2024-01-15T10:30:00Z',
          estimated_delivery: '2024-02-10T00:00:00Z',
          tracking_number: 'TRK123456789',
          payment_status: 'paid',
          items_count: 3,
          shipping_address: {
            street: '123 Main Street, Apt 4B',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            zip: '10001'
          },
          items: [
            {
              id: '1',
              product_name: 'Classic Navy Suit',
              sku: 'CNS-42R-NAVY',
              quantity: 1,
              price: 899.99,
              customizations: ['Hemmed sleeves', 'Tapered pants']
            },
            {
              id: '2',
              product_name: 'White Dress Shirt',
              sku: 'WDS-16.5-WHT',
              quantity: 2,
              price: 200.00
            }
          ],
          timeline: [
            {
              id: '1',
              status: 'order_placed',
              title: 'Order Placed',
              description: 'Order received and payment confirmed',
              timestamp: '2024-01-15T10:30:00Z',
              completed: true,
              actual_date: '2024-01-15T10:30:00Z',
              staff_member: 'System'
            },
            {
              id: '2',
              status: 'payment_confirmed',
              title: 'Payment Confirmed',
              description: 'Payment of $1,299.99 processed successfully',
              timestamp: '2024-01-15T10:32:00Z',
              completed: true,
              actual_date: '2024-01-15T10:32:00Z',
              staff_member: 'Payment System'
            },
            {
              id: '3',
              status: 'measurements_reviewed',
              title: 'Measurements Reviewed',
              description: 'Customer measurements verified by tailoring team',
              timestamp: '2024-01-16T09:15:00Z',
              completed: true,
              actual_date: '2024-01-16T09:15:00Z',
              staff_member: 'Sarah Johnson',
              notes: 'Measurements confirmed. Minor adjustments noted for jacket length.'
            },
            {
              id: '4',
              status: 'production_started',
              title: 'Production Started',
              description: 'Items sent to manufacturing facility',
              timestamp: '2024-01-18T14:00:00Z',
              completed: true,
              actual_date: '2024-01-18T14:00:00Z',
              staff_member: 'Mike Chen'
            },
            {
              id: '5',
              status: 'quality_check',
              title: 'Quality Control',
              description: 'Final quality inspection and approval',
              timestamp: '2024-01-25T00:00:00Z',
              completed: false,
              estimated_date: '2024-01-25T00:00:00Z'
            },
            {
              id: '6',
              status: 'shipped',
              title: 'Shipped',
              description: 'Package dispatched via express delivery',
              timestamp: '2024-01-26T00:00:00Z',
              completed: false,
              estimated_date: '2024-01-26T00:00:00Z'
            },
            {
              id: '7',
              status: 'delivered',
              title: 'Delivered',
              description: 'Package delivered to customer',
              timestamp: '2024-01-28T00:00:00Z',
              completed: false,
              estimated_date: '2024-01-28T00:00:00Z'
            }
          ]
        },
        {
          id: '2',
          order_number: 'ORD-2024-002',
          customer_name: 'Jane Smith',
          customer_email: 'jane.smith@email.com',
          total: 599.99,
          status: 'shipped',
          created_at: '2024-01-12T15:20:00Z',
          estimated_delivery: '2024-01-22T00:00:00Z',
          tracking_number: 'TRK987654321',
          payment_status: 'paid',
          items_count: 1,
          shipping_address: {
            street: '456 Oak Avenue',
            city: 'Los Angeles',
            state: 'CA',
            country: 'USA',
            zip: '90210'
          },
          items: [
            {
              id: '3',
              product_name: 'Charcoal Business Suit',
              sku: 'CBS-38R-CHAR',
              quantity: 1,
              price: 599.99
            }
          ],
          timeline: [
            {
              id: '8',
              status: 'order_placed',
              title: 'Order Placed',
              description: 'Order received and payment confirmed',
              timestamp: '2024-01-12T15:20:00Z',
              completed: true,
              actual_date: '2024-01-12T15:20:00Z'
            },
            {
              id: '9',
              status: 'shipped',
              title: 'Shipped',
              description: 'Package shipped via FedEx Express',
              timestamp: '2024-01-20T10:00:00Z',
              completed: true,
              actual_date: '2024-01-20T10:00:00Z',
              staff_member: 'Logistics Team'
            }
          ]
        }
      ];

      const mockReturns: ReturnExchange[] = [
        {
          id: '1',
          order_id: '1',
          type: 'exchange',
          status: 'pending',
          reason: 'Size adjustment needed',
          items: ['Classic Navy Suit'],
          created_at: '2024-01-20T14:30:00Z'
        }
      ];

      setOrders(mockOrders);
      setReturns(mockReturns);
      
    } catch (error) {
      console.error('Error loading order data:', error);
      toast({
        title: "Error",
        description: "Failed to load order data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'manufactured': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (timeline: OrderTimelineItem[]) => {
    const completedSteps = timeline.filter(item => item.completed).length;
    return (completedSteps / timeline.length) * 100;
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Order Timeline Management</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers..."
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
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="manufactured">Manufactured</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={loadOrderData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const progressPercent = getProgressPercentage(order.timeline);
              const nextStep = order.timeline.find(item => !item.completed);
              
              return (
                <div 
                  key={order.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.order_number}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_name} • {order.items_count} items • {formatCurrency(order.total)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Est. Delivery</div>
                        <div className="font-medium">{formatDateShort(order.estimated_delivery)}</div>
                      </div>
                      {order.tracking_number && (
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">Tracking</div>
                          <div className="font-medium">{order.tracking_number}</div>
                        </div>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress: {Math.round(progressPercent)}%</span>
                      {nextStep && (
                        <span className="text-muted-foreground">
                          Next: {nextStep.title}
                        </span>
                      )}
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Returns & Exchanges */}
      {returns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Returns & Exchanges ({returns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {returns.map(returnItem => (
                <div key={returnItem.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <RefreshCw className="h-6 w-6 text-orange-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {returnItem.type === 'return' ? 'Return' : 'Exchange'} Request
                          </span>
                          <Badge variant="outline">{returnItem.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Order: {returnItem.order_id} • {returnItem.reason}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Items: {returnItem.items.join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <Button size="sm">
                        Process
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Timeline - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Customer</span>
                    </div>
                    <div className="text-sm">
                      <div>{selectedOrder.customer_name}</div>
                      <div className="text-muted-foreground">{selectedOrder.customer_email}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Shipping Address</span>
                    </div>
                    <div className="text-sm">
                      <div>{selectedOrder.shipping_address.street}</div>
                      <div className="text-muted-foreground">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Payment</span>
                    </div>
                    <div className="text-sm">
                      <div>{formatCurrency(selectedOrder.total)}</div>
                      <div className="text-muted-foreground capitalize">{selectedOrder.payment_status}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.timeline.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${
                            item.completed 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {item.completed ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          {index < selectedOrder.timeline.length - 1 && (
                            <div className={`w-0.5 h-12 ${
                              item.completed ? 'bg-green-200' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.title}</span>
                            {item.completed && (
                              <Badge variant="outline" className="text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          
                          <div className="text-xs text-muted-foreground">
                            {item.completed ? (
                              <span>Completed: {formatDate(item.actual_date!)}</span>
                            ) : (
                              <span>Estimated: {formatDate(item.estimated_date!)}</span>
                            )}
                            {item.staff_member && (
                              <span className="ml-4">By: {item.staff_member}</span>
                            )}
                          </div>
                          
                          {item.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <strong>Notes:</strong> {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {item.sku} • Qty: {item.quantity}
                          </div>
                          {item.customizations && (
                            <div className="text-xs text-blue-600">
                              Customizations: {item.customizations.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="font-medium">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}