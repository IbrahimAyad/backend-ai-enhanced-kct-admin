import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  Package,
  MessageSquare,
  Ruler,
  TrendingUp,
  Star,
  Clock,
  CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer360Props {
  customerId: string;
  onClose?: () => void;
}

interface CustomerDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  last_login: string;
  total_orders: number;
  lifetime_value: number;
  loyalty_tier: string;
  loyalty_points: number;
  status: 'active' | 'inactive' | 'suspended';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  };
  measurements: {
    jacket_size: string;
    jacket_size_confidence: number;
    vest_size: string;
    shirt_size: string;
    shoe_size: string;
    pants_size: string;
    size_profile_completeness: number;
  };
  preferences: {
    primary_occasion: string;
    preferred_brands: string[];
    size_notes: string;
    communication_preference: 'email' | 'phone' | 'sms';
  };
  orders: Array<{
    id: string;
    order_number: string;
    date: string;
    status: string;
    total: number;
    items_count: number;
    payment_method: string;
  }>;
  communications: Array<{
    id: string;
    type: 'email' | 'phone' | 'sms' | 'note';
    subject: string;
    content: string;
    date: string;
    staff_member: string;
  }>;
}

export function Customer360View({ customerId, onClose }: Customer360Props) {
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCustomerDetails();
  }, [customerId]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock customer data
      const mockCustomer: CustomerDetails = {
        id: customerId,
        email: 'john.doe@email.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1 (555) 123-4567',
        avatar_url: '',
        created_at: '2023-01-15T00:00:00Z',
        last_login: '2024-01-20T14:30:00Z',
        total_orders: 12,
        lifetime_value: 4850.00,
        loyalty_tier: 'Gold',
        loyalty_points: 2450,
        status: 'active',
        address: {
          street: '123 Main Street, Apt 4B',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zip: '10001'
        },
        measurements: {
          jacket_size: '42R',
          jacket_size_confidence: 95,
          vest_size: '40R',
          shirt_size: '16.5x34',
          shoe_size: '10.5D',
          pants_size: '32x32',
          size_profile_completeness: 85
        },
        preferences: {
          primary_occasion: 'Business/Formal',
          preferred_brands: ['Hugo Boss', 'Calvin Klein', 'Ralph Lauren'],
          size_notes: 'Prefers slim fit jackets, regular fit pants',
          communication_preference: 'email'
        },
        orders: [
          {
            id: '1',
            order_number: 'ORD-2024-001',
            date: '2024-01-15T00:00:00Z',
            status: 'delivered',
            total: 1299.99,
            items_count: 3,
            payment_method: 'Credit Card'
          },
          {
            id: '2',
            order_number: 'ORD-2023-089',
            date: '2023-12-20T00:00:00Z',
            status: 'delivered',
            total: 850.00,
            items_count: 2,
            payment_method: 'PayPal'
          },
          {
            id: '3',
            order_number: 'ORD-2023-067',
            date: '2023-11-10T00:00:00Z',
            status: 'delivered',
            total: 425.50,
            items_count: 1,
            payment_method: 'Credit Card'
          }
        ],
        communications: [
          {
            id: '1',
            type: 'email',
            subject: 'Order Confirmation - ORD-2024-001',
            content: 'Thank you for your order. Your items will be shipped within 2-3 business days.',
            date: '2024-01-15T10:30:00Z',
            staff_member: 'System'
          },
          {
            id: '2',
            type: 'phone',
            subject: 'Size Consultation',
            content: 'Discussed jacket sizing for upcoming wedding order. Confirmed 42R with alterations.',
            date: '2024-01-10T14:15:00Z',
            staff_member: 'Sarah Johnson'
          },
          {
            id: '3',
            type: 'note',
            subject: 'Customer Preference',
            content: 'Customer prefers slim fit jackets and has a preference for darker colors.',
            date: '2023-12-15T09:00:00Z',
            staff_member: 'Mike Chen'
          }
        ]
      };

      setCustomer(mockCustomer);
    } catch (error) {
      console.error('Error loading customer details:', error);
      toast({
        title: "Error",
        description: "Failed to load customer details",
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'note': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Customer not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={customer.avatar_url} />
                <AvatarFallback className="text-lg">
                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {customer.first_name} {customer.last_name}
                  </h2>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {customer.loyalty_tier}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {customer.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Customer since {formatDate(customer.created_at)}
                  </div>
                </div>
              </div>
            </div>
            
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{customer.total_orders}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{formatCurrency(customer.lifetime_value)}</div>
            <div className="text-sm text-muted-foreground">Lifetime Value</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{customer.loyalty_points.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Loyalty Points</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{formatCurrency(customer.lifetime_value / customer.total_orders)}</div>
            <div className="text-sm text-muted-foreground">Avg Order Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{customer.address.street}</p>
                <p>{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
                <p>{customer.address.country}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Account Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span>{formatDate(customer.last_login)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span>{formatDate(customer.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-green-100 text-green-800">{customer.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(order.date)} • {order.items_count} items
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(order.total)}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {order.payment_method}
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Size Profile ({customer.measurements.size_profile_completeness}% Complete)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Jacket Size</label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{customer.measurements.jacket_size}</span>
                      <Badge variant="outline">{customer.measurements.jacket_size_confidence}% confident</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Vest Size</label>
                    <span className="block text-lg">{customer.measurements.vest_size}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Shirt Size</label>
                    <span className="block text-lg">{customer.measurements.shirt_size}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Shoe Size</label>
                    <span className="block text-lg">{customer.measurements.shoe_size}</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Pants Size</label>
                    <span className="block text-lg">{customer.measurements.pants_size}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Sizing Notes:</strong> {customer.preferences.size_notes}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {customer.communications.map((comm) => (
                    <div key={comm.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getCommunicationIcon(comm.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{comm.subject}</span>
                          <Badge variant="outline" className="text-xs">
                            {comm.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{comm.content}</p>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comm.date)} • {comm.staff_member}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Primary Occasion</label>
                <p className="text-lg">{customer.preferences.primary_occasion}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Preferred Brands</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {customer.preferences.preferred_brands.map((brand, index) => (
                    <Badge key={index} variant="outline">{brand}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Communication Preference</label>
                <p className="text-lg capitalize">{customer.preferences.communication_preference}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Special Notes</label>
                <p className="text-sm text-muted-foreground">{customer.preferences.size_notes}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}