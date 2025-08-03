import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Bundle {
  id: string;
  name: string;
  description: string;
  bundle_type: string;
  required_categories: string[];
  min_items: number;
  max_items: number;
  discount_type: string;
  discount_value: number;
  discount_tiers?: any[];
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
}

interface BundleAnalytics {
  bundle_id: string;
  views: number;
  customizations: number;
  cart_adds: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}

export function BundleManagement() {
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [analytics, setAnalytics] = useState<BundleAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bundle_type: 'complete_outfit',
    required_categories: [],
    min_items: 2,
    max_items: 10,
    discount_type: 'percentage',
    discount_value: 0,
    discount_tiers: [],
    is_active: true,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: ''
  });

  useEffect(() => {
    loadBundles();
    loadBundleAnalytics();
  }, []);

  const loadBundles = async () => {
    try {
      // Load bundles from Supabase
      const { data: bundlesData, error } = await supabase
        .from('bundles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bundles:', error);
        // Fall back to mock data if no bundles exist
        const mockBundles = [
          {
            id: '1',
            name: 'Complete Wedding Look',
            description: 'Everything needed for the perfect wedding day',
            bundle_type: 'wedding_party',
            required_categories: ['suits', 'shirts', 'ties', 'shoes'],
            min_items: 4,
            max_items: 10,
            discount_type: 'percentage',
            discount_value: 15,
            is_active: true,
            valid_from: '2024-01-01',
            valid_until: '2024-12-31'
          },
          {
            id: '2',
            name: 'Business Professional',
            description: 'Sharp looks for the office',
            bundle_type: 'complete_outfit',
            required_categories: ['suits', 'shirts'],
            min_items: 2,
            max_items: 6,
            discount_type: 'tiered',
            discount_value: 0,
            discount_tiers: [
              { min_items: 2, discount: 8 },
              { min_items: 4, discount: 12 },
              { min_items: 6, discount: 18 }
            ],
            is_active: true,
            valid_from: '2024-01-01'
          }
        ];
        setBundles(mockBundles);
        return;
      }

      setBundles(bundlesData || []);
    } catch (error) {
      console.error('Error loading bundles:', error);
      toast({
        title: "Error",
        description: "Failed to load bundles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBundleAnalytics = async () => {
    try {
      // Get bundle analytics from Supabase
      const { data: analyticsData, error } = await supabase
        .from('bundle_analytics')
        .select('*');

      if (error) {
        console.error('Error loading bundle analytics:', error);
        // Fall back to mock data
        const mockAnalytics = [
          {
            bundle_id: '1',
            views: 1250,
            customizations: 890,
            cart_adds: 456,
            purchases: 123,
            revenue: 18450,
            conversion_rate: 9.8
          },
          {
            bundle_id: '2',
            views: 2100,
            customizations: 1560,
            cart_adds: 780,
            purchases: 234,
            revenue: 28900,
            conversion_rate: 11.1
          }
        ];
        setAnalytics(mockAnalytics);
        return;
      }

      // Transform the data to calculate conversion rates
      const processedAnalytics = analyticsData?.map(item => ({
        ...item,
        conversion_rate: item.views > 0 ? (item.purchases / item.views) * 100 : 0
      })) || [];

      setAnalytics(processedAnalytics);
    } catch (error) {
      console.error('Error loading bundle analytics:', error);
    }
  };

  const handleCreateBundle = async () => {
    try {
      // Validate form
      if (!formData.name || !formData.description) {
        toast({
          title: "Validation Error",
          description: "Name and description are required",
          variant: "destructive"
        });
        return;
      }

      // Create bundle in Supabase
      const { data, error } = await supabase
        .from('bundles')
        .insert([{
          name: formData.name,
          description: formData.description,
          bundle_type: formData.bundle_type,
          required_categories: formData.required_categories,
          min_items: formData.min_items,
          max_items: formData.max_items,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          discount_tiers: formData.discount_tiers,
          is_active: formData.is_active,
          valid_from: formData.valid_from,
          valid_until: formData.valid_until || null
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setBundles(prev => [...prev, data]);
      setCreateDialogOpen(false);
      resetForm();

      toast({
        title: "Success",
        description: "Bundle created successfully"
      });
    } catch (error) {
      console.error('Error creating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to create bundle",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBundle = async () => {
    try {
      if (!editingBundle) return;

      // Mock update - replace with actual API call
      setBundles(prev => prev.map(bundle => 
        bundle.id === editingBundle.id 
          ? { ...formData, id: editingBundle.id } as Bundle
          : bundle
      ));

      setEditingBundle(null);
      resetForm();

      toast({
        title: "Success",
        description: "Bundle updated successfully"
      });
    } catch (error) {
      console.error('Error updating bundle:', error);
      toast({
        title: "Error",
        description: "Failed to update bundle",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBundle = async (bundleId: string) => {
    try {
      setBundles(prev => prev.filter(bundle => bundle.id !== bundleId));
      toast({
        title: "Success",
        description: "Bundle deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting bundle:', error);
      toast({
        title: "Error",
        description: "Failed to delete bundle",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      bundle_type: 'complete_outfit',
      required_categories: [],
      min_items: 2,
      max_items: 10,
      discount_type: 'percentage',
      discount_value: 0,
      discount_tiers: [],
      is_active: true,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: ''
    });
  };

  const startEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description,
      bundle_type: bundle.bundle_type,
      required_categories: bundle.required_categories,
      min_items: bundle.min_items,
      max_items: bundle.max_items,
      discount_type: bundle.discount_type,
      discount_value: bundle.discount_value,
      discount_tiers: bundle.discount_tiers || [],
      is_active: bundle.is_active,
      valid_from: bundle.valid_from,
      valid_until: bundle.valid_until || ''
    });
  };

  const getBundleAnalytics = (bundleId: string) => {
    return analytics.find(a => a.bundle_id === bundleId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bundle Management</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Bundle</DialogTitle>
            </DialogHeader>
            <BundleForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateBundle}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="bundles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bundles" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bundles
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bundles" className="space-y-4">
          {bundles.map(bundle => {
            const bundleAnalytics = getBundleAnalytics(bundle.id);
            return (
              <Card key={bundle.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {bundle.name}
                        <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                          {bundle.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <p className="text-muted-foreground">{bundle.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(bundle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBundle(bundle.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Type</p>
                      <p className="text-muted-foreground capitalize">
                        {bundle.bundle_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Items Range</p>
                      <p className="text-muted-foreground">
                        {bundle.min_items} - {bundle.max_items} items
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Discount</p>
                      <p className="text-muted-foreground">
                        {bundle.discount_type === 'percentage' 
                          ? `${bundle.discount_value}%`
                          : 'Tiered pricing'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Categories</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bundle.required_categories.map(category => (
                          <Badge key={category} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {bundleAnalytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p className="text-lg font-bold">{bundleAnalytics.views}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Cart Adds</p>
                        <p className="text-lg font-bold">{bundleAnalytics.cart_adds}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Purchases</p>
                        <p className="text-lg font-bold">{bundleAnalytics.purchases}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-lg font-bold">{formatCurrency(bundleAnalytics.revenue)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Conversion</p>
                        <p className="text-lg font-bold">{bundleAnalytics.conversion_rate}%</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="analytics">
          {/* Bundle analytics charts would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Bundle Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed bundle analytics charts and reports would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingBundle} onOpenChange={() => setEditingBundle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
          </DialogHeader>
          <BundleForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateBundle}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BundleFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isEditing: boolean;
}

function BundleForm({ formData, setFormData, onSubmit, isEditing }: BundleFormProps) {
  const categories = ['suits', 'shirts', 'ties', 'shoes', 'accessories'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Bundle Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter bundle name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bundle_type">Bundle Type</Label>
          <Select 
            value={formData.bundle_type} 
            onValueChange={value => setFormData(prev => ({ ...prev, bundle_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete_outfit">Complete Outfit</SelectItem>
              <SelectItem value="wedding_party">Wedding Party</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter bundle description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_items">Min Items</Label>
          <Input
            id="min_items"
            type="number"
            value={formData.min_items}
            onChange={e => setFormData(prev => ({ ...prev, min_items: parseInt(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_items">Max Items</Label>
          <Input
            id="max_items"
            type="number"
            value={formData.max_items}
            onChange={e => setFormData(prev => ({ ...prev, max_items: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select 
            value={formData.discount_type} 
            onValueChange={value => setFormData(prev => ({ ...prev, discount_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="tiered">Tiered</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.discount_type === 'percentage' && (
          <div className="space-y-2">
            <Label htmlFor="discount_value">Discount Value (%)</Label>
            <Input
              id="discount_value"
              type="number"
              value={formData.discount_value}
              onChange={e => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) }))}
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEditing ? 'Update' : 'Create'} Bundle
        </Button>
      </div>
    </div>
  );
}