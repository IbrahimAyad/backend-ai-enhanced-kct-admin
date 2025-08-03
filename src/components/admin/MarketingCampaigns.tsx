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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  MailIcon,
  Plus,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Copy,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  target_segment: string;
  start_date: string;
  end_date?: string;
  budget: number;
  spent: number;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
  content: {
    subject?: string;
    template: string;
    cta_text?: string;
    cta_url?: string;
  };
  created_at: string;
  updated_at: string;
}

export function MarketingCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'email' as const,
    target_segment: '',
    start_date: new Date(),
    budget: 0,
    content: {
      subject: '',
      template: '',
      cta_text: '',
      cta_url: ''
    }
  });
  const { toast } = useToast();

  // Mock data for campaigns
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Holiday Sale 2024',
      description: 'Black Friday and Cyber Monday promotional campaign',
      type: 'email',
      status: 'active',
      target_segment: 'High Value Customers',
      start_date: '2024-01-20',
      end_date: '2024-01-30',
      budget: 5000,
      spent: 3200,
      metrics: {
        sent: 15420,
        delivered: 14980,
        opened: 7490,
        clicked: 1498,
        converted: 224,
        revenue: 67200
      },
      content: {
        subject: '🔥 Exclusive 50% Off - Limited Time!',
        template: 'holiday_sale_template',
        cta_text: 'Shop Now',
        cta_url: 'https://store.com/holiday-sale'
      },
      created_at: '2024-01-15',
      updated_at: '2024-01-22'
    },
    {
      id: '2',
      name: 'Cart Recovery Campaign',
      description: 'Automated email sequence for cart abandoners',
      type: 'email',
      status: 'active',
      target_segment: 'Cart Abandoners',
      start_date: '2024-01-10',
      budget: 2000,
      spent: 1250,
      metrics: {
        sent: 8950,
        delivered: 8700,
        opened: 3480,
        clicked: 696,
        converted: 156,
        revenue: 19890
      },
      content: {
        subject: 'Complete your purchase - 10% off waiting!',
        template: 'cart_recovery_template',
        cta_text: 'Complete Purchase',
        cta_url: 'https://store.com/cart'
      },
      created_at: '2024-01-08',
      updated_at: '2024-01-20'
    },
    {
      id: '3',
      name: 'Welcome Series',
      description: 'Onboarding sequence for new customers',
      type: 'email',
      status: 'active',
      target_segment: 'New Customers',
      start_date: '2024-01-05',
      budget: 1500,
      spent: 890,
      metrics: {
        sent: 2680,
        delivered: 2610,
        opened: 1566,
        clicked: 392,
        converted: 98,
        revenue: 8820
      },
      content: {
        subject: 'Welcome to our family! Here\'s 15% off',
        template: 'welcome_series_template',
        cta_text: 'Start Shopping',
        cta_url: 'https://store.com/welcome'
      },
      created_at: '2024-01-01',
      updated_at: '2024-01-18'
    },
    {
      id: '4',
      name: 'VIP Exclusive Launch',
      description: 'Product launch campaign for VIP customers',
      type: 'email',
      status: 'scheduled',
      target_segment: 'VIP Customers',
      start_date: '2024-01-25',
      end_date: '2024-02-05',
      budget: 3000,
      spent: 0,
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0
      },
      content: {
        subject: 'VIP Early Access: New Collection Launch',
        template: 'vip_launch_template',
        cta_text: 'Shop Early Access',
        cta_url: 'https://store.com/vip-launch'
      },
      created_at: '2024-01-20',
      updated_at: '2024-01-22'
    }
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load marketing campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'scheduled': return 'secondary';
      case 'paused': return 'outline';
      case 'completed': return 'secondary';
      case 'draft': return 'outline';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return MailIcon;
      case 'sms': return Send;
      case 'push': return Send;
      case 'social': return Send;
      default: return MailIcon;
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

  const calculateROI = (campaign: Campaign) => {
    if (campaign.spent === 0) return 0;
    return ((campaign.metrics.revenue - campaign.spent) / campaign.spent) * 100;
  };

  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.metrics.delivered === 0) return 0;
    return (campaign.metrics.opened / campaign.metrics.delivered) * 100;
  };

  const calculateClickRate = (campaign: Campaign) => {
    if (campaign.metrics.opened === 0) return 0;
    return (campaign.metrics.clicked / campaign.metrics.opened) * 100;
  };

  const calculateConversionRate = (campaign: Campaign) => {
    if (campaign.metrics.clicked === 0) return 0;
    return (campaign.metrics.converted / campaign.metrics.clicked) * 100;
  };

  const handleCreateCampaign = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      
      setShowCreateDialog(false);
      setNewCampaign({
        name: '',
        description: '',
        type: 'email',
        target_segment: '',
        start_date: new Date(),
        budget: 0,
        content: {
          subject: '',
          template: '',
          cta_text: '',
          cta_url: ''
        }
      });
      
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MailIcon className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading marketing campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage your marketing campaigns across all channels
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new marketing campaign to engage your customers
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select value={newCampaign.type} onValueChange={(value: any) => setNewCampaign(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your campaign"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="segment">Target Segment</Label>
                  <Select value={newCampaign.target_segment} onValueChange={(value) => setNewCampaign(prev => ({ ...prev, target_segment: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_value">High Value Customers</SelectItem>
                      <SelectItem value="cart_abandoners">Cart Abandoners</SelectItem>
                      <SelectItem value="new_customers">New Customers</SelectItem>
                      <SelectItem value="vip">VIP Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newCampaign.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCampaign.start_date ? format(newCampaign.start_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newCampaign.start_date}
                      onSelect={(date) => date && setNewCampaign(prev => ({ ...prev, start_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {newCampaign.type === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={newCampaign.content.subject}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        content: { ...prev.content, subject: e.target.value }
                      }))}
                      placeholder="Enter email subject"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cta-text">CTA Text</Label>
                      <Input
                        id="cta-text"
                        value={newCampaign.content.cta_text}
                        onChange={(e) => setNewCampaign(prev => ({
                          ...prev,
                          content: { ...prev.content, cta_text: e.target.value }
                        }))}
                        placeholder="Shop Now"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cta-url">CTA URL</Label>
                      <Input
                        id="cta-url"
                        value={newCampaign.content.cta_url}
                        onChange={(e) => setNewCampaign(prev => ({
                          ...prev,
                          content: { ...prev.content, cta_url: e.target.value }
                        }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +15.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(campaigns.reduce((sum, c) => sum + calculateOpenRate(c), 0) / campaigns.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(campaigns.reduce((sum, c) => sum + calculateROI(c), 0) / campaigns.length).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +8.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailIcon className="h-5 w-5" />
            Marketing Campaigns
          </CardTitle>
          <CardDescription>
            Manage your marketing campaigns and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const TypeIcon = getTypeIcon(campaign.type);
              
              return (
                <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {campaign.target_segment} • Started: {formatDate(campaign.start_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCampaign(campaign)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      {campaign.status === 'active' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-semibold">{campaign.metrics.sent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Open Rate</p>
                      <p className="font-semibold">{calculateOpenRate(campaign).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Click Rate</p>
                      <p className="font-semibold">{calculateClickRate(campaign).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">{formatCurrency(campaign.metrics.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ROI</p>
                      <p className="font-semibold text-green-600">{calculateROI(campaign).toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget Progress</span>
                      <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</span>
                    </div>
                    <Progress value={(campaign.spent / campaign.budget) * 100} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details Dialog */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MailIcon className="h-5 w-5" />
                {selectedCampaign.name}
              </DialogTitle>
              <DialogDescription>{selectedCampaign.description}</DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCampaign.metrics.sent.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Open Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{calculateOpenRate(selectedCampaign).toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(selectedCampaign.metrics.revenue)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{calculateROI(selectedCampaign).toFixed(0)}%</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Engagement Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Delivery Rate</span>
                          <span>{((selectedCampaign.metrics.delivered / selectedCampaign.metrics.sent) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(selectedCampaign.metrics.delivered / selectedCampaign.metrics.sent) * 100} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Open Rate</span>
                          <span>{calculateOpenRate(selectedCampaign).toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateOpenRate(selectedCampaign)} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Click Rate</span>
                          <span>{calculateClickRate(selectedCampaign).toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateClickRate(selectedCampaign)} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Conversion Rate</span>
                          <span>{calculateConversionRate(selectedCampaign).toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateConversionRate(selectedCampaign)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Revenue Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Revenue</span>
                        <span className="font-semibold">{formatCurrency(selectedCampaign.metrics.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Spent</span>
                        <span className="font-semibold">{formatCurrency(selectedCampaign.spent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Net Profit</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(selectedCampaign.metrics.revenue - selectedCampaign.spent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ROI</span>
                        <span className="font-semibold text-green-600">{calculateROI(selectedCampaign).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue per Email</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedCampaign.metrics.revenue / selectedCampaign.metrics.sent)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Campaign Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedCampaign.content.subject && (
                      <div>
                        <Label className="text-sm font-medium">Subject Line</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.content.subject}</p>
                      </div>
                    )}
                    
                    <div>
                      <Label className="text-sm font-medium">Template</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.content.template}</p>
                    </div>
                    
                    {selectedCampaign.content.cta_text && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium">CTA Text</Label>
                          <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.content.cta_text}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">CTA URL</Label>
                          <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.content.cta_url}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Campaign Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Target Segment</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.target_segment}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Campaign Type</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{selectedCampaign.type}</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Start Date</Label>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedCampaign.start_date)}</p>
                      </div>
                      {selectedCampaign.end_date && (
                        <div>
                          <Label className="text-sm font-medium">End Date</Label>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedCampaign.end_date)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Budget</Label>
                        <p className="text-sm text-muted-foreground mt-1">{formatCurrency(selectedCampaign.budget)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Spent</Label>
                        <p className="text-sm text-muted-foreground mt-1">{formatCurrency(selectedCampaign.spent)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}