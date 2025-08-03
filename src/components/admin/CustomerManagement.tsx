import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Crown, 
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  Eye,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CustomerImport } from './CustomerImport';

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  lifetime_value: number;
  customer_segment: string;
  account_status: 'active' | 'inactive' | 'suspended';
  acquisition_source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_order_date?: string;
  last_login_date?: string;
}

export function CustomerManagement() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive"
        });
        return;
      }

      setCustomers(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "Info",
          description: "No customers found. Add some customers to get started.",
        });
      }

    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...customerData,
          total_orders: 0,
          total_spent: 0,
          average_order_value: 0,
          lifetime_value: 0,
          customer_segment: 'regular',
          account_status: 'active'
        }])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [data, ...prev]);
      setShowCreateDialog(false);
      
      toast({
        title: "Success",
        description: "Customer created successfully"
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      });
    }
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId);

      if (error) throw error;

      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, ...updates }
          : customer
      ));

      toast({
        title: "Success",
        description: "Customer updated successfully"
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.account_status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || customer.customer_segment === segmentFilter;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.account_status === 'active').length,
    newThisMonth: customers.filter(c => {
      const createdAt = new Date(c.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length,
    avgLifetimeValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / customers.length 
      : 0
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
      day: 'numeric'
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${(firstName || 'U').charAt(0)}${(lastName || 'U').charAt(0)}`.toUpperCase();
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-yellow-100 text-yellow-800';
      case 'regular': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h2 className="text-2xl font-bold">Customer Management</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
          
          <CustomerImport onImportComplete={(result) => {
            toast({
              title: "Import completed",
              description: `Imported ${result.success} customers with ${result.errors} errors`,
            });
            loadCustomers();
          }} />
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customerStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">{customerStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold">{customerStats.newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Lifetime Value</p>
                <p className="text-2xl font-bold">{formatCurrency(customerStats.avgLifetimeValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {getInitials(customer.first_name, customer.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <Badge className={getSegmentColor(customer.customer_segment)}>
                        {customer.customer_segment}
                      </Badge>
                      <Badge className={getStatusColor(customer.account_status)}>
                        {customer.account_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    {customer.city && customer.country && (
                      <p className="text-xs text-muted-foreground">
                        {customer.city}, {customer.country}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Orders</p>
                    <p className="font-medium">{customer.total_orders}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Spent</p>
                    <p className="font-medium">{formatCurrency(customer.total_spent)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">LTV</p>
                    <p className="font-medium">{formatCurrency(customer.lifetime_value)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(customer.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
                <p className="text-sm">Add customers or adjust your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedCustomer.first_name, selectedCustomer.last_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </h3>
                    <Badge className={getSegmentColor(selectedCustomer.customer_segment)}>
                      {selectedCustomer.customer_segment}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {selectedCustomer.email}
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedCustomer.phone}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select 
                    value={selectedCustomer.account_status} 
                    onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                      updateCustomer(selectedCustomer.id, { account_status: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{selectedCustomer.total_orders}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.total_spent)}</p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Crown className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.average_order_value)}</p>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{formatDate(selectedCustomer.created_at)}</p>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createCustomer({
              email: formData.get('email') as string,
              first_name: formData.get('first_name') as string,
              last_name: formData.get('last_name') as string,
              phone: formData.get('phone') as string,
              city: formData.get('city') as string,
              country: formData.get('country') as string,
            });
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input name="first_name" required />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input name="last_name" required />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input name="email" type="email" required />
            </div>
            
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" type="tel" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input name="city" />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input name="country" defaultValue="US" />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Customer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}