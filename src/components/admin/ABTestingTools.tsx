import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  TestTube,
  Plus,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Users,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ABTest {
  id: string;
  name: string;
  description: string;
  type: 'email_subject' | 'email_content' | 'landing_page' | 'product_page' | 'checkout_flow' | 'pricing';
  status: 'draft' | 'running' | 'completed' | 'paused';
  start_date: string;
  end_date?: string;
  traffic_split: number; // percentage for variant A
  hypothesis: string;
  goal_metric: string;
  significance_level: number;
  variants: ABTestVariant[];
  results: ABTestResults;
  created_at: string;
  updated_at: string;
}

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  is_control: boolean;
  content?: {
    subject?: string;
    html?: string;
    url?: string;
    image?: string;
    text?: string;
  };
  metrics: {
    visitors: number;
    conversions: number;
    conversion_rate: number;
    revenue: number;
  };
}

interface ABTestResults {
  winner?: string;
  confidence: number;
  statistical_significance: boolean;
  improvement: number;
  duration_days: number;
  total_visitors: number;
  total_conversions: number;
}

export function ABTestingTools() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Mock data for A/B tests
  const mockTests: ABTest[] = [
    {
      id: '1',
      name: 'Email Subject Line Test',
      description: 'Testing personalized vs generic subject lines',
      type: 'email_subject',
      status: 'running',
      start_date: '2024-01-15',
      traffic_split: 50,
      hypothesis: 'Personalized subject lines will increase open rates by 15%',
      goal_metric: 'email_open_rate',
      significance_level: 95,
      variants: [
        {
          id: 'a',
          name: 'Control (Generic)',
          description: 'Generic subject line without personalization',
          is_control: true,
          content: {
            subject: 'New Products Available Now'
          },
          metrics: {
            visitors: 5240,
            conversions: 1572,
            conversion_rate: 30.0,
            revenue: 12400
          }
        },
        {
          id: 'b',
          name: 'Variant (Personalized)',
          description: 'Personalized subject line with first name',
          is_control: false,
          content: {
            subject: '{first_name}, Check Out Our New Products'
          },
          metrics: {
            visitors: 5180,
            conversions: 1814,
            conversion_rate: 35.0,
            revenue: 14270
          }
        }
      ],
      results: {
        winner: 'b',
        confidence: 96.7,
        statistical_significance: true,
        improvement: 16.7,
        duration_days: 8,
        total_visitors: 10420,
        total_conversions: 3386
      },
      created_at: '2024-01-10',
      updated_at: '2024-01-23'
    },
    {
      id: '2',
      name: 'Product Page CTA Button',
      description: 'Testing button colors and text for product pages',
      type: 'product_page',
      status: 'completed',
      start_date: '2024-01-01',
      end_date: '2024-01-14',
      traffic_split: 50,
      hypothesis: 'Red CTA button will outperform blue button by 10%',
      goal_metric: 'add_to_cart_rate',
      significance_level: 95,
      variants: [
        {
          id: 'a',
          name: 'Control (Blue Button)',
          description: 'Blue "Add to Cart" button',
          is_control: true,
          content: {
            text: 'Add to Cart'
          },
          metrics: {
            visitors: 8940,
            conversions: 1430,
            conversion_rate: 16.0,
            revenue: 45670
          }
        },
        {
          id: 'b',
          name: 'Variant (Red Button)',
          description: 'Red "Buy Now" button',
          is_control: false,
          content: {
            text: 'Buy Now'
          },
          metrics: {
            visitors: 8760,
            conversions: 1490,
            conversion_rate: 17.0,
            revenue: 47560
          }
        }
      ],
      results: {
        winner: 'b',
        confidence: 92.3,
        statistical_significance: false,
        improvement: 6.25,
        duration_days: 14,
        total_visitors: 17700,
        total_conversions: 2920
      },
      created_at: '2023-12-28',
      updated_at: '2024-01-14'
    },
    {
      id: '3',
      name: 'Checkout Flow Optimization',
      description: 'Single page vs multi-step checkout process',
      type: 'checkout_flow',
      status: 'running',
      start_date: '2024-01-20',
      traffic_split: 50,
      hypothesis: 'Single page checkout will reduce abandonment by 20%',
      goal_metric: 'checkout_completion_rate',
      significance_level: 95,
      variants: [
        {
          id: 'a',
          name: 'Control (Multi-step)',
          description: 'Traditional 3-step checkout process',
          is_control: true,
          metrics: {
            visitors: 2340,
            conversions: 1638,
            conversion_rate: 70.0,
            revenue: 89450
          }
        },
        {
          id: 'b',
          name: 'Variant (Single Page)',
          description: 'All checkout fields on one page',
          is_control: false,
          metrics: {
            visitors: 2280,
            conversions: 1686,
            conversion_rate: 73.9,
            revenue: 92180
          }
        }
      ],
      results: {
        confidence: 78.5,
        statistical_significance: false,
        improvement: 5.6,
        duration_days: 3,
        total_visitors: 4620,
        total_conversions: 3324
      },
      created_at: '2024-01-18',
      updated_at: '2024-01-22'
    },
    {
      id: '4',
      name: 'Pricing Page Layout',
      description: 'Testing pricing table layouts and highlighted plans',
      type: 'pricing',
      status: 'draft',
      start_date: '2024-01-25',
      traffic_split: 33,
      hypothesis: 'Highlighting the middle tier will increase conversions',
      goal_metric: 'subscription_rate',
      significance_level: 95,
      variants: [
        {
          id: 'a',
          name: 'Control (No Highlight)',
          description: 'Standard pricing table layout',
          is_control: true,
          metrics: {
            visitors: 0,
            conversions: 0,
            conversion_rate: 0,
            revenue: 0
          }
        },
        {
          id: 'b',
          name: 'Variant (Popular Badge)',
          description: 'Middle tier highlighted with "Most Popular" badge',
          is_control: false,
          metrics: {
            visitors: 0,
            conversions: 0,
            conversion_rate: 0,
            revenue: 0
          }
        },
        {
          id: 'c',
          name: 'Variant (Color Highlight)',
          description: 'Middle tier with colored background',
          is_control: false,
          metrics: {
            visitors: 0,
            conversions: 0,
            conversion_rate: 0,
            revenue: 0
          }
        }
      ],
      results: {
        confidence: 0,
        statistical_significance: false,
        improvement: 0,
        duration_days: 0,
        total_visitors: 0,
        total_conversions: 0
      },
      created_at: '2024-01-22',
      updated_at: '2024-01-22'
    }
  ];

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTests(mockTests);
    } catch (error) {
      console.error('Error loading A/B tests:', error);
      toast({
        title: "Error",
        description: "Failed to load A/B tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      case 'draft': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return Play;
      case 'completed': return CheckCircle;
      case 'paused': return Pause;
      case 'draft': return Edit;
      default: return TestTube;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <TestTube className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading A/B tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">A/B Testing Tools</h2>
          <p className="text-muted-foreground">
            Create and manage A/B tests to optimize your customer experience
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New A/B Test</DialogTitle>
              <DialogDescription>
                Set up a new A/B test to optimize your conversion rates
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input id="test-name" placeholder="Enter test name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-description">Description</Label>
                <Textarea id="test-description" placeholder="Describe the test" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-type">Test Type</Label>
                  <Select defaultValue="email_subject">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_subject">Email Subject</SelectItem>
                      <SelectItem value="email_content">Email Content</SelectItem>
                      <SelectItem value="landing_page">Landing Page</SelectItem>
                      <SelectItem value="product_page">Product Page</SelectItem>
                      <SelectItem value="checkout_flow">Checkout Flow</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-metric">Goal Metric</Label>
                  <Select defaultValue="email_open_rate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email_open_rate">Email Open Rate</SelectItem>
                      <SelectItem value="add_to_cart_rate">Add to Cart Rate</SelectItem>
                      <SelectItem value="checkout_completion_rate">Checkout Completion Rate</SelectItem>
                      <SelectItem value="subscription_rate">Subscription Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="traffic-split">Traffic Split (%)</Label>
                  <Input id="traffic-split" type="number" min={0} max={100} defaultValue={50} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="significance-level">Significance Level (%)</Label>
                  <Input id="significance-level" type="number" min={50} max={99} defaultValue={95} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hypothesis">Hypothesis</Label>
                <Textarea id="hypothesis" placeholder="Describe your hypothesis" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Test
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* A/B Test Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Tests</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              +1 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(tests.reduce((sum, t) => sum + t.results.improvement, 0) / tests.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              From winning variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statistical Significance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((tests.filter(t => t.results.statistical_significance).length / tests.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Of completed tests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* A/B Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            A/B Tests
          </CardTitle>
          <CardDescription>
            Manage your A/B tests and monitor their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.map((test) => {
              const StatusIcon = getStatusIcon(test.status);
              const winningVariant = test.variants.find(v => v.id === test.results.winner);
              
              return (
                <div key={test.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <h3 className="font-semibold">{test.name}</h3>
                        <Badge variant={getStatusColor(test.status)}>
                          {test.status}
                        </Badge>
                        {test.results.statistical_significance && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Significant
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {test.type.replace('_', ' ')} • Goal: {test.goal_metric.replace('_', ' ')}
                        • Started: {formatDate(test.start_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTest(test)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {test.status === 'running' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : test.status === 'draft' ? (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Visitors</p>
                      <p className="font-semibold">{test.results.total_visitors.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conversions</p>
                      <p className="font-semibold">{test.results.total_conversions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Improvement</p>
                      <div className="flex items-center gap-1">
                        {test.results.improvement > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`font-semibold ${test.results.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {test.results.improvement > 0 ? '+' : ''}{test.results.improvement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Confidence</p>
                      <p className={`font-semibold ${getConfidenceColor(test.results.confidence)}`}>
                        {test.results.confidence.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-semibold">{test.results.duration_days} days</p>
                    </div>
                  </div>

                  {winningVariant && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Winner: {winningVariant.name}
                        </span>
                        <span className="text-xs text-green-600">
                          ({winningVariant.metrics.conversion_rate.toFixed(1)}% conversion rate)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Test Details Dialog */}
      {selectedTest && (
        <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                {selectedTest.name}
              </DialogTitle>
              <DialogDescription>{selectedTest.description}</DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Visitors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedTest.results.total_visitors.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Conversions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedTest.results.total_conversions.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Improvement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${selectedTest.results.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTest.results.improvement > 0 ? '+' : ''}{selectedTest.results.improvement.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${getConfidenceColor(selectedTest.results.confidence)}`}>
                        {selectedTest.results.confidence.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Test Hypothesis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedTest.hypothesis}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                <div className="space-y-4">
                  {selectedTest.variants.map((variant) => (
                    <Card key={variant.id} className={variant.id === selectedTest.results.winner ? 'border-green-500' : ''}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {variant.name}
                            {variant.is_control && <Badge variant="outline">Control</Badge>}
                            {variant.id === selectedTest.results.winner && <Badge className="bg-green-100 text-green-800">Winner</Badge>}
                          </div>
                        </CardTitle>
                        <CardDescription>{variant.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Visitors</p>
                            <p className="text-lg font-semibold">{variant.metrics.visitors.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Conversions</p>
                            <p className="text-lg font-semibold">{variant.metrics.conversions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Conversion Rate</p>
                            <p className="text-lg font-semibold">{variant.metrics.conversion_rate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="text-lg font-semibold">{formatCurrency(variant.metrics.revenue)}</p>
                          </div>
                        </div>

                        {variant.content && (
                          <div>
                            <Label className="text-sm font-medium">Content</Label>
                            <div className="mt-2 space-y-1">
                              {variant.content.subject && (
                                <p className="text-sm text-muted-foreground">Subject: {variant.content.subject}</p>
                              )}
                              {variant.content.text && (
                                <p className="text-sm text-muted-foreground">Text: {variant.content.text}</p>
                              )}
                              {variant.content.url && (
                                <p className="text-sm text-muted-foreground">URL: {variant.content.url}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Statistical Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence Level</span>
                          <span className={`font-semibold ${getConfidenceColor(selectedTest.results.confidence)}`}>
                            {selectedTest.results.confidence.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={selectedTest.results.confidence} />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Statistical Significance</span>
                        <span className={`font-semibold ${selectedTest.results.statistical_significance ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedTest.results.statistical_significance ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Improvement</span>
                        <span className={`font-semibold ${selectedTest.results.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedTest.results.improvement > 0 ? '+' : ''}{selectedTest.results.improvement.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Test Duration</span>
                        <span className="font-semibold">{selectedTest.results.duration_days} days</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedTest.results.statistical_significance ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Implement Winner</p>
                            <p className="text-xs text-green-600">Results are statistically significant</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Continue Testing</p>
                            <p className="text-xs text-yellow-600">Need more data for significance</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Target significance level: {selectedTest.significance_level}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Test Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Test Type</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {selectedTest.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Goal Metric</Label>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">
                          {selectedTest.goal_metric.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Traffic Split</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedTest.traffic_split}% / {100 - selectedTest.traffic_split}%</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Significance Level</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedTest.significance_level}%</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Start Date</Label>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedTest.start_date)}</p>
                      </div>
                      {selectedTest.end_date && (
                        <div>
                          <Label className="text-sm font-medium">End Date</Label>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedTest.end_date)}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Hypothesis</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedTest.hypothesis}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
