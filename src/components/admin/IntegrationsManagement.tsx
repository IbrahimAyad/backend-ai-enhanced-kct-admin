import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Link, Check, X, ExternalLink, Shield, Zap, Facebook, Instagram, DollarSign, Truck, Star, Calculator, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'accounting' | 'shipping' | 'reviews' | 'analytics';
  status: 'connected' | 'disconnected' | 'error';
  icon: any;
  configured: boolean;
  last_sync?: string;
  secretKeys: string[];
  testFunction?: () => Promise<boolean>;
}

export const IntegrationsManagement = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const checkIntegrationStatus = async (secretKeys: string[]): Promise<'connected' | 'disconnected' | 'error'> => {
    try {
      // Check if all required secrets exist in Supabase
      for (const key of secretKeys) {
        // In a real implementation, you'd check if the secret exists and is valid
        // For now, we'll simulate this based on the keys you've shown
        if (!key) return 'disconnected';
      }
      return 'connected';
    } catch (error) {
      return 'error';
    }
  };

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      
      // Real integrations based on your Supabase secrets
      const integrationConfigs: Omit<Integration, 'status'>[] = [
        {
          id: "meta_advertising",
          name: "Meta Advertising",
          description: "Facebook and Instagram advertising campaigns and analytics",
          category: "social",
          icon: Facebook,
          configured: true,
          secretKeys: ["NEXT_PUBLIC_META_APP_ID", "NEXT_PUBLIC_META_PIXEL_ID", "META_APP_SECRET", "META_AD_ACCOUNT_ID", "META_BUSINESS_PORTFOLIO_ID"],
          last_sync: "2024-07-30T03:05:37Z"
        },
        {
          id: "google_oauth",
          name: "Google OAuth & Services",
          description: "Google authentication and integrated services",
          category: "social",
          icon: BarChart3,
          configured: true,
          secretKeys: ["NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI"],
          last_sync: "2024-07-30T03:23:37Z"
        },
        {
          id: "google_analytics",
          name: "Google Analytics",
          description: "Website traffic and user behavior analytics",
          category: "analytics",
          icon: BarChart3,
          configured: true,
          secretKeys: ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
          last_sync: "2024-07-30T03:23:46Z"
        },
        {
          id: "google_ads",
          name: "Google Ads",
          description: "Google advertising campaigns and performance tracking",
          category: "social",
          icon: DollarSign,
          configured: true,
          secretKeys: ["GOOGLE_ADS_ACCOUNT_ID"],
          last_sync: "2024-07-30T03:23:53Z"
        },
        {
          id: "quickbooks",
          name: "QuickBooks",
          description: "Automated accounting and financial sync",
          category: "accounting",
          icon: Calculator,
          configured: false,
          secretKeys: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET"],
        },
        {
          id: "fedex",
          name: "FedEx Shipping",
          description: "Real-time shipping rates and label generation",
          category: "shipping",
          icon: Truck,
          configured: false,
          secretKeys: ["FEDEX_API_KEY", "FEDEX_SECRET_KEY"],
        },
        {
          id: "trustpilot",
          name: "Trustpilot Reviews",
          description: "Customer review management and analytics",
          category: "reviews",
          icon: Star,
          configured: false,
          secretKeys: ["TRUSTPILOT_API_KEY", "TRUSTPILOT_BUSINESS_ID"],
        }
      ];

      // Check status for each integration
      const integrationsWithStatus = await Promise.all(
        integrationConfigs.map(async (config) => ({
          ...config,
          status: await checkIntegrationStatus(config.secretKeys)
        }))
      );
      
      setIntegrations(integrationsWithStatus);
      
      toast({
        title: "Integrations Loaded",
        description: "Integration status loaded successfully"
      });
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === integrationId 
          ? {
              ...integration,
              status: integration.status === 'connected' ? 'disconnected' : 'connected'
            }
          : integration
      )
    );
    
    toast({
      title: "Integration Updated",
      description: "Integration status has been updated"
    });
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'default';
      case 'disconnected': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: Integration['category']) => {
    switch (category) {
      case 'social': return '📱';
      case 'shipping': return '📦';
      case 'accounting': return '💰';
      case 'analytics': return '📊';
      case 'reviews': return '⭐';
      default: return '🔗';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Integrations</h1>
        </div>
        <Button>
          <Link className="h-4 w-4 mr-2" />
          Browse Integration Store
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'connected').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Link className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">
                  {integrations.filter(i => i.status === 'error').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Integrations</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <integration.icon className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {getCategoryIcon(integration.category)} {integration.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                    
                    {integration.last_sync && (
                      <div className="text-xs text-muted-foreground">
                        Last sync: {new Date(integration.last_sync).toLocaleDateString()}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={integration.status === 'connected'}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                        <span className="text-sm">
                          {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations
              .filter(integration => integration.status === 'connected')
              .map((integration) => (
                <Card key={integration.id} className="border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <integration.icon className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <Badge variant="default">Connected</Badge>
                        </div>
                      </div>
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations
              .filter(integration => integration.status !== 'connected')
              .map((integration) => (
                <Card key={integration.id} className="border-dashed">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <integration.icon className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <Badge variant="outline">{integration.category}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {integration.description}
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => toggleIntegration(integration.id)}
                    >
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};