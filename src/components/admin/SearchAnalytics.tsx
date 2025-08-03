import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  AlertCircle,
  Target,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchQuery {
  query: string;
  count: number;
  results_found: number;
  avg_results: number;
  conversions: number;
  conversion_rate: number;
  category?: string;
}

interface SearchAnalytics {
  total_searches: number;
  unique_searchers: number;
  avg_results_per_search: number;
  search_conversion_rate: number;
  no_results_rate: number;
  popular_queries: SearchQuery[];
  trending_searches: SearchQuery[];
  search_by_category: any[];
  search_performance: any[];
}

export function SearchAnalytics() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [searchType, setSearchType] = useState('all');

  useEffect(() => {
    loadSearchAnalytics();
  }, [timeRange, searchType]);

  const loadSearchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockAnalytics: SearchAnalytics = {
        total_searches: 12450,
        unique_searchers: 8920,
        avg_results_per_search: 24.5,
        search_conversion_rate: 12.8,
        no_results_rate: 8.3,
        popular_queries: [
          {
            query: 'navy suit',
            count: 1250,
            results_found: 45,
            avg_results: 45,
            conversions: 189,
            conversion_rate: 15.1
          },
          {
            query: 'dress shirt',
            count: 890,
            results_found: 67,
            avg_results: 67,
            conversions: 156,
            conversion_rate: 17.5
          },
          {
            query: 'wedding suit',
            count: 750,
            results_found: 23,
            avg_results: 23,
            conversions: 98,
            conversion_rate: 13.1
          },
          {
            query: 'black tie',
            count: 680,
            results_found: 34,
            avg_results: 34,
            conversions: 89,
            conversion_rate: 13.1
          },
          {
            query: 'formal wear',
            count: 620,
            results_found: 89,
            avg_results: 89,
            conversions: 67,
            conversion_rate: 10.8
          }
        ],
        trending_searches: [
          {
            query: 'summer suit',
            count: 345,
            results_found: 12,
            avg_results: 12,
            conversions: 45,
            conversion_rate: 13.0
          },
          {
            query: 'linen shirt',
            count: 298,
            results_found: 8,
            avg_results: 8,
            conversions: 34,
            conversion_rate: 11.4
          },
          {
            query: 'casual blazer',
            count: 267,
            results_found: 15,
            avg_results: 15,
            conversions: 28,
            conversion_rate: 10.5
          }
        ],
        search_by_category: [
          { category: 'suits', searches: 4250, conversions: 567 },
          { category: 'shirts', searches: 3100, conversions: 445 },
          { category: 'ties', searches: 2200, conversions: 278 },
          { category: 'shoes', searches: 1900, conversions: 234 },
          { category: 'accessories', searches: 1000, conversions: 89 }
        ],
        search_performance: [
          { date: '2024-01-21', searches: 445, conversions: 56, conversion_rate: 12.6 },
          { date: '2024-01-22', searches: 512, conversions: 67, conversion_rate: 13.1 },
          { date: '2024-01-23', searches: 398, conversions: 49, conversion_rate: 12.3 },
          { date: '2024-01-24', searches: 589, conversions: 78, conversion_rate: 13.2 },
          { date: '2024-01-25', searches: 467, conversions: 61, conversion_rate: 13.1 },
          { date: '2024-01-26', searches: 523, conversions: 71, conversion_rate: 13.6 },
          { date: '2024-01-27', searches: 445, conversions: 58, conversion_rate: 13.0 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading search analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load search analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!analytics) {
    return <div>Loading...</div>;
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h2 className="text-2xl font-bold">Search Analytics</h2>
        
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Searches</SelectItem>
              <SelectItem value="text">Text Search</SelectItem>
              <SelectItem value="filter">Filter Search</SelectItem>
              <SelectItem value="voice">Voice Search</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSearchAnalytics}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Search className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Searches</p>
                <p className="text-2xl font-bold">{analytics.total_searches.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Eye className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Searchers</p>
                <p className="text-2xl font-bold">{analytics.unique_searchers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Results</p>
                <p className="text-2xl font-bold">{analytics.avg_results_per_search}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <ShoppingCart className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics.search_conversion_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">No Results Rate</p>
                <p className="text-2xl font-bold">{analytics.no_results_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Popular Queries</TabsTrigger>
          <TabsTrigger value="trends">Trending</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Search Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Search performance chart will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">Search trends over time</p>
              </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search by Category</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Category breakdown chart will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">Search distribution by category</p>
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Category performance chart will be displayed here</p>
                <p className="text-sm text-muted-foreground mt-2">Searches vs conversions by category</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Search Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.popular_queries.map((query, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">"{query.query}"</p>
                        <p className="text-sm text-muted-foreground">
                          {query.count} searches • {query.results_found} avg results
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Searches</p>
                        <p className="font-medium">{query.count.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Conversions</p>
                        <p className="font-medium">{query.conversions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Rate</p>
                        <p className={`font-medium ${
                          query.conversion_rate >= 15 ? 'text-green-600' :
                          query.conversion_rate >= 10 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {query.conversion_rate}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Search Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.trending_searches.map((query, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">"{query.query}"</p>
                        <p className="text-sm text-muted-foreground">
                          {query.count} searches • {query.results_found} results
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Growth</p>
                        <Badge variant="outline" className="text-green-600">
                          +{Math.floor(Math.random() * 50 + 10)}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Conversions</p>
                        <p className="font-medium">{query.conversions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Rate</p>
                        <p className="font-medium">{query.conversion_rate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Performance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.search_by_category.map((category, index) => {
                  const conversionRate = (category.conversions / category.searches) * 100;
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <div>
                          <p className="font-medium capitalize">{category.category}</p>
                          <p className="text-sm text-muted-foreground">
                            Category searches and performance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Searches</p>
                          <p className="font-medium">{category.searches.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Conversions</p>
                          <p className="font-medium">{category.conversions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Rate</p>
                          <p className={`font-medium ${
                            conversionRate >= 15 ? 'text-green-600' :
                            conversionRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {conversionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}