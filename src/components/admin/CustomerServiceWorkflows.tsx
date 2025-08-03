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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Clock, Users, CheckCircle, AlertTriangle, Phone, Mail } from "lucide-react";

export function CustomerServiceWorkflows() {
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: "Refund Request Process",
      description: "Automated workflow for processing refund requests",
      trigger: "Ticket Created",
      category: "refund",
      status: "active",
      steps: 4,
      avgResolutionTime: "2.5 hours",
      completionRate: 92,
      ticketsProcessed: 156
    },
    {
      id: 2,
      name: "VIP Customer Escalation",
      description: "Priority handling for VIP customer issues",
      trigger: "VIP Customer",
      category: "escalation",
      status: "active",
      steps: 3,
      avgResolutionTime: "45 minutes",
      completionRate: 98,
      ticketsProcessed: 23
    },
    {
      id: 3,
      name: "Product Complaint Resolution",
      description: "Standardized process for product quality complaints",
      trigger: "Complaint Keywords",
      category: "complaint",
      status: "active",
      steps: 5,
      avgResolutionTime: "4.2 hours",
      completionRate: 87,
      ticketsProcessed: 89
    },
    {
      id: 4,
      name: "Order Issue Follow-up",
      description: "Automated follow-up for shipping and delivery issues",
      trigger: "Order Problem",
      category: "shipping",
      status: "paused",
      steps: 3,
      avgResolutionTime: "1.8 hours",
      completionRate: 94,
      ticketsProcessed: 234
    }
  ]);

  const tickets = [
    {
      id: "T-001",
      customer: "Sarah Johnson",
      subject: "Refund for damaged item",
      status: "In Progress",
      priority: "Medium",
      workflow: "Refund Request Process",
      assignee: "Mike Chen",
      created: "2024-01-15 14:30",
      lastUpdate: "2024-01-15 15:45"
    },
    {
      id: "T-002",
      customer: "David Wilson",
      subject: "VIP - Order delivery delay",
      status: "Escalated",
      priority: "High",
      workflow: "VIP Customer Escalation",
      assignee: "Lisa Brown",
      created: "2024-01-15 13:15",
      lastUpdate: "2024-01-15 14:20"
    },
    {
      id: "T-003",
      customer: "Emily Davis",
      subject: "Product quality issue",
      status: "Pending Review",
      priority: "Low",
      workflow: "Product Complaint Resolution",
      assignee: "Tom Anderson",
      created: "2024-01-15 12:00",
      lastUpdate: "2024-01-15 12:30"
    }
  ];

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "In Progress": return "default";
      case "Escalated": return "destructive";
      case "Pending Review": return "secondary";
      case "Resolved": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Service Workflows</h2>
          <p className="text-muted-foreground">Automate and streamline customer support processes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Service Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input id="workflow-name" placeholder="Enter workflow name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflow-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="escalation">Escalation</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workflow-description">Description</Label>
                <Textarea id="workflow-description" placeholder="Describe the workflow purpose" />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Trigger Conditions</h4>
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Keyword Detection</SelectItem>
                      <SelectItem value="customer_type">Customer Type</SelectItem>
                      <SelectItem value="order_value">Order Value</SelectItem>
                      <SelectItem value="priority">Priority Level</SelectItem>
                      <SelectItem value="channel">Communication Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter(w => w.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter(w => w.status === "paused").length} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-15%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              23 auto-assigned today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.8%</div>
            <p className="text-xs text-muted-foreground">
              Automated workflows
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="tickets">Active Tickets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Avg Resolution</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Tickets Processed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-muted-foreground">{workflow.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{workflow.trigger}</Badge>
                      </TableCell>
                      <TableCell>{workflow.steps} steps</TableCell>
                      <TableCell>{workflow.avgResolutionTime}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{workflow.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{workflow.ticketsProcessed}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Last Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.id}</TableCell>
                      <TableCell>{ticket.customer}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{ticket.workflow}</TableCell>
                      <TableCell>{ticket.assignee}</TableCell>
                      <TableCell className="text-sm">{ticket.lastUpdate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resolution Time by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Refund Requests</span>
                    <span className="font-medium">2.5 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VIP Escalations</span>
                    <span className="font-medium">45 minutes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Product Complaints</span>
                    <span className="font-medium">4.2 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Shipping Issues</span>
                    <span className="font-medium">1.8 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Mike Chen</span>
                      <p className="text-xs text-muted-foreground">45 tickets resolved</p>
                    </div>
                    <Badge variant="default">4.8★</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Lisa Brown</span>
                      <p className="text-xs text-muted-foreground">38 tickets resolved</p>
                    </div>
                    <Badge variant="default">4.7★</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Tom Anderson</span>
                      <p className="text-xs text-muted-foreground">42 tickets resolved</p>
                    </div>
                    <Badge variant="default">4.6★</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Refund Confirmation</span>
                      <p className="text-xs text-muted-foreground">Automated refund processing email</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">VIP Welcome</span>
                      <p className="text-xs text-muted-foreground">Personalized VIP customer greeting</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Issue Resolution</span>
                      <p className="text-xs text-muted-foreground">Follow-up after problem resolution</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Order Status Inquiry</span>
                      <p className="text-xs text-muted-foreground">Standard response for order questions</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Product Information</span>
                      <p className="text-xs text-muted-foreground">Detailed product specifications</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Escalation Notice</span>
                      <p className="text-xs text-muted-foreground">Manager escalation notification</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}