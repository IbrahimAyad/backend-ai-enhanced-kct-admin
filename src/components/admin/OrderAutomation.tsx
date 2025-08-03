import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings, Play, Pause, Zap, Clock, CheckCircle, AlertCircle } from "lucide-react";

export function OrderAutomation() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: "VIP Customer Priority",
      description: "Automatically prioritize orders from VIP customers",
      trigger: "Order Created",
      condition: "Customer Segment = VIP",
      action: "Set Priority = High",
      status: "active",
      lastRun: "2024-01-15 14:30",
      executions: 45
    },
    {
      id: 2,
      name: "Large Order Approval",
      description: "Require approval for orders over $1,000",
      trigger: "Order Created",
      condition: "Order Total > $1,000",
      action: "Set Status = Pending Approval",
      status: "active",
      lastRun: "2024-01-15 12:15",
      executions: 12
    },
    {
      id: 3,
      name: "Auto-Cancel Abandoned",
      description: "Cancel orders not paid within 24 hours",
      trigger: "Time-based",
      condition: "Status = Pending Payment AND Created > 24h ago",
      action: "Cancel Order + Send Email",
      status: "active",
      lastRun: "2024-01-15 09:00",
      executions: 28
    },
    {
      id: 4,
      name: "International Shipping Hold",
      description: "Hold international orders for manual review",
      trigger: "Order Created",
      condition: "Shipping Country ≠ US",
      action: "Set Status = On Hold",
      status: "paused",
      lastRun: "2024-01-14 16:45",
      executions: 156
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const triggers = [
    "Order Created",
    "Payment Received", 
    "Order Shipped",
    "Order Delivered",
    "Order Cancelled",
    "Time-based",
    "Inventory Low",
    "Customer Action"
  ];

  const conditions = [
    "Order Total",
    "Customer Segment",
    "Product Category",
    "Shipping Method",
    "Payment Method",
    "Geographic Location",
    "Order Items Count",
    "Customer Order History"
  ];

  const actions = [
    "Set Priority",
    "Set Status",
    "Send Email",
    "Send SMS",
    "Create Task",
    "Update Inventory",
    "Apply Discount",
    "Generate Report",
    "Webhook Call",
    "Slack Notification"
  ];

  const toggleRuleStatus = (ruleId: number) => {
    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, status: rule.status === "active" ? "paused" : "active" }
        : rule
    ));
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const getStatusIcon = (status: string) => {
    return status === "active" ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Order Automation</h2>
          <p className="text-muted-foreground">Automate order processing with custom rules and workflows</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input id="rule-name" placeholder="Enter rule name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-status">Status</Label>
                  <Select defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea id="rule-description" placeholder="Describe what this rule does" />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Rule Configuration</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggers.map(trigger => (
                          <SelectItem key={trigger} value={trigger.toLowerCase().replace(/\s+/g, '_')}>
                            {trigger}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <div className="flex space-x-2">
                      <Select>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {conditions.map(condition => (
                            <SelectItem key={condition} value={condition.toLowerCase().replace(/\s+/g, '_')}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Op" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">=</SelectItem>
                          <SelectItem value="not_equals">≠</SelectItem>
                          <SelectItem value="greater_than">&gt;</SelectItem>
                          <SelectItem value="less_than">&lt;</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Value" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Action</Label>
                    <div className="flex space-x-2">
                      <Select>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {actions.map(action => (
                            <SelectItem key={action} value={action.toLowerCase().replace(/\s+/g, '_')}>
                              {action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Value" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.filter(r => r.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">
              {rules.filter(r => r.status === "paused").length} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              4 failures today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5h</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">{rule.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.trigger}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{rule.condition}</TableCell>
                  <TableCell className="text-sm">{rule.action}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(rule.status)}
                      <Badge variant={getStatusColor(rule.status)}>
                        {rule.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{rule.lastRun}</TableCell>
                  <TableCell className="font-medium">{rule.executions}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={rule.status === "active"}
                        onCheckedChange={() => toggleRuleStatus(rule.id)}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">VIP Customer Priority executed</p>
                  <p className="text-xs text-muted-foreground">Order #12345 priority set to High</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Auto-Cancel Abandoned executed</p>
                  <p className="text-xs text-muted-foreground">Order #12340 cancelled and email sent</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Large Order Approval triggered</p>
                  <p className="text-xs text-muted-foreground">Order #12344 ($1,250) pending approval</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">International Shipping Hold executed</p>
                  <p className="text-xs text-muted-foreground">Order #12341 placed on hold for review</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Orders processed automatically</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average processing time saved</span>
                <span className="font-medium">4.5 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Manual interventions today</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error rate</span>
                <span className="font-medium text-green-600">1.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cost savings (monthly)</span>
                <span className="font-medium text-green-600">$2,400</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}