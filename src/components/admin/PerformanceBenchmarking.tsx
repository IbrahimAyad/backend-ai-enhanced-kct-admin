import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, TrendingDown, Target, Award, Users, DollarSign, ShoppingCart } from "lucide-react";

export function PerformanceBenchmarking() {
  const [industry, setIndustry] = useState("retail");
  const [timeRange, setTimeRange] = useState("1_year");
  const [segment, setSegment] = useState("similar_size");

  const kpiBenchmarks = [
    {
      metric: "Conversion Rate",
      yourValue: 3.8,
      industryAvg: 2.9,
      topQuartile: 4.5,
      unit: "%",
      trend: "up",
      status: "above",
      icon: ShoppingCart
    },
    {
      metric: "Average Order Value",
      yourValue: 67.50,
      industryAvg: 58.20,
      topQuartile: 85.40,
      unit: "$",
      trend: "up",
      status: "above",
      icon: DollarSign
    },
    {
      metric: "Customer Lifetime Value",
      yourValue: 485,
      industryAvg: 520,
      topQuartile: 750,
      unit: "$",
      trend: "down",
      status: "below",
      icon: Users
    },
    {
      metric: "Cart Abandonment Rate",
      yourValue: 68.5,
      industryAvg: 70.2,
      topQuartile: 45.8,
      unit: "%",
      trend: "down",
      status: "above",
      icon: ShoppingCart,
      inverted: true
    },
    {
      metric: "Customer Acquisition Cost",
      yourValue: 42.80,
      industryAvg: 38.90,
      topQuartile: 28.50,
      unit: "$",
      trend: "up",
      status: "below",
      icon: Target,
      inverted: true
    },
    {
      metric: "Return Rate",
      yourValue: 8.2,
      industryAvg: 9.6,
      topQuartile: 5.4,
      unit: "%",
      trend: "down",
      status: "above",
      icon: Award,
      inverted: true
    }
  ];

  const competitorData = [
    { name: "Competitor A", conversionRate: 4.2, aov: 72.30, traffic: "High", marketShare: 18.5 },
    { name: "Competitor B", conversionRate: 3.5, aov: 65.80, traffic: "Medium", marketShare: 12.8 },
    { name: "Competitor C", conversionRate: 2.8, aov: 58.90, traffic: "High", marketShare: 22.1 },
    { name: "Industry Leader", conversionRate: 5.1, aov: 89.40, traffic: "Very High", marketShare: 35.2 }
  ];

  const getStatusColor = (status: string, inverted = false) => {
    if (inverted) {
      return status === "above" ? "text-green-600" : "text-red-600";
    }
    return status === "above" ? "text-green-600" : "text-red-600";
  };

  const getPerformanceScore = (yourValue: number, industryAvg: number, topQuartile: number, inverted = false) => {
    if (inverted) {
      // For metrics where lower is better (like cart abandonment)
      if (yourValue <= topQuartile) return 90 + (topQuartile - yourValue) / topQuartile * 10;
      if (yourValue <= industryAvg) return 60 + (industryAvg - yourValue) / (industryAvg - topQuartile) * 30;
      return Math.max(0, 60 - (yourValue - industryAvg) / industryAvg * 60);
    } else {
      // For metrics where higher is better
      if (yourValue >= topQuartile) return 90 + (yourValue - topQuartile) / topQuartile * 10;
      if (yourValue >= industryAvg) return 60 + (yourValue - industryAvg) / (topQuartile - industryAvg) * 30;
      return Math.max(0, (yourValue / industryAvg) * 60);
    }
  };

  const getTrafficBadge = (traffic: string): "default" | "secondary" | "outline" | "destructive" => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      "Very High": "default",
      "High": "secondary",
      "Medium": "outline",
      "Low": "destructive"
    };
    return variants[traffic] || "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Benchmarking</h2>
          <p className="text-muted-foreground">Compare your metrics against industry standards</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="home_garden">Home & Garden</SelectItem>
            </SelectContent>
          </Select>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="similar_size">Similar Size</SelectItem>
              <SelectItem value="all_companies">All Companies</SelectItem>
              <SelectItem value="top_performers">Top Performers</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiBenchmarks.slice(0, 6).map((kpi, index) => {
          const Icon = kpi.icon;
          const score = getPerformanceScore(kpi.yourValue, kpi.industryAvg, kpi.topQuartile, kpi.inverted);
          
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.metric}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpi.unit === "$" ? "$" : ""}{kpi.yourValue}{kpi.unit === "%" ? "%" : kpi.unit === "$" ? "" : ""}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Progress value={score} className="flex-1 h-2" />
                  <span className="text-xs font-medium">{Math.round(score)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Industry: {kpi.unit === "$" ? "$" : ""}{kpi.industryAvg}{kpi.unit === "%" ? "%" : ""}</span>
                  <span className={getStatusColor(kpi.status, kpi.inverted)}>
                    {kpi.trend === "up" ? "↗" : "↘"} {kpi.status === "above" ? (kpi.inverted ? "Better" : "Above") : (kpi.inverted ? "Worse" : "Below")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Score</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={78} className="w-20 h-2" />
                      <span className="font-medium">78/100</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Metrics Above Industry</span>
                    <span className="font-medium text-green-600">4/6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Top Quartile Metrics</span>
                    <span className="font-medium text-blue-600">2/6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Industry Rank</span>
                    <span className="font-medium">#234 of 1,250</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Lifetime Value</span>
                    <Badge variant="outline">High Impact</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Acquisition Cost</span>
                    <Badge variant="outline">Medium Impact</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Order Value</span>
                    <Badge variant="outline">Low Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Benchmark Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Your Value</TableHead>
                    <TableHead>Industry Average</TableHead>
                    <TableHead>Top Quartile</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiBenchmarks.map((kpi, index) => {
                    const gapToAvg = kpi.inverted 
                      ? ((kpi.industryAvg - kpi.yourValue) / kpi.industryAvg * 100)
                      : ((kpi.yourValue - kpi.industryAvg) / kpi.industryAvg * 100);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{kpi.metric}</TableCell>
                        <TableCell>
                          {kpi.unit === "$" ? "$" : ""}{kpi.yourValue}{kpi.unit === "%" ? "%" : ""}
                        </TableCell>
                        <TableCell>
                          {kpi.unit === "$" ? "$" : ""}{kpi.industryAvg}{kpi.unit === "%" ? "%" : ""}
                        </TableCell>
                        <TableCell>
                          {kpi.unit === "$" ? "$" : ""}{kpi.topQuartile}{kpi.unit === "%" ? "%" : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant={kpi.status === "above" ? "default" : "secondary"}>
                            {kpi.status === "above" ? "Above Avg" : "Below Avg"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={gapToAvg >= 0 ? "text-green-600" : "text-red-600"}>
                            {gapToAvg >= 0 ? "+" : ""}{gapToAvg.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>AOV</TableHead>
                    <TableHead>Traffic Level</TableHead>
                    <TableHead>Market Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-medium">Your Company</TableCell>
                    <TableCell>3.8%</TableCell>
                    <TableCell>$67.50</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Medium</Badge>
                    </TableCell>
                    <TableCell>8.4%</TableCell>
                  </TableRow>
                  {competitorData.map((competitor, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{competitor.name}</TableCell>
                      <TableCell>{competitor.conversionRate}%</TableCell>
                      <TableCell>${competitor.aov}</TableCell>
                      <TableCell>
                        <Badge variant={getTrafficBadge(competitor.traffic)}>
                          {competitor.traffic}
                        </Badge>
                      </TableCell>
                      <TableCell>{competitor.marketShare}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Target className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Improve Customer Lifetime Value</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your CLV ($485) is 6.7% below industry average. Focus on retention strategies and upselling to reach the top quartile ($750).
                    </p>
                    <div className="mt-2 space-x-2">
                      <Badge variant="outline">Loyalty Program</Badge>
                      <Badge variant="outline">Email Marketing</Badge>
                      <Badge variant="outline">Personalization</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <DollarSign className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Optimize Customer Acquisition Cost</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your CAC ($42.80) is 10% above industry average. Optimize ad spend and improve organic channels to reduce costs.
                    </p>
                    <div className="mt-2 space-x-2">
                      <Badge variant="outline">SEO Optimization</Badge>
                      <Badge variant="outline">Social Media</Badge>
                      <Badge variant="outline">Referral Program</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Award className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Leverage Strong Conversion Rate</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your conversion rate (3.8%) is 31% above industry average. Scale traffic acquisition to maximize this advantage.
                    </p>
                    <div className="mt-2 space-x-2">
                      <Badge variant="outline">Paid Advertising</Badge>
                      <Badge variant="outline">Content Marketing</Badge>
                      <Badge variant="outline">Partnerships</Badge>
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