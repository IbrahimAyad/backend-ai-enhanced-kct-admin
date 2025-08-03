import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Mail, 
  ShoppingCart, 
  Bell, 
  DollarSign, 
  Users, 
  Package,
  Clock,
  Play,
  Pause,
  Settings,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Target,
  Calendar,
  Filter
} from 'lucide-react';

export function AutomationWorkflows() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const workflows = [
    {
      id: 'welcome-series',
      name: 'Welcome Email Series',
      type: 'Customer Journey',
      status: 'active',
      trigger: 'User registration',
      actions: 4,
      runs: 2840,
      conversionRate: 18.4,
      revenue: 42500,
      description: 'Multi-step welcome sequence for new customers',
      enabled: true
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart Recovery',
      type: 'Sales Automation',
      status: 'active',
      trigger: 'Cart abandoned > 1 hour',
      actions: 3,
      runs: 1580,
      conversionRate: 28.7,
      revenue: 18900,
      description: 'Recover lost sales with targeted email sequence',
      enabled: true
    },
    {
      id: 'low-inventory',
      name: 'Low Inventory Alerts',
      type: 'Inventory Management',
      status: 'active',
      trigger: 'Stock < 10 units',
      actions: 2,
      runs: 45,
      conversionRate: 0,
      revenue: 0,
      description: 'Notify team when products are running low',
      enabled: true
    },
    {
      id: 'win-back',
      name: 'Win-back Campaign',
      type: 'Customer Retention',
      status: 'paused',
      trigger: 'No purchase in 90 days',
      actions: 5,
      runs: 890,
      conversionRate: 12.3,
      revenue: 8400,
      description: 'Re-engage dormant customers with special offers',
      enabled: false
    },
    {
      id: 'upsell-sequence',
      name: 'Post-Purchase Upsell',
      type: 'Sales Automation',
      status: 'active',
      trigger: 'Order completed',
      actions: 3,
      runs: 1240,
      conversionRate: 15.8,
      revenue: 22800,
      description: 'Suggest complementary products after purchase',
      enabled: true
    },
    {
      id: 'price-drop',
      name: 'Dynamic Pricing Rules',
      type: 'Pricing Automation',
      status: 'active',
      trigger: 'Competitor price change',
      actions: 2,
      runs: 156,
      conversionRate: 0,
      revenue: 0,
      description: 'Automatically adjust prices based on market conditions',
      enabled: true
    }
  ];

  const automationStats = {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(w => w.status === 'active').length,
    totalRuns: workflows.reduce((sum, w) => sum + w.runs, 0),
    totalRevenue: workflows.reduce((sum, w) => sum + w.revenue, 0)
  };

  const workflowTemplates = [
    {
      name: 'Birthday Campaign',
      category: 'Customer Journey',
      description: 'Send personalized birthday offers to customers',
      triggers: ['Customer birthday'],
      actions: ['Send email', 'Apply discount', 'Track engagement']
    },
    {
      name: 'VIP Customer Journey',
      category: 'Customer Segmentation',
      description: 'Special treatment for high-value customers',
      triggers: ['Lifetime value > $1000'],
      actions: ['Add to VIP segment', 'Assign account manager', 'Send welcome package']
    },
    {
      name: 'Restock Notification',
      category: 'Inventory Management',
      description: 'Notify customers when out-of-stock items return',
      triggers: ['Product back in stock'],
      actions: ['Send notification', 'Apply early access', 'Track clicks']
    }
  ];

  const customerJourneys = [
    {
      stage: 'New Customer',
      duration: '0-7 days',
      actions: [
        { day: 0, action: 'Welcome email', status: 'completed', engagement: 85 },
        { day: 1, action: 'Product education', status: 'completed', engagement: 72 },
        { day: 3, action: 'First purchase incentive', status: 'in-progress', engagement: 45 },
        { day: 7, action: 'Feedback request', status: 'pending', engagement: 0 }
      ]
    },
    {
      stage: 'Active Customer',
      duration: '8-90 days',
      actions: [
        { day: 14, action: 'Product recommendations', status: 'completed', engagement: 68 },
        { day: 30, action: 'Loyalty program invite', status: 'completed', engagement: 54 },
        { day: 60, action: 'Review request', status: 'in-progress', engagement: 38 },
        { day: 90, action: 'Retention offer', status: 'pending', engagement: 0 }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{automationStats.totalWorkflows}</p>
                <p className="text-xs text-green-600 mt-1">{automationStats.activeWorkflows} active</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{automationStats.totalRuns.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12% this month</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
                <p className="text-2xl font-bold">${automationStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">ROI: 340%</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">18.9%</p>
                <p className="text-xs text-green-600 mt-1">+2.4% improvement</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
            <TabsTrigger value="journeys">Customer Journeys</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </div>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={workflow.enabled} 
                          onCheckedChange={() => {}}
                        />
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={workflow.status === 'active' ? 'default' : 'secondary'}
                          className={workflow.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {workflow.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <Badge variant="outline">{workflow.type}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Executions</p>
                        <p className="font-semibold">{workflow.runs.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Conversion</p>
                        <p className="font-semibold">{workflow.conversionRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="font-semibold">${workflow.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Trigger: {workflow.trigger}
                      </span>
                      <span>•</span>
                      <span>{workflow.actions} actions</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Journey Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {customerJourneys.map((journey, index) => (
                  <div key={journey.stage} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{journey.stage}</h3>
                        <p className="text-sm text-muted-foreground">{journey.duration}</p>
                      </div>
                    </div>
                    
                    <div className="ml-12 space-y-3">
                      {journey.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {action.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {action.status === 'in-progress' && <Clock className="h-4 w-4 text-orange-500" />}
                              {action.status === 'pending' && <AlertTriangle className="h-4 w-4 text-gray-400" />}
                              <span className="text-sm">Day {action.day}</span>
                            </div>
                            <span className="font-medium">{action.action}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-semibold">{action.engagement}%</p>
                              <p className="text-xs text-muted-foreground">engagement</p>
                            </div>
                            <Badge 
                              variant={
                                action.status === 'completed' ? 'default' : 
                                action.status === 'in-progress' ? 'secondary' : 'outline'
                              }
                            >
                              {action.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Workflow Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workflowTemplates.map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Triggers:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.triggers.map((trigger, triggerIndex) => (
                            <Badge key={triggerIndex} variant="secondary" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Actions:</p>
                        <div className="space-y-1">
                          {template.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button className="w-full" variant="outline">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Workflow Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.slice(0, 5).map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{workflow.name}</p>
                        <p className="text-sm text-muted-foreground">{workflow.runs} executions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{workflow.conversionRate}%</p>
                        <p className="text-sm text-muted-foreground">${workflow.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: '2 min ago', action: 'Welcome email sent', workflow: 'Welcome Series', count: 3 },
                    { time: '5 min ago', action: 'Inventory alert triggered', workflow: 'Low Stock Alert', count: 1 },
                    { time: '12 min ago', action: 'Cart recovery email sent', workflow: 'Abandoned Cart', count: 7 },
                    { time: '18 min ago', action: 'Upsell sequence started', workflow: 'Post-Purchase', count: 2 },
                    { time: '25 min ago', action: 'Price rule activated', workflow: 'Dynamic Pricing', count: 1 }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.workflow}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{activity.count}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}