import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, TrendingUp, AlertTriangle, BarChart3, Calendar, Truck } from "lucide-react";

export function InventoryForecasting() {
  const [timeRange, setTimeRange] = useState("30_days");
  const [category, setCategory] = useState("all");

  const forecastData = [
    {
      product: "Summer Dress - Blue",
      sku: "SD-001-BL",
      currentStock: 45,
      forecastedDemand: 120,
      reorderPoint: 25,
      suggestedOrder: 150,
      daysUntilStockout: 8,
      confidence: 87,
      category: "Clothing",
      status: "critical"
    },
    {
      product: "Wireless Headphones",
      sku: "WH-001",
      currentStock: 78,
      forecastedDemand: 95,
      reorderPoint: 30,
      suggestedOrder: 100,
      daysUntilStockout: 18,
      confidence: 92,
      category: "Electronics",
      status: "warning"
    },
    {
      product: "Yoga Mat - Premium",
      sku: "YM-001-PR",
      currentStock: 120,
      forecastedDemand: 85,
      reorderPoint: 40,
      suggestedOrder: 75,
      daysUntilStockout: 35,
      confidence: 89,
      category: "Sports",
      status: "good"
    },
    {
      product: "Coffee Mug Set",
      sku: "CM-001-SET",
      currentStock: 15,
      forecastedDemand: 180,
      reorderPoint: 50,
      suggestedOrder: 250,
      daysUntilStockout: 3,
      confidence: 94,
      category: "Home",
      status: "critical"
    }
  ];

  const demandDrivers = [
    { factor: "Seasonal Trends", impact: 85, description: "Summer collection peak season" },
    { factor: "Marketing Campaigns", impact: 72, description: "Email campaign launch next week" },
    { factor: "Historical Sales", impact: 90, description: "Based on last 2 years data" },
    { factor: "Economic Indicators", impact: 45, description: "Consumer spending patterns" },
    { factor: "Competitor Activity", impact: 38, description: "Market competition analysis" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "destructive";
      case "warning": return "secondary";
      case "good": return "default";
      default: return "outline";
    }
  };

  const getDaysColor = (days: number) => {
    if (days <= 7) return "text-red-600";
    if (days <= 14) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Forecasting</h2>
          <p className="text-muted-foreground">AI-powered demand prediction and stock optimization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7_days">7 Days</SelectItem>
              <SelectItem value="30_days">30 Days</SelectItem>
              <SelectItem value="90_days">90 Days</SelectItem>
              <SelectItem value="1_year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8</div>
            <p className="text-xs text-muted-foreground">
              Need immediate reorder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Days to Stockout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggested Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$47K</div>
            <p className="text-xs text-muted-foreground">
              Total value to order
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList>
          <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Recommendations</TabsTrigger>
          <TabsTrigger value="drivers">Demand Drivers</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory Forecast</CardTitle>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Forecasted Demand</TableHead>
                    <TableHead>Days to Stockout</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecastData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product}</div>
                          <div className="text-sm text-muted-foreground">{item.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>{item.currentStock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.forecastedDemand}
                      </TableCell>
                      <TableCell>
                        <span className={getDaysColor(item.daysUntilStockout)}>
                          {item.daysUntilStockout} days
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={item.confidence} className="w-16 h-2" />
                          <span className="text-xs">{item.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reorder Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Suggested Order</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecastData
                    .filter(item => item.currentStock <= item.reorderPoint)
                    .map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product}</div>
                          <div className="text-sm text-muted-foreground">{item.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.reorderPoint}</TableCell>
                      <TableCell>
                        <span className={item.currentStock <= item.reorderPoint ? "text-red-600 font-medium" : ""}>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.suggestedOrder}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status === "critical" ? "High" : item.status === "warning" ? "Medium" : "Low"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant={item.status === "critical" ? "destructive" : "outline"}>
                          Create PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Drivers Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {demandDrivers.map((driver, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{driver.factor}</span>
                      <p className="text-sm text-muted-foreground">{driver.description}</p>
                    </div>
                    <span className="font-medium">{driver.impact}%</span>
                  </div>
                  <Progress value={driver.impact} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Summer Peak (Jun-Aug)</span>
                    <span className="font-medium text-orange-600">+45% demand</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Holiday Rush (Nov-Dec)</span>
                    <span className="font-medium text-red-600">+85% demand</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Back to School (Aug-Sep)</span>
                    <span className="font-medium text-blue-600">+35% demand</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Spring Collection (Mar-May)</span>
                    <span className="font-medium text-green-600">+25% demand</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Electronics</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clothing</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={72} className="w-20 h-2" />
                      <span className="text-sm font-medium">72%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Home & Garden</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={68} className="w-20 h-2" />
                      <span className="text-sm font-medium">68%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sports</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={59} className="w-20 h-2" />
                      <span className="text-sm font-medium">59%</span>
                    </div>
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