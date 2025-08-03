import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, TrendingUp, Crown, Star, Search } from "lucide-react";

export function CustomerLifetimeValue() {
  const [timeRange, setTimeRange] = useState("1_year");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");

  const clvMetrics = {
    average: 485,
    total: 2400000,
    segments: {
      vip: { count: 45, avgClv: 1250, color: "text-purple-600" },
      loyal: { count: 234, avgClv: 780, color: "text-blue-600" },
      regular: { count: 567, avgClv: 320, color: "text-green-600" },
      new: { count: 1200, avgClv: 85, color: "text-gray-600" }
    }
  };

  const topCustomers = [
    { id: 1, name: "Sarah Johnson", email: "sarah@example.com", clv: 2450, orders: 28, segment: "VIP", lastOrder: "2024-01-15" },
    { id: 2, name: "Michael Chen", email: "michael@example.com", clv: 1890, orders: 22, segment: "VIP", lastOrder: "2024-01-14" },
    { id: 3, name: "Emily Davis", email: "emily@example.com", clv: 1650, orders: 19, segment: "VIP", lastOrder: "2024-01-13" },
    { id: 4, name: "David Wilson", email: "david@example.com", clv: 1420, orders: 16, segment: "Loyal", lastOrder: "2024-01-12" },
    { id: 5, name: "Lisa Brown", email: "lisa@example.com", clv: 1380, orders: 18, segment: "Loyal", lastOrder: "2024-01-11" }
  ];

  const cohortData = [
    { month: "Jan 2024", customers: 450, clv: 520, retention: 85 },
    { month: "Dec 2023", customers: 380, clv: 485, retention: 78 },
    { month: "Nov 2023", customers: 320, clv: 445, retention: 72 },
    { month: "Oct 2023", customers: 290, clv: 412, retention: 68 },
    { month: "Sep 2023", customers: 250, clv: 395, retention: 65 }
  ];

  const getSegmentBadge = (segment: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      "VIP": "default",
      "Loyal": "secondary",
      "Regular": "outline",
      "New": "outline"
    };
    return variants[segment] || "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Lifetime Value</h2>
          <p className="text-muted-foreground">Track and analyze customer value over time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3_months">3 Months</SelectItem>
              <SelectItem value="6_months">6 Months</SelectItem>
              <SelectItem value="1_year">1 Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button>Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CLV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clvMetrics.average}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CLV</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clvMetrics.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clvMetrics.segments.vip.count}</div>
            <p className="text-xs text-muted-foreground">
              Avg. ${clvMetrics.segments.vip.avgClv} CLV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,046</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+156</span> new this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(clvMetrics.segments).map(([key, segment]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium capitalize">{key}</span>
                    <Badge variant="outline">{segment.count} customers</Badge>
                  </div>
                  <span className={`font-medium ${segment.color}`}>
                    ${segment.avgClv}
                  </span>
                </div>
                <Progress 
                  value={(segment.count / 2046) * 100} 
                  className="h-2" 
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CLV by Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cohortData.map((cohort, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{cohort.month}</div>
                    <div className="text-sm text-muted-foreground">
                      {cohort.customers} customers
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${cohort.clv}</div>
                    <div className="text-sm text-muted-foreground">
                      {cohort.retention}% retained
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="top_customers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="top_customers">Top Customers</TabsTrigger>
          <TabsTrigger value="predictions">CLV Predictions</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="top_customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Customers by CLV</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="loyal">Loyal</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>CLV</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Last Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${customer.clv.toLocaleString()}
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>
                        <Badge variant={getSegmentBadge(customer.segment)}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.lastOrder}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  CLV Growth Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next 3 months</span>
                    <span className="font-medium text-green-600">+15%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next 6 months</span>
                    <span className="font-medium text-green-600">+28%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next year</span>
                    <span className="font-medium text-green-600">+42%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High-value at risk</span>
                    <span className="font-medium text-red-600">12 customers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Potential CLV loss</span>
                    <span className="font-medium text-red-600">$18,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recovery potential</span>
                    <span className="font-medium text-green-600">65%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CLV growth rate</span>
                    <span className="font-medium text-green-600">+8.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New customer CLV</span>
                    <span className="font-medium">$95</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Retention impact</span>
                    <span className="font-medium text-blue-600">+$85/customer</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Category</span>
                    <span className="font-medium">Electronics</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Channel</span>
                    <span className="font-medium">Email marketing</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Season</span>
                    <span className="font-medium">Holiday period</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Upsell potential</span>
                    <span className="font-medium text-green-600">$45K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cross-sell potential</span>
                    <span className="font-medium text-green-600">$28K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Win-back potential</span>
                    <span className="font-medium text-blue-600">$12K</span>
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