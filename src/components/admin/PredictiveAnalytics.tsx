import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, BarChart3 } from "lucide-react";

export function PredictiveAnalytics() {
  const [selectedModel, setSelectedModel] = useState("sales_forecast");
  const [timeRange, setTimeRange] = useState("30_days");

  const models = [
    {
      id: "sales_forecast",
      name: "Sales Forecasting",
      accuracy: 87,
      status: "active",
      predictions: [
        { metric: "Revenue", predicted: "$125K", confidence: 85, trend: "up" },
        { metric: "Orders", predicted: "2,340", confidence: 82, trend: "up" },
        { metric: "AOV", predicted: "$53.40", confidence: 90, trend: "down" }
      ]
    },
    {
      id: "demand_forecast",
      name: "Demand Forecasting",
      accuracy: 91,
      status: "active",
      predictions: [
        { metric: "Top Products", predicted: "Summer Collection", confidence: 94, trend: "up" },
        { metric: "Peak Day", predicted: "July 15th", confidence: 88, trend: "up" },
        { metric: "Stock Needed", predicted: "15% increase", confidence: 85, trend: "up" }
      ]
    },
    {
      id: "churn_prediction",
      name: "Customer Churn",
      accuracy: 79,
      status: "training",
      predictions: [
        { metric: "At-Risk Customers", predicted: "234", confidence: 79, trend: "down" },
        { metric: "Churn Rate", predicted: "12.5%", confidence: 81, trend: "up" },
        { metric: "Revenue at Risk", predicted: "$18K", confidence: 77, trend: "up" }
      ]
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Analytics</h2>
          <p className="text-muted-foreground">AI-powered insights and forecasting</p>
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
            <Brain className="h-4 w-4 mr-2" />
            Train New Model
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card 
            key={model.id} 
            className={`cursor-pointer transition-all ${selectedModel === model.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedModel(model.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{model.name}</CardTitle>
                <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                  {model.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Accuracy</span>
                  <span className="font-medium">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentModel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              {currentModel.name} - Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentModel.predictions.map((prediction, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{prediction.metric}</span>
                    {prediction.trend === 'up' ? 
                      <TrendingUp className="h-4 w-4 text-green-500" /> : 
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    }
                  </div>
                  <div className="text-2xl font-bold">{prediction.predicted}</div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {prediction.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList>
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expected growth</span>
                    <span className="font-medium text-green-600">+15.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak month</span>
                    <span className="font-medium">December</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Best category</span>
                    <span className="font-medium">Electronics</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Repeat purchase rate</span>
                    <span className="font-medium text-blue-600">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg. time to purchase</span>
                    <span className="font-medium">3.2 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cart abandonment</span>
                    <span className="font-medium text-red-600">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Target className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Increase Summer Collection Inventory</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on seasonal trends, increase summer collection inventory by 25% before July peak.
                    </p>
                    <Badge variant="outline" className="mt-2">High Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Target className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Launch Retention Campaign</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Target 234 at-risk customers with personalized offers to reduce churn by 40%.
                    </p>
                    <Badge variant="outline" className="mt-2">Medium Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Target className="h-5 w-5 text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Optimize Checkout Flow</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Simplifying checkout could reduce abandonment from 23% to 15%, increasing revenue by $8K.
                    </p>
                    <Badge variant="outline" className="mt-2">High Impact</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Stock Alert - Summer Dresses</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Current stock will run out in 5 days based on predicted demand. Reorder immediately.
                    </p>
                    <Badge variant="destructive" className="mt-2">Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                  <div>
                    <h4 className="font-medium">Revenue Below Forecast</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This week's revenue is 12% below forecast. Consider promotional activities.
                    </p>
                    <Badge variant="secondary" className="mt-2">Warning</Badge>
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