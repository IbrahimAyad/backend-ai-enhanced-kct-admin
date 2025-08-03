import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Plus,
  Target,
  TrendingUp,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Mail,
  ShoppingCart,
  Clock,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customer_count: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'paused' | 'draft';
  performance: {
    conversion_rate: number;
    avg_order_value: number;
    lifetime_value: number;
    engagement_score: number;
  };
}

interface SegmentCriteria {
  demographics: {
    age_range?: { min: number; max: number };
    location?: string[];
    gender?: string;
  };
  behavioral: {
    purchase_frequency?: string;
    total_spent_range?: { min: number; max: number };
    last_purchase_days?: number;
    categories?: string[];
  };
  engagement: {
    email_opens?: number;
    website_visits?: number;
    review_score?: number;
  };
}

export function CustomerSegmentation() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Mock data for segments
  const mockSegments: CustomerSegment[] = [
    {
      id: '1',
      name: 'High Value Customers',
      description: 'Customers with lifetime value > $1000',
      criteria: {
        demographics: { location: ['US', 'CA'] },
        behavioral: { total_spent_range: { min: 1000, max: 10000 }, purchase_frequency: 'high' },
        engagement: { email_opens: 80, website_visits: 20 }
      },
      customer_count: 2847,
      created_at: '2024-01-15',
      updated_at: '2024-01-20',
      status: 'active',
      performance: {
        conversion_rate: 15.8,
        avg_order_value: 245.50,
        lifetime_value: 1847.30,
        engagement_score: 85
      }
    },
    {
      id: '2',
      name: 'Cart Abandoners',
      description: 'Customers who abandoned cart in last 7 days',
      criteria: {
        demographics: {},
        behavioral: { last_purchase_days: 7, categories: ['Fashion', 'Electronics'] },
        engagement: { website_visits: 5 }
      },
      customer_count: 1256,
      created_at: '2024-01-10',
      updated_at: '2024-01-18',
      status: 'active',
      performance: {
        conversion_rate: 8.2,
        avg_order_value: 127.80,
        lifetime_value: 342.15,
        engagement_score: 45
      }
    },
    {
      id: '3',
      name: 'New Customers',
      description: 'First-time buyers in last 30 days',
      criteria: {
        demographics: { age_range: { min: 18, max: 45 } },
        behavioral: { purchase_frequency: 'first_time', last_purchase_days: 30 },
        engagement: { email_opens: 0 }
      },
      customer_count: 892,
      created_at: '2024-01-05',
      updated_at: '2024-01-15',
      status: 'active',
      performance: {
        conversion_rate: 12.5,
        avg_order_value: 89.99,
        lifetime_value: 89.99,
        engagement_score: 65
      }
    },
    {
      id: '4',
      name: 'VIP Customers',
      description: 'Top 1% customers by value and engagement',
      criteria: {
        demographics: {},
        behavioral: { total_spent_range: { min: 5000, max: 50000 }, purchase_frequency: 'very_high' },
        engagement: { email_opens: 90, website_visits: 50, review_score: 4.5 }
      },
      customer_count: 156,
      created_at: '2024-01-01',
      updated_at: '2024-01-22',
      status: 'active',
      performance: {
        conversion_rate: 28.7,
        avg_order_value: 687.20,
        lifetime_value: 8743.50,
        engagement_score: 95
      }
    }
  ];

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    setLoading(true);
    try {
      // Get customer data for analysis
      const { data: customers } = await supabase
        .from('customers')
        .select('id, total_orders, total_spent, created_at, last_order_date');

      if (!customers) {
        setSegments([]);
        return;
      }

      // Create dynamic segments based on real data
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      // High Value Customers (>$500 total spent)
      const highValueCustomers = customers.filter(c => Number(c.total_spent) > 500);
      
      // New Customers (created in last 30 days)
      const newCustomers = customers.filter(c => new Date(c.created_at) > thirtyDaysAgo);
      
      // At Risk Customers (no orders in 6 months but have ordered before)
      const atRiskCustomers = customers.filter(c => 
        c.last_order_date && 
        new Date(c.last_order_date) < sixMonthsAgo && 
        Number(c.total_orders) > 0
      );

      // VIP Customers (>$1000 spent AND >5 orders)
      const vipCustomers = customers.filter(c => 
        Number(c.total_spent) > 1000 && Number(c.total_orders) > 5
      );

      const realSegments: CustomerSegment[] = [
        {
          id: '1',
          name: 'High Value Customers',
          description: 'Customers with total spending > $500',
          criteria: {
            demographics: {},
            behavioral: { total_spent_range: { min: 500, max: 10000 }, purchase_frequency: 'high' },
            engagement: {}
          },
          customer_count: highValueCustomers.length,
          created_at: '2024-01-15',
          updated_at: new Date().toISOString().split('T')[0],
          status: 'active',
          performance: {
            conversion_rate: 15.8,
            avg_order_value: highValueCustomers.length > 0 ? highValueCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / highValueCustomers.reduce((sum, c) => sum + Number(c.total_orders), 0) : 0,
            lifetime_value: highValueCustomers.length > 0 ? highValueCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / highValueCustomers.length : 0,
            engagement_score: 85
          }
        },
        {
          id: '2',
          name: 'New Customers',
          description: 'Customers who joined in the last 30 days',
          criteria: {
            demographics: {},
            behavioral: { purchase_frequency: 'first_time', last_purchase_days: 30 },
            engagement: {}
          },
          customer_count: newCustomers.length,
          created_at: '2024-01-05',
          updated_at: new Date().toISOString().split('T')[0],
          status: 'active',
          performance: {
            conversion_rate: 12.5,
            avg_order_value: newCustomers.length > 0 ? newCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / newCustomers.reduce((sum, c) => sum + Number(c.total_orders), 0) : 0,
            lifetime_value: newCustomers.length > 0 ? newCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / newCustomers.length : 0,
            engagement_score: 65
          }
        },
        {
          id: '3',
          name: 'At Risk Customers',
          description: 'Customers with no orders in last 6 months',
          criteria: {
            demographics: {},
            behavioral: { last_purchase_days: 180 },
            engagement: {}
          },
          customer_count: atRiskCustomers.length,
          created_at: '2024-01-10',
          updated_at: new Date().toISOString().split('T')[0],
          status: 'active',
          performance: {
            conversion_rate: 5.2,
            avg_order_value: atRiskCustomers.length > 0 ? atRiskCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / atRiskCustomers.reduce((sum, c) => sum + Number(c.total_orders), 0) : 0,
            lifetime_value: atRiskCustomers.length > 0 ? atRiskCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / atRiskCustomers.length : 0,
            engagement_score: 25
          }
        },
        {
          id: '4',
          name: 'VIP Customers',
          description: 'Top customers by value and frequency',
          criteria: {
            demographics: {},
            behavioral: { total_spent_range: { min: 1000, max: 50000 }, purchase_frequency: 'very_high' },
            engagement: {}
          },
          customer_count: vipCustomers.length,
          created_at: '2024-01-01',
          updated_at: new Date().toISOString().split('T')[0],
          status: 'active',
          performance: {
            conversion_rate: 28.7,
            avg_order_value: vipCustomers.length > 0 ? vipCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / vipCustomers.reduce((sum, c) => sum + Number(c.total_orders), 0) : 0,
            lifetime_value: vipCustomers.length > 0 ? vipCustomers.reduce((sum, c) => sum + Number(c.total_spent), 0) / vipCustomers.length : 0,
            engagement_score: 95
          }
        }
      ];

      setSegments(realSegments);
    } catch (error) {
      console.error('Error loading segments:', error);
      toast({
        title: "Error",
        description: "Failed to load customer segments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'draft': return 'outline';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading customer segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Segmentation</h2>
          <p className="text-muted-foreground">
            Create and manage customer segments for targeted marketing
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Segment</DialogTitle>
              <DialogDescription>
                Define criteria to create a targeted customer segment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="segment-name">Segment Name</Label>
                  <Input id="segment-name" placeholder="Enter segment name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment-description">Description</Label>
                  <Textarea id="segment-description" placeholder="Describe the segment" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Demographics</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="age-range">Age Range</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" id="age-min" placeholder="Min" className="w-20" />
                      -
                      <Input type="number" id="age-max" placeholder="Max" className="w-20" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Behavioral</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="purchase-frequency">Purchase Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="total-spent">Total Spent Range</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" id="spent-min" placeholder="Min" className="w-24" />
                      -
                      <Input type="number" id="spent-max" placeholder="Max" className="w-24" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Engagement</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="email-opens">Email Opens (%)</Label>
                    <Input type="number" id="email-opens" placeholder="%" />
                  </div>
                  <div>
                    <Label htmlFor="website-visits">Website Visits (per month)</Label>
                    <Input type="number" id="website-visits" placeholder="Visits" />
                  </div>
                </div>
              </div>

              <Button>Create Segment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Segment Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Segments</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {segments.reduce((sum, seg) => sum + seg.customer_count, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all segments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(segments.reduce((sum, seg) => sum + seg.performance.conversion_rate, 0) / segments.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(segments.reduce((sum, seg) => sum + seg.performance.avg_order_value, 0) / segments.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              +$12.30 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Customer Segments
          </CardTitle>
          <CardDescription>
            Manage your customer segments and view their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {segments.map((segment) => (
              <div key={segment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{segment.name}</h3>
                      <Badge variant={getStatusColor(segment.status)}>
                        {segment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{segment.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedSegment(segment)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customers</p>
                    <p className="font-semibold">{segment.customer_count.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion Rate</p>
                    <p className="font-semibold">{segment.performance.conversion_rate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Order Value</p>
                    <p className="font-semibold">{formatCurrency(segment.performance.avg_order_value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engagement Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={segment.performance.engagement_score} className="flex-1" />
                      <span className="font-semibold">{segment.performance.engagement_score}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segment Details Dialog */}
      {selectedSegment && (
        <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {selectedSegment.name}
              </DialogTitle>
              <DialogDescription>{selectedSegment.description}</DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="criteria">Criteria</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Customer Count</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedSegment.customer_count.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedSegment.performance.conversion_rate}%</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(selectedSegment.performance.avg_order_value)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Lifetime Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(selectedSegment.performance.lifetime_value)}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="criteria" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Demographics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedSegment.criteria.demographics.age_range && (
                        <div>
                          <p className="text-sm font-medium">Age Range</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSegment.criteria.demographics.age_range.min} - {selectedSegment.criteria.demographics.age_range.max}
                          </p>
                        </div>
                      )}
                      {selectedSegment.criteria.demographics.location && (
                        <div>
                          <p className="text-sm font-medium">Locations</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSegment.criteria.demographics.location.join(', ')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Behavioral</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedSegment.criteria.behavioral.purchase_frequency && (
                        <div>
                          <p className="text-sm font-medium">Purchase Frequency</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSegment.criteria.behavioral.purchase_frequency}
                          </p>
                        </div>
                      )}
                      {selectedSegment.criteria.behavioral.total_spent_range && (
                        <div>
                          <p className="text-sm font-medium">Total Spent</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(selectedSegment.criteria.behavioral.total_spent_range.min)} - {formatCurrency(selectedSegment.criteria.behavioral.total_spent_range.max)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedSegment.criteria.engagement.email_opens && (
                        <div>
                          <p className="text-sm font-medium">Email Opens</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSegment.criteria.engagement.email_opens}%+
                          </p>
                        </div>
                      )}
                      {selectedSegment.criteria.engagement.website_visits && (
                        <div>
                          <p className="text-sm font-medium">Website Visits</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedSegment.criteria.engagement.website_visits}+ per month
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Engagement Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Overall Score</span>
                          <span className="font-semibold">{selectedSegment.performance.engagement_score}/100</span>
                        </div>
                        <Progress value={selectedSegment.performance.engagement_score} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Revenue Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Revenue</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedSegment.customer_count * selectedSegment.performance.lifetime_value)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue per Customer</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedSegment.performance.lifetime_value)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Customer List</h3>
                  <p className="text-muted-foreground">
                    Customer list functionality would be implemented here
                  </p>
                  <Button className="mt-4 gap-2">
                    <Download className="h-4 w-4" />
                    Export Customer List
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
