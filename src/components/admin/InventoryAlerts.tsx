import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, Package, AlertTriangle, TrendingDown, ShoppingCart, Mail, Slack } from "lucide-react";

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      name: "Low Stock Warning",
      description: "Alert when stock falls below reorder point",
      type: "low_stock",
      threshold: 25,
      status: "active",
      frequency: "immediate",
      channels: ["email", "slack"],
      lastTriggered: "2024-01-15 14:30",
      triggerCount: 8
    },
    {
      id: 2,
      name: "Out of Stock Critical",
      description: "Immediate alert for zero stock items",
      type: "out_of_stock",
      threshold: 0,
      status: "active",
      frequency: "immediate",
      channels: ["email", "sms", "slack"],
      lastTriggered: "2024-01-15 12:15",
      triggerCount: 3
    },
    {
      id: 3,
      name: "Overstock Alert",
      description: "Alert for excess inventory levels",
      type: "overstock",
      threshold: 500,
      status: "active",
      frequency: "weekly",
      channels: ["email"],
      lastTriggered: "2024-01-14 09:00",
      triggerCount: 12
    },
    {
      id: 4,
      name: "Fast Moving Items",
      description: "Alert for items selling faster than usual",
      type: "fast_moving",
      threshold: 150,
      status: "paused",
      frequency: "daily",
      channels: ["email", "slack"],
      lastTriggered: "2024-01-13 16:45",
      triggerCount: 25
    }
  ]);

  const activeAlerts = [
    {
      id: "ALT-001",
      product: "Summer Dress - Blue",
      sku: "SD-001-BL",
      type: "Low Stock",
      currentStock: 15,
      threshold: 25,
      severity: "medium",
      triggered: "2024-01-15 14:30",
      status: "active"
    },
    {
      id: "ALT-002",
      product: "Coffee Mug Set",
      sku: "CM-001-SET",
      type: "Out of Stock",
      currentStock: 0,
      threshold: 0,
      severity: "critical",
      triggered: "2024-01-15 12:15",
      status: "active"
    },
    {
      id: "ALT-003",
      product: "Wireless Headphones",
      sku: "WH-001",
      type: "Low Stock",
      currentStock: 18,
      threshold: 30,
      severity: "medium",
      triggered: "2024-01-15 11:00",
      status: "active"
    },
    {
      id: "ALT-004",
      product: "Yoga Mat - Premium",
      sku: "YM-001-PR",
      type: "Overstock",
      currentStock: 520,
      threshold: 500,
      severity: "low",
      triggered: "2024-01-14 09:00",
      status: "acknowledged"
    }
  ];

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "low stock": return <TrendingDown className="h-4 w-4" />;
      case "out of stock": return <AlertTriangle className="h-4 w-4" />;
      case "overstock": return <Package className="h-4 w-4" />;
      case "fast moving": return <ShoppingCart className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const toggleAlertStatus = (alertId: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: alert.status === "active" ? "paused" : "active" }
        : alert
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Alerts & Reordering</h2>
          <p className="text-muted-foreground">Automated inventory monitoring and reorder management</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Inventory Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-name">Alert Name</Label>
                  <Input id="alert-name" placeholder="Enter alert name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="overstock">Overstock</SelectItem>
                      <SelectItem value="fast_moving">Fast Moving</SelectItem>
                      <SelectItem value="slow_moving">Slow Moving</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold Value</Label>
                  <Input id="threshold" type="number" placeholder="Enter threshold" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="email" />
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="sms" />
                    <Label htmlFor="sms">SMS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="slack" />
                    <Label htmlFor="slack">Slack</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="webhook" />
                    <Label htmlFor="webhook">Webhook</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowCreateDialog(false)}>
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.filter(a => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">
              {activeAlerts.filter(a => a.severity === "critical").length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">+5</span> since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Reorders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value at Risk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.4K</div>
            <p className="text-xs text-muted-foreground">
              Out of stock items
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active_alerts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active_alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="alert_rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="reorder_rules">Reorder Rules</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="active_alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Triggered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.product}</div>
                          <div className="text-sm text-muted-foreground">{alert.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(alert.type)}
                          <span>{alert.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{alert.currentStock}</TableCell>
                      <TableCell>{alert.threshold}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{alert.triggered}</TableCell>
                      <TableCell>
                        <Badge variant={alert.status === "active" ? "destructive" : "outline"}>
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                          <Button variant="ghost" size="sm">
                            Dismiss
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

        <TabsContent value="alert_rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.name}</div>
                          <div className="text-sm text-muted-foreground">{alert.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{alert.type.replace('_', ' ')}</TableCell>
                      <TableCell>{alert.threshold}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.frequency}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {alert.channels.map((channel) => (
                            <Badge key={channel} variant="secondary" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{alert.lastTriggered}</TableCell>
                      <TableCell>
                        <Badge variant={alert.status === "active" ? "default" : "secondary"}>
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={alert.status === "active"}
                            onCheckedChange={() => toggleAlertStatus(alert.id)}
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

        <TabsContent value="reorder_rules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Reorder Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Auto-reorder when stock below reorder point</span>
                      <p className="text-xs text-muted-foreground">Automatically create purchase orders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">VIP products priority reordering</span>
                      <p className="text-xs text-muted-foreground">Expedite high-value product reorders</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Seasonal adjustment factors</span>
                      <p className="text-xs text-muted-foreground">Adjust reorder quantities based on season</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reorder Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Lead Time (days)</Label>
                    <Input type="number" defaultValue="14" />
                  </div>
                  <div className="space-y-2">
                    <Label>Safety Stock Percentage</Label>
                    <Input type="number" defaultValue="20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Auto-Order Value</Label>
                    <Input type="number" defaultValue="5000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Approval Required Above</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Coffee Mug Set - Out of Stock</p>
                    <p className="text-xs text-muted-foreground">Stock reached 0 units. Auto-reorder initiated.</p>
                    <p className="text-xs text-muted-foreground">2024-01-15 12:15</p>
                  </div>
                  <Badge variant="destructive">Critical</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <TrendingDown className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Summer Dress - Blue - Low Stock</p>
                    <p className="text-xs text-muted-foreground">Stock fell below reorder point (25 units).</p>
                    <p className="text-xs text-muted-foreground">2024-01-15 14:30</p>
                  </div>
                  <Badge variant="secondary">Medium</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yoga Mat - Premium - Overstock</p>
                    <p className="text-xs text-muted-foreground">Stock exceeded maximum threshold (500 units).</p>
                    <p className="text-xs text-muted-foreground">2024-01-14 09:00</p>
                  </div>
                  <Badge variant="outline">Low</Badge>
                </div>

                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Wireless Headphones - Reorder Completed</p>
                    <p className="text-xs text-muted-foreground">Purchase order #PO-2024-001 completed successfully.</p>
                    <p className="text-xs text-muted-foreground">2024-01-13 16:45</p>
                  </div>
                  <Badge variant="default">Resolved</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}