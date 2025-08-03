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
import { Plus, Zap, Mail, Users, TrendingUp, Calendar, Send, Target } from "lucide-react";

export function MarketingAutomation() {
  const [triggers, setTriggers] = useState([
    {
      id: 1,
      name: "Welcome Series",
      description: "5-email onboarding sequence for new customers",
      type: "email_sequence",
      trigger: "user_signup",
      status: "active",
      audience: "New Customers",
      emails: 5,
      openRate: 67.5,
      clickRate: 12.8,
      conversions: 45
    },
    {
      id: 2,
      name: "Cart Abandonment",
      description: "Recover abandoned carts with personalized reminders",
      type: "abandoned_cart",
      trigger: "cart_abandoned",
      status: "active",
      audience: "Cart Abandoners",
      emails: 3,
      openRate: 45.2,
      clickRate: 18.5,
      conversions: 156
    },
    {
      id: 3,
      name: "Win-Back Campaign",
      description: "Re-engage customers who haven't purchased in 90 days",
      type: "winback",
      trigger: "inactive_customer",
      status: "active",
      audience: "Inactive Customers",
      emails: 4,
      openRate: 35.8,
      clickRate: 8.9,
      conversions: 23
    },
    {
      id: 4,
      name: "VIP Loyalty Program",
      description: "Exclusive offers for high-value customers",
      type: "loyalty",
      trigger: "customer_tier",
      status: "paused",
      audience: "VIP Customers",
      emails: 2,
      openRate: 78.3,
      clickRate: 25.4,
      conversions: 89
    }
  ]);

  const campaigns = [
    {
      id: "CAMP-001",
      name: "Summer Sale Announcement",
      type: "broadcast",
      status: "scheduled",
      audience: "All Subscribers",
      sendDate: "2024-01-20 10:00",
      recipients: 15420,
      subject: "🌞 Summer Sale: Up to 50% Off!"
    },
    {
      id: "CAMP-002",
      name: "New Product Launch",
      type: "segmented",
      status: "draft",
      audience: "Product Interest: Electronics",
      sendDate: "2024-01-22 14:00",
      recipients: 3240,
      subject: "Introducing Our Latest Innovation"
    },
    {
      id: "CAMP-003",
      name: "Birthday Discount",
      type: "triggered",
      status: "active",
      audience: "Birthday This Month",
      sendDate: "Daily at 09:00",
      recipients: 234,
      subject: "Happy Birthday! Here's Your Special Gift 🎉"
    }
  ];

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "paused": return "secondary";
      case "scheduled": return "default";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email_sequence": return <Mail className="h-4 w-4" />;
      case "abandoned_cart": return <Target className="h-4 w-4" />;
      case "winback": return <Users className="h-4 w-4" />;
      case "loyalty": return <TrendingUp className="h-4 w-4" />;
      case "broadcast": return <Send className="h-4 w-4" />;
      case "segmented": return <Users className="h-4 w-4" />;
      case "triggered": return <Zap className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const toggleTriggerStatus = (triggerId: number) => {
    setTriggers(triggers.map(trigger => 
      trigger.id === triggerId 
        ? { ...trigger, status: trigger.status === "active" ? "paused" : "active" }
        : trigger
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing Automation</h2>
          <p className="text-muted-foreground">Automated marketing triggers and campaign management</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Marketing Automation</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="automation-name">Automation Name</Label>
                  <Input id="automation-name" placeholder="Enter automation name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="automation-type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_sequence">Email Sequence</SelectItem>
                      <SelectItem value="abandoned_cart">Cart Abandonment</SelectItem>
                      <SelectItem value="winback">Win-Back Campaign</SelectItem>
                      <SelectItem value="loyalty">Loyalty Program</SelectItem>
                      <SelectItem value="birthday">Birthday Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="automation-description">Description</Label>
                <Textarea id="automation-description" placeholder="Describe the automation purpose" />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Trigger Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger Event</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_signup">User Signup</SelectItem>
                        <SelectItem value="first_purchase">First Purchase</SelectItem>
                        <SelectItem value="cart_abandoned">Cart Abandoned</SelectItem>
                        <SelectItem value="inactive_customer">Inactive Customer</SelectItem>
                        <SelectItem value="birthday">Customer Birthday</SelectItem>
                        <SelectItem value="product_view">Product View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        <SelectItem value="new">New Customers</SelectItem>
                        <SelectItem value="vip">VIP Customers</SelectItem>
                        <SelectItem value="inactive">Inactive Customers</SelectItem>
                        <SelectItem value="segment">Custom Segment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Automation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.filter(t => t.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">
              {triggers.filter(t => t.status === "paused").length} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,847</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">56.7%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$28.4K</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Automations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Automation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triggers.map((trigger) => (
                    <TableRow key={trigger.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trigger.name}</div>
                          <div className="text-sm text-muted-foreground">{trigger.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(trigger.type)}
                          <span className="text-sm">{trigger.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{trigger.audience}</TableCell>
                      <TableCell>{trigger.emails}</TableCell>
                      <TableCell>{trigger.openRate}%</TableCell>
                      <TableCell>{trigger.clickRate}%</TableCell>
                      <TableCell className="font-medium">{trigger.conversions}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(trigger.status)}>
                          {trigger.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={trigger.status === "active"}
                            onCheckedChange={() => toggleTriggerStatus(trigger.id)}
                          />
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Email Campaigns</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Send Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(campaign.type)}
                          <span className="text-sm">{campaign.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.audience}</TableCell>
                      <TableCell className="font-medium">{campaign.recipients.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{campaign.sendDate}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            Preview
                          </Button>
                        </div>
                      </TableCell>
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
                <CardTitle>Top Performing Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">VIP Loyalty Program</span>
                      <p className="text-xs text-muted-foreground">25.4% click rate</p>
                    </div>
                    <Badge variant="default">78.3% open</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Welcome Series</span>
                      <p className="text-xs text-muted-foreground">12.8% click rate</p>
                    </div>
                    <Badge variant="default">67.5% open</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Cart Abandonment</span>
                      <p className="text-xs text-muted-foreground">18.5% click rate</p>
                    </div>
                    <Badge variant="secondary">45.2% open</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cart Abandonment</span>
                    <span className="font-medium">$12,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">VIP Loyalty Program</span>
                    <span className="font-medium">$8,950</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Welcome Series</span>
                    <span className="font-medium">$4,230</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Win-Back Campaign</span>
                    <span className="font-medium">$2,820</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">56.7%</div>
                  <div className="text-sm text-muted-foreground">Average Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">16.2%</div>
                  <div className="text-sm text-muted-foreground">Average Click Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">3.8%</div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">$18.45</div>
                  <div className="text-sm text-muted-foreground">Revenue per Email</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                      <span className="text-sm font-medium">Welcome Email</span>
                      <p className="text-xs text-muted-foreground">New customer onboarding</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Cart Abandonment</span>
                      <p className="text-xs text-muted-foreground">Recover abandoned carts</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Win-Back Offer</span>
                      <p className="text-xs text-muted-foreground">Re-engage inactive customers</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Product Recommendation</span>
                      <p className="text-xs text-muted-foreground">Personalized product suggestions</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Customer Onboarding</span>
                      <p className="text-xs text-muted-foreground">5-step welcome sequence</p>
                    </div>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Post-Purchase Follow-up</span>
                      <p className="text-xs text-muted-foreground">3-email follow-up series</p>
                    </div>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Birthday Campaign</span>
                      <p className="text-xs text-muted-foreground">Automated birthday offers</p>
                    </div>
                    <Button variant="outline" size="sm">Use</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Re-engagement Series</span>
                      <p className="text-xs text-muted-foreground">Win back dormant customers</p>
                    </div>
                    <Button variant="outline" size="sm">Use</Button>
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