import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Plus, 
  Edit, 
  Users, 
  Star, 
  Gift,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoyaltyTier {
  id: string;
  name: string;
  tier_level: number;
  threshold_amount: number;
  points_multiplier: number;
  benefits: any;
  tier_color: string;
  is_active: boolean;
}

interface CustomerLoyalty {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  current_tier: LoyaltyTier;
  points_balance: number;
  lifetime_spend: number;
  total_orders: number;
  referral_count: number;
  joined_program_at: string;
  last_activity: string;
}

export function LoyaltyManagement() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTierOpen, setCreateTierOpen] = useState(false);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockTiers = [
        {
          id: '1',
          name: 'Bronze',
          tier_level: 1,
          threshold_amount: 0,
          points_multiplier: 1.0,
          benefits: {
            early_access: false,
            free_shipping: false,
            birthday_discount: 5
          },
          tier_color: '#CD7F32',
          is_active: true
        },
        {
          id: '2',
          name: 'Silver',
          tier_level: 2,
          threshold_amount: 500,
          points_multiplier: 1.25,
          benefits: {
            early_access: true,
            free_shipping: true,
            birthday_discount: 10,
            exclusive_events: false
          },
          tier_color: '#C0C0C0',
          is_active: true
        },
        {
          id: '3',
          name: 'Gold',
          tier_level: 3,
          threshold_amount: 1500,
          points_multiplier: 1.5,
          benefits: {
            early_access: true,
            free_shipping: true,
            birthday_discount: 15,
            exclusive_events: true,
            personal_stylist: false
          },
          tier_color: '#FFD700',
          is_active: true
        },
        {
          id: '4',
          name: 'Platinum',
          tier_level: 4,
          threshold_amount: 5000,
          points_multiplier: 2.0,
          benefits: {
            early_access: true,
            free_shipping: true,
            birthday_discount: 20,
            exclusive_events: true,
            personal_stylist: true,
            concierge: true
          },
          tier_color: '#E5E4E2',
          is_active: true
        }
      ];

      const mockCustomers = [
        {
          id: '1',
          customer_id: 'user1',
          customer_email: 'john@example.com',
          customer_name: 'John Smith',
          current_tier: mockTiers[2], // Gold
          points_balance: 2450,
          lifetime_spend: 2340,
          total_orders: 8,
          referral_count: 3,
          joined_program_at: '2024-01-15',
          last_activity: '2024-01-25'
        },
        {
          id: '2',
          customer_id: 'user2',
          customer_email: 'mike@example.com',
          customer_name: 'Mike Johnson',
          current_tier: mockTiers[1], // Silver
          points_balance: 890,
          lifetime_spend: 780,
          total_orders: 3,
          referral_count: 1,
          joined_program_at: '2024-01-20',
          last_activity: '2024-01-28'
        }
      ];

      setTiers(mockTiers);
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const calculateProgress = (customer: CustomerLoyalty) => {
    const currentTier = customer.current_tier;
    const nextTier = tiers.find(t => t.tier_level === currentTier.tier_level + 1);
    
    if (!nextTier) return 100; // Already at highest tier
    
    const progress = (customer.lifetime_spend / nextTier.threshold_amount) * 100;
    return Math.min(progress, 100);
  };

  const getNextTier = (customer: CustomerLoyalty) => {
    return tiers.find(t => t.tier_level === customer.current_tier.tier_level + 1);
  };

  const getBenefitsList = (benefits: any) => {
    return Object.entries(benefits)
      .filter(([key, value]) => value !== false)
      .map(([key, value]) => {
        if (typeof value === 'boolean') return key.replace('_', ' ');
        return `${key.replace('_', ' ')}: ${value}${key.includes('discount') ? '%' : ''}`;
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loyalty Program Management</h2>
        <Dialog open={createTierOpen} onOpenChange={setCreateTierOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Loyalty Tier</DialogTitle>
            </DialogHeader>
            {/* Tier creation form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Tiers
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Loyalty Program Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold">{customers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Star className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Points</p>
                    <p className="text-2xl font-bold">
                      {customers.reduce((sum, c) => sum + c.points_balance, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Award className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Lifetime Value</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(customers.reduce((sum, c) => sum + c.lifetime_spend, 0) / customers.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Target className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Referrals</p>
                    <p className="text-2xl font-bold">
                      {customers.reduce((sum, c) => sum + c.referral_count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Member Distribution by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiers.map(tier => {
                  const tierCustomers = customers.filter(c => c.current_tier.id === tier.id);
                  const percentage = (tierCustomers.length / customers.length) * 100;
                  
                  return (
                    <div key={tier.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 w-32">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: tier.tier_color }}
                        />
                        <span className="font-medium">{tier.name}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-medium">{tierCustomers.length}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          {tiers.map(tier => (
            <Card key={tier.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: tier.tier_color }}
                    />
                    <div>
                      <CardTitle>{tier.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Level {tier.tier_level} • {formatCurrency(tier.threshold_amount)} threshold
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {tier.points_multiplier}x points
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Benefits:</p>
                  <div className="flex flex-wrap gap-2">
                    {getBenefitsList(tier.benefits).map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {customers.map(customer => {
            const progress = calculateProgress(customer);
            const nextTier = getNextTier(customer);
            
            return (
              <Card key={customer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {customer.customer_name}
                        <Badge 
                          style={{ 
                            backgroundColor: customer.current_tier.tier_color,
                            color: 'white'
                          }}
                        >
                          {customer.current_tier.name}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {customer.customer_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Points Balance</p>
                      <p className="text-lg font-bold">{customer.points_balance.toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium mb-2">Tier Progress</p>
                      {nextTier ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{customer.current_tier.name}</span>
                            <span>{nextTier.name}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(nextTier.threshold_amount - customer.lifetime_spend)} to next tier
                          </p>
                        </div>
                      ) : (
                        <Badge variant="outline">Highest Tier Achieved</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Lifetime Spend</p>
                        <p className="font-bold">{formatCurrency(customer.lifetime_spend)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="font-bold">{customer.total_orders}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Referrals</p>
                        <p className="font-bold">{customer.referral_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-bold">
                          {new Date(customer.joined_program_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Rewards & Incentives</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Rewards management interface would be displayed here, including:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground">
                <li>Point redemption options</li>
                <li>Special promotions for loyalty members</li>
                <li>Birthday rewards and anniversary bonuses</li>
                <li>Referral program management</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}