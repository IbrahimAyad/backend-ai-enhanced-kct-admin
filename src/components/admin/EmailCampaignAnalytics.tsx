import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Send, 
  Eye, 
  MousePointer, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Users,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function EmailCampaignAnalytics() {
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  const campaignStats = {
    totalSent: 45280,
    delivered: 44156,
    opened: 15674,
    clicked: 3124,
    bounced: 1124,
    unsubscribed: 89,
    revenue: 28940
  };

  const campaigns = [
    {
      id: 'welcome-series',
      name: 'Welcome Series',
      type: 'Automated',
      sent: 2840,
      delivered: 2795,
      openRate: 42.5,
      clickRate: 8.3,
      revenue: 5420,
      status: 'active'
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart Recovery',
      type: 'Automated',
      sent: 1580,
      delivered: 1542,
      openRate: 38.2,
      clickRate: 12.7,
      revenue: 8940,
      status: 'active'
    },
    {
      id: 'monthly-newsletter',
      name: 'Monthly Newsletter',
      type: 'Campaign',
      sent: 8920,
      delivered: 8756,
      openRate: 28.4,
      clickRate: 4.2,
      revenue: 2890,
      status: 'sent'
    },
    {
      id: 'flash-sale',
      name: 'Flash Sale 48h',
      type: 'Campaign',
      sent: 12450,
      delivered: 12201,
      openRate: 35.7,
      clickRate: 9.8,
      revenue: 15420,
      status: 'sent'
    },
    {
      id: 'win-back',
      name: 'Win-back Campaign',
      type: 'Automated',
      sent: 3240,
      delivered: 3156,
      openRate: 22.8,
      clickRate: 6.4,
      revenue: 1840,
      status: 'active'
    }
  ];

  const performanceData = [
    { date: '2024-01-01', sent: 1200, opened: 420, clicked: 84, revenue: 890 },
    { date: '2024-01-02', sent: 980, opened: 340, clicked: 68, revenue: 750 },
    { date: '2024-01-03', sent: 1450, opened: 580, clicked: 116, revenue: 1240 },
    { date: '2024-01-04', sent: 1820, opened: 656, clicked: 131, revenue: 1580 },
    { date: '2024-01-05', sent: 2100, opened: 798, clicked: 160, revenue: 1920 },
    { date: '2024-01-06', sent: 1650, opened: 594, clicked: 119, revenue: 1420 },
    { date: '2024-01-07', sent: 1980, opened: 713, clicked: 143, revenue: 1680 }
  ];

  const segmentPerformance = [
    { segment: 'VIP Customers', sent: 1240, openRate: 52.3, clickRate: 18.7, revenue: 8940 },
    { segment: 'New Customers', sent: 3580, openRate: 41.2, clickRate: 12.4, revenue: 5420 },
    { segment: 'Regular Customers', sent: 8920, openRate: 32.8, clickRate: 7.9, revenue: 12890 },
    { segment: 'Inactive Customers', sent: 2450, openRate: 18.4, clickRate: 3.2, revenue: 980 }
  ];

  const calculateRates = () => ({
    deliveryRate: ((campaignStats.delivered / campaignStats.totalSent) * 100).toFixed(1),
    openRate: ((campaignStats.opened / campaignStats.delivered) * 100).toFixed(1),
    clickRate: ((campaignStats.clicked / campaignStats.opened) * 100).toFixed(1),
    bounceRate: ((campaignStats.bounced / campaignStats.totalSent) * 100).toFixed(1),
    unsubscribeRate: ((campaignStats.unsubscribed / campaignStats.delivered) * 100).toFixed(2)
  });

  const rates = calculateRates();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{campaignStats.totalSent.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rates.deliveryRate}% delivered
                </p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">{rates.openRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {campaignStats.opened.toLocaleString()} opens
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={parseFloat(rates.openRate)} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-bold">{rates.clickRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {campaignStats.clicked.toLocaleString()} clicks
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={parseFloat(rates.clickRate)} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Generated</p>
                <p className="text-2xl font-bold">${campaignStats.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+15.2%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="segments">Audience Segments</TabsTrigger>
          <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campaign Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge variant={campaign.type === 'Automated' ? 'default' : 'secondary'}>
                          {campaign.type}
                        </Badge>
                        <Badge 
                          variant={campaign.status === 'active' ? 'default' : 'outline'}
                          className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${campaign.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">revenue</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Sent</p>
                        <p className="font-semibold">{campaign.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delivered</p>
                        <p className="font-semibold">{campaign.delivered.toLocaleString()}</p>
                        <p className="text-xs text-green-600">
                          {((campaign.delivered / campaign.sent) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="font-semibold">{campaign.openRate}%</p>
                        <Progress value={campaign.openRate} className="mt-1 h-1" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="font-semibold">{campaign.clickRate}%</p>
                        <Progress value={campaign.clickRate} className="mt-1 h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Email Performance Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="opened" 
                      stroke="#16a34a" 
                      strokeWidth={2}
                      name="Opens"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="clicked" 
                      stroke="#ea580c" 
                      strokeWidth={2}
                      name="Clicks"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience Segment Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {segmentPerformance.map((segment, index) => (
                  <div key={segment.segment} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{segment.segment}</h3>
                      <div className="text-right">
                        <p className="font-semibold">${segment.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">revenue</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Emails Sent</p>
                        <p className="font-semibold">{segment.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="font-semibold">{segment.openRate}%</p>
                        <Progress value={segment.openRate} className="mt-1 h-1" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Click Rate</p>
                        <p className="font-semibold">{segment.clickRate}%</p>
                        <Progress value={segment.clickRate} className="mt-1 h-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverability" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Delivery Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Delivery Rate</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{rates.deliveryRate}%</p>
                    <p className="text-xs text-green-600">Excellent</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span>Bounce Rate</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{rates.bounceRate}%</p>
                    <p className="text-xs text-orange-600">Good</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span>Unsubscribe Rate</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{rates.unsubscribeRate}%</p>
                    <p className="text-xs text-green-600">Excellent</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">✓ Great delivery rates!</p>
                  <p className="text-xs text-green-600">Your sender reputation is excellent.</p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">💡 Optimize send times</p>
                  <p className="text-xs text-blue-600">Try sending VIP emails at 10 AM for better open rates.</p>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">⚠️ Clean inactive subscribers</p>
                  <p className="text-xs text-orange-600">Remove subscribers who haven't opened in 6+ months.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}