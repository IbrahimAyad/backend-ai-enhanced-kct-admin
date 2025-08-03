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
import { Switch } from '@/components/ui/switch';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Clock,
  Mail,
  ArrowRight,
  Settings,
  Users,
  TrendingUp,
  Activity,
  Filter,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'draft';
  target_segment?: string;
  metrics: {
    enrolled: number;
    completed: number;
    active: number;
    conversion_rate: number;
    revenue: number;
  };
  created_at: string;
  updated_at: string;
}

interface WorkflowTrigger {
  type: 'signup' | 'purchase' | 'cart_abandonment' | 'birthday' | 'custom_event' | 'date_based';
  conditions?: {
    delay_hours?: number;
    event_name?: string;
    product_category?: string;
    minimum_cart_value?: number;
  };
}

interface WorkflowStep {
  id: string;
  type: 'email' | 'delay' | 'condition' | 'action';
  delay_hours?: number;
  email_template?: string;
  subject?: string;
  condition?: {
    type: 'opened' | 'clicked' | 'purchased' | 'custom';
    value?: string;
  };
  action?: {
    type: 'add_tag' | 'update_segment' | 'send_webhook';
    value?: string;
  };
}

export function EmailWorkflows() {
  const [workflows, setWorkflows] = useState<EmailWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<EmailWorkflow | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Mock data for workflows
  const mockWorkflows: EmailWorkflow[] = [
    {
      id: '1',
      name: 'Welcome Series',
      description: 'Onboard new customers with a 5-email sequence',
      trigger: {
        type: 'signup'
      },
      steps: [
        {
          id: '1',
          type: 'email',
          email_template: 'welcome_email_1',
          subject: 'Welcome to our family! 🎉'
        },
        {
          id: '2',
          type: 'delay',
          delay_hours: 24
        },
        {
          id: '3',
          type: 'email',
          email_template: 'welcome_email_2',
          subject: 'Here\'s 15% off your first order'
        },
        {
          id: '4',
          type: 'delay',
          delay_hours: 72
        },
        {
          id: '5',
          type: 'condition',
          condition: {
            type: 'purchased'
          }
        },
        {
          id: '6',
          type: 'email',
          email_template: 'welcome_email_3',
          subject: 'Still thinking? Here are our bestsellers'
        }
      ],
      status: 'active',
      target_segment: 'New Customers',
      metrics: {
        enrolled: 2847,
        completed: 1892,
        active: 356,
        conversion_rate: 24.5,
        revenue: 45680
      },
      created_at: '2024-01-01',
      updated_at: '2024-01-20'
    },
    {
      id: '2',
      name: 'Cart Recovery',
      description: 'Recover abandoned carts with 3-step email sequence',
      trigger: {
        type: 'cart_abandonment',
        conditions: {
          delay_hours: 1,
          minimum_cart_value: 50
        }
      },
      steps: [
        {
          id: '1',
          type: 'delay',
          delay_hours: 1
        },
        {
          id: '2',
          type: 'email',
          email_template: 'cart_recovery_1',
          subject: 'You forgot something in your cart'
        },
        {
          id: '3',
          type: 'delay',
          delay_hours: 24
        },
        {
          id: '4',
          type: 'email',
          email_template: 'cart_recovery_2',
          subject: 'Still interested? Here\'s 10% off'
        },
        {
          id: '5',
          type: 'delay',
          delay_hours: 48
        },
        {
          id: '6',
          type: 'email',
          email_template: 'cart_recovery_3',
          subject: 'Last chance - 15% off expires soon'
        }
      ],
      status: 'active',
      metrics: {
        enrolled: 1256,
        completed: 892,
        active: 123,
        conversion_rate: 18.7,
        revenue: 23450
      },
      created_at: '2024-01-05',
      updated_at: '2024-01-18'
    },
    {
      id: '3',
      name: 'Post-Purchase Follow-up',
      description: 'Thank customers and encourage reviews after purchase',
      trigger: {
        type: 'purchase'
      },
      steps: [
        {
          id: '1',
          type: 'delay',
          delay_hours: 2
        },
        {
          id: '2',
          type: 'email',
          email_template: 'thank_you',
          subject: 'Thank you for your order!'
        },
        {
          id: '3',
          type: 'delay',
          delay_hours: 168 // 7 days
        },
        {
          id: '4',
          type: 'email',
          email_template: 'review_request',
          subject: 'How was your experience?'
        },
        {
          id: '5',
          type: 'delay',
          delay_hours: 720 // 30 days
        },
        {
          id: '6',
          type: 'email',
          email_template: 'related_products',
          subject: 'You might also like these products'
        }
      ],
      status: 'active',
      metrics: {
        enrolled: 892,
        completed: 734,
        active: 89,
        conversion_rate: 32.1,
        revenue: 12890
      },
      created_at: '2024-01-08',
      updated_at: '2024-01-22'
    },
    {
      id: '4',
      name: 'Birthday Campaign',
      description: 'Send birthday wishes with special discount',
      trigger: {
        type: 'birthday'
      },
      steps: [
        {
          id: '1',
          type: 'email',
          email_template: 'birthday_email',
          subject: 'Happy Birthday! Here\'s a special gift 🎂'
        },
        {
          id: '2',
          type: 'delay',
          delay_hours: 168 // 7 days
        },
        {
          id: '3',
          type: 'condition',
          condition: {
            type: 'clicked'
          }
        },
        {
          id: '4',
          type: 'email',
          email_template: 'birthday_reminder',
          subject: 'Your birthday discount expires soon!'
        }
      ],
      status: 'paused',
      metrics: {
        enrolled: 456,
        completed: 234,
        active: 12,
        conversion_rate: 41.2,
        revenue: 8760
      },
      created_at: '2024-01-10',
      updated_at: '2024-01-15'
    }
  ];

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error",
        description: "Failed to load email workflows",
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

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'signup': return Users;
      case 'purchase': return TrendingUp;
      case 'cart_abandonment': return Activity;
      case 'birthday': return Calendar;
      case 'custom_event': return Zap;
      case 'date_based': return Clock;
      default: return Activity;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'delay': return Clock;
      case 'condition': return Filter;
      case 'action': return Settings;
      default: return Mail;
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

  const formatDelay = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else if (hours < 168) {
      return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) === 1 ? '' : 's'}`;
    } else {
      return `${Math.floor(hours / 168)} week${Math.floor(hours / 168) === 1 ? '' : 's'}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Workflow className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading email workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Workflows</h2>
          <p className="text-muted-foreground">
            Create automated email sequences to engage customers at key moments
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Set up an automated email sequence for your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name</Label>
                  <Input id="name" placeholder="Enter workflow name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger">Trigger Event</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">Signup</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="cart_abandonment">Cart Abandonment</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="custom_event">Custom Event</SelectItem>
                      <SelectItem value="date_based">Date Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe your workflow" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Target Segment (Optional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="new_customers">New Customers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="active" defaultChecked />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <Button onClick={() => setShowCreateDialog(false)}>Create Workflow</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflow Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.metrics.enrolled, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all workflows
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
              {(workflows.reduce((sum, w) => sum + w.metrics.conversion_rate, 0) / workflows.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +3.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(workflows.reduce((sum, w) => sum + w.metrics.revenue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.4% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Email Workflows
          </CardTitle>
          <CardDescription>
            Manage your automated email workflows and monitor their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => {
              const TriggerIcon = getTriggerIcon(workflow.trigger.type);
              
              return (
                <div key={workflow.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TriggerIcon className="h-4 w-4" />
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <Badge variant={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Trigger: {workflow.trigger.type.replace('_', ' ')} • {workflow.steps.length} steps
                        {workflow.target_segment && ` • Target: ${workflow.target_segment}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(workflow)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {workflow.status === 'active' ? (
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
                      <p className="text-muted-foreground">Enrolled</p>
                      <p className="font-semibold">{workflow.metrics.enrolled.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active</p>
                      <p className="font-semibold">{workflow.metrics.active.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-semibold">{workflow.metrics.completed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conversion</p>
                      <p className="font-semibold">{workflow.metrics.conversion_rate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">{formatCurrency(workflow.metrics.revenue)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Details Dialog */}
      {selectedWorkflow && (
        <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                {selectedWorkflow.name}
              </DialogTitle>
              <DialogDescription>{selectedWorkflow.description}</DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="flow">Flow</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Enrolled</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedWorkflow.metrics.enrolled.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Currently Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedWorkflow.metrics.active.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedWorkflow.metrics.conversion_rate}%</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(selectedWorkflow.metrics.revenue)}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="flow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Workflow Steps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedWorkflow.steps.map((step, index) => {
                        const StepIcon = getStepIcon(step.type);
                        
                        return (
                          <div key={step.id} className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <StepIcon className="h-4 w-4 text-primary" />
                            </div>
                            
                            <div className="flex-1">
                              {step.type === 'email' && (
                                <div>
                                  <p className="font-medium">Send Email</p>
                                  <p className="text-sm text-muted-foreground">{step.subject}</p>
                                  <p className="text-xs text-muted-foreground">Template: {step.email_template}</p>
                                </div>
                              )}
                              
                              {step.type === 'delay' && (
                                <div>
                                  <p className="font-medium">Wait</p>
                                  <p className="text-sm text-muted-foreground">
                                    {step.delay_hours ? formatDelay(step.delay_hours) : 'Unknown delay'}
                                  </p>
                                </div>
                              )}
                              
                              {step.type === 'condition' && (
                                <div>
                                  <p className="font-medium">Check Condition</p>
                                  <p className="text-sm text-muted-foreground">
                                    If customer {step.condition?.type}: continue, else skip
                                  </p>
                                </div>
                              )}
                              
                              {step.type === 'action' && (
                                <div>
                                  <p className="font-medium">Perform Action</p>
                                  <p className="text-sm text-muted-foreground">
                                    {step.action?.type}: {step.action?.value}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {index < selectedWorkflow.steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Completion Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Completion Rate</span>
                        <span className="font-semibold">
                          {((selectedWorkflow.metrics.completed / selectedWorkflow.metrics.enrolled) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Active Users</span>
                        <span className="font-semibold">{selectedWorkflow.metrics.active.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Drop-off Rate</span>
                        <span className="font-semibold">
                          {(((selectedWorkflow.metrics.enrolled - selectedWorkflow.metrics.completed - selectedWorkflow.metrics.active) / selectedWorkflow.metrics.enrolled) * 100).toFixed(1)}%
                        </span>
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
                        <span className="font-semibold">{formatCurrency(selectedWorkflow.metrics.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Revenue per User</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedWorkflow.metrics.revenue / selectedWorkflow.metrics.enrolled)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Conversion Value</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedWorkflow.metrics.revenue / (selectedWorkflow.metrics.enrolled * selectedWorkflow.metrics.conversion_rate / 100))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Workflow Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Trigger</Label>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {selectedWorkflow.trigger.type.replace('_', ' ')}
                      </p>
                      {selectedWorkflow.trigger.conditions && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {selectedWorkflow.trigger.conditions.delay_hours && (
                            <p>Delay: {formatDelay(selectedWorkflow.trigger.conditions.delay_hours)}</p>
                          )}
                          {selectedWorkflow.trigger.conditions.minimum_cart_value && (
                            <p>Min cart value: {formatCurrency(selectedWorkflow.trigger.conditions.minimum_cart_value)}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {selectedWorkflow.target_segment && (
                      <div>
                        <Label className="text-sm font-medium">Target Segment</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedWorkflow.target_segment}</p>
                      </div>
                    )}
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedWorkflow.created_at)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedWorkflow.updated_at)}</p>
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
