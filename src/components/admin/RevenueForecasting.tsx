import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart } from 'recharts';

export function RevenueForecasting() {
  const [forecastPeriod, setForecastPeriod] = useState('3months');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');

  const currentMetrics = {
    monthlyRevenue: 142500,
    growth: 12.8,
    avgOrderValue: 185,
    customerLTV: 850
  };

  const forecasts = {
    '1month': {
      conservative: 145000,
      realistic: 158000,
      optimistic: 172000,
      confidence: 85
    },
    '3months': {
      conservative: 435000,
      realistic: 485000,
      optimistic: 540000,
      confidence: 75
    },
    '6months': {
      conservative: 920000,
      realistic: 1050000,
      optimistic: 1180000,
      confidence: 65
    },
    '12months': {
      conservative: 1850000,
      realistic: 2100000,
      optimistic: 2400000,
      confidence: 55
    }
  };

  const historicalData = [
    { month: 'Jan 2024', actual: 98500, predicted: 95000, orders: 532 },
    { month: 'Feb 2024', actual: 105200, predicted: 102000, orders: 568 },
    { month: 'Mar 2024', actual: 118400, predicted: 115000, orders: 640 },
    { month: 'Apr 2024', actual: 125600, predicted: 122000, orders: 679 },
    { month: 'May 2024', actual: 132800, predicted: 128000, orders: 718 },
    { month: 'Jun 2024', actual: 142500, predicted: 138000, orders: 770 },
  ];

  const projectionData = [
    { month: 'Jan 2024', revenue: 98500, type: 'actual' },
    { month: 'Feb 2024', revenue: 105200, type: 'actual' },
    { month: 'Mar 2024', revenue: 118400, type: 'actual' },
    { month: 'Apr 2024', revenue: 125600, type: 'actual' },
    { month: 'May 2024', revenue: 132800, type: 'actual' },
    { month: 'Jun 2024', revenue: 142500, type: 'actual' },
    { month: 'Jul 2024', revenue: 158000, type: 'forecast', low: 145000, high: 172000 },
    { month: 'Aug 2024', revenue: 165000, type: 'forecast', low: 152000, high: 180000 },
    { month: 'Sep 2024', revenue: 172000, type: 'forecast', low: 158000, high: 188000 },
    { month: 'Oct 2024', revenue: 180000, type: 'forecast', low: 165000, high: 197000 },
    { month: 'Nov 2024', revenue: 188000, type: 'forecast', low: 172000, high: 206000 },
    { month: 'Dec 2024', revenue: 196000, type: 'forecast', low: 180000, high: 215000 }
  ];

  const seasonalityData = [
    { month: 'Jan', factor: 0.85, revenue: 98500 },
    { month: 'Feb', factor: 0.90, revenue: 105200 },
    { month: 'Mar', factor: 1.05, revenue: 118400 },
    { month: 'Apr', factor: 1.10, revenue: 125600 },
    { month: 'May', factor: 1.15, revenue: 132800 },
    { month: 'Jun', factor: 1.20, revenue: 142500 },
    { month: 'Jul', factor: 1.25, revenue: 158000 },
    { month: 'Aug', factor: 1.15, revenue: 165000 },
    { month: 'Sep', factor: 1.10, revenue: 172000 },
    { month: 'Oct', factor: 1.05, revenue: 180000 },
    { month: 'Nov', factor: 1.30, revenue: 188000 },
    { month: 'Dec', factor: 1.40, revenue: 196000 }
  ];

  const scenarioAnalysis = [
    {
      scenario: 'Economic Downturn',
      probability: 25,
      impact: -15,
      adjustedRevenue: forecasts[forecastPeriod].realistic * 0.85,
      factors: ['Reduced consumer spending', 'Lower order frequency', 'Price sensitivity']
    },
    {
      scenario: 'Market Expansion',
      probability: 40,
      impact: +20,
      adjustedRevenue: forecasts[forecastPeriod].realistic * 1.20,
      factors: ['New product lines', 'Geographic expansion', 'Increased marketing']
    },
    {
      scenario: 'Competition Increase',
      probability: 35,
      impact: -8,
      adjustedRevenue: forecasts[forecastPeriod].realistic * 0.92,
      factors: ['New competitors', 'Price wars', 'Market share loss']
    }
  ];

  const currentForecast = forecasts[forecastPeriod];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Forecast Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Next Month</SelectItem>
            <SelectItem value="3months">Next 3 Months</SelectItem>
            <SelectItem value="6months">Next 6 Months</SelectItem>
            <SelectItem value="12months">Next 12 Months</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Update Targets
        </Button>

        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Forecast Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conservative</p>
                <p className="text-2xl font-bold">${currentForecast.conservative.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600">Low scenario</span>
                </div>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Realistic</p>
                <p className="text-2xl font-bold">${currentForecast.realistic.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Most likely</span>
                </div>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimistic</p>
                <p className="text-2xl font-bold">${currentForecast.optimistic.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">High scenario</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">{currentForecast.confidence}%</p>
                <p className="text-xs text-muted-foreground mt-1">Prediction accuracy</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projection">Revenue Projection</TabsTrigger>
          <TabsTrigger value="accuracy">Historical Accuracy</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality Trends</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="projection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Revenue Forecast with Confidence Intervals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Area
                      type="monotone"
                      dataKey="high"
                      stroke="none"
                      fill="rgba(34, 197, 94, 0.1)"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="low"
                      stroke="none"
                      fill="white"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#dc2626" 
                      strokeWidth={3}
                      dot={(props) => {
                        const { payload } = props;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={4}
                            fill={payload.type === 'actual' ? '#dc2626' : '#f59e0b'}
                            stroke={payload.type === 'actual' ? '#dc2626' : '#f59e0b'}
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-sm">Actual Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">Forecast</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded opacity-30"></div>
                  <span className="text-sm">Confidence Band</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Forecast vs Actual Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Bar dataKey="predicted" fill="#93c5fd" name="Predicted" />
                    <Bar dataKey="actual" fill="#dc2626" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Average Accuracy</p>
                      <p className="text-2xl font-bold text-green-600">92.4%</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Forecast Bias</p>
                      <p className="text-2xl font-bold text-blue-600">-2.1%</p>
                      <p className="text-xs text-muted-foreground">Slightly conservative</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">MAPE</p>
                      <p className="text-2xl font-bold text-orange-600">7.6%</p>
                      <p className="text-xs text-muted-foreground">Mean absolute error</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonal Revenue Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={seasonalityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Bar yAxisId="left" dataKey="revenue" fill="#93c5fd" name="Revenue" />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="factor" 
                      stroke="#dc2626" 
                      strokeWidth={3}
                      name="Seasonal Factor"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="font-medium text-green-800">Peak Season: Nov-Dec</span>
                  <Badge className="bg-green-100 text-green-800">+35% average</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-medium text-blue-800">Strong Season: May-Aug</span>
                  <Badge className="bg-blue-100 text-blue-800">+18% average</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="font-medium text-orange-800">Low Season: Jan-Feb</span>
                  <Badge className="bg-orange-100 text-orange-800">-12% average</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Scenario Analysis & Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarioAnalysis.map((scenario, index) => (
                  <div key={scenario.scenario} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{scenario.scenario}</h3>
                        <Badge variant="outline">{scenario.probability}% probability</Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {scenario.impact > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`font-semibold ${scenario.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {scenario.impact > 0 ? '+' : ''}{scenario.impact}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${scenario.adjustedRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Key Factors:</p>
                      <div className="flex flex-wrap gap-2">
                        {scenario.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} variant="secondary" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Recommendations</h4>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Diversify revenue streams to reduce economic sensitivity</li>
                      <li>• Build competitive moats through customer loyalty programs</li>
                      <li>• Monitor market indicators for early warning signs</li>
                      <li>• Maintain flexible cost structure for quick adjustments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}