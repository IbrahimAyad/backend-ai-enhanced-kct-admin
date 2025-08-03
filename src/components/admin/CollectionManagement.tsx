import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye,
  TrendingUp,
  Package,
  Zap,
  BarChart3,
  Settings,
  Shuffle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SmartCollection {
  id: string;
  name: string;
  description?: string;
  collection_type: 'static' | 'dynamic' | 'ai_powered';
  visibility: 'public' | 'private' | 'featured';
  rules: Record<string, any>;
  display_order: number;
  auto_update: boolean;
  product_count: number;
  is_active: boolean;
  created_at: string;
}

interface CollectionFormData {
  name: string;
  description: string;
  collection_type: 'static' | 'dynamic' | 'ai_powered';
  visibility: 'public' | 'private' | 'featured';
  rules: {
    category?: string;
    tags?: string[];
    occasions?: string[];
    price_range?: { min: number; max: number };
    style_attributes?: Record<string, any>;
    trending_score?: { min: number };
    created_within_days?: number;
  };
  auto_update: boolean;
  display_order: number;
}

const collectionTypes = [
  { value: 'static', label: 'Static Collection', icon: Package, description: 'Manually curated products' },
  { value: 'dynamic', label: 'Smart Collection', icon: Zap, description: 'Auto-updates based on rules' },
  { value: 'ai_powered', label: 'AI Collection', icon: TrendingUp, description: 'AI-driven recommendations' }
];

const visibilityOptions = [
  { value: 'featured', label: 'Featured', description: 'Prominently displayed' },
  { value: 'public', label: 'Public', description: 'Visible to all customers' },
  { value: 'private', label: 'Private', description: 'Admin only' }
];

const occasionTags = ['prom', 'wedding', 'business', 'cocktail', 'black-tie', 'homecoming', 'graduation', 'holiday'];
const styleAttributes = {
  fit: ['classic', 'modern', 'slim', 'athletic', 'relaxed'],
  season: ['spring', 'summer', 'fall', 'winter', 'year-round'],
  formality: ['casual', 'business', 'formal', 'black-tie']
};

export const CollectionManagement = () => {
  const { toast } = useToast();
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<SmartCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<SmartCollection | null>(null);
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    collection_type: 'dynamic',
    visibility: 'public',
    rules: {},
    auto_update: true,
    display_order: 0
  });

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    filterCollections();
  }, [collections, searchTerm, typeFilter]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_collections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Collections table error:', error);
        // If table doesn't exist, show empty state
        setCollections([]);
        toast({
          title: "Database Setup Required", 
          description: "Please run the collections database schema first",
          variant: "destructive"
        });
        return;
      }

      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
      setCollections([]);
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCollections = () => {
    let filtered = collections;

    if (searchTerm) {
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(collection => collection.collection_type === typeFilter);
    }

    setFilteredCollections(filtered);
  };

  const handleCreateCollection = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_collections')
        .insert({
          name: formData.name,
          description: formData.description,
          collection_type: formData.collection_type,
          visibility: formData.visibility,
          rules: formData.rules,
          auto_update: formData.auto_update,
          display_order: formData.display_order || collections.length,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection created successfully"
      });

      setShowCreateDialog(false);
      resetForm();
      loadCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection) return;

    try {
      const { error } = await supabase
        .from('smart_collections')
        .update({
          name: formData.name,
          description: formData.description,
          collection_type: formData.collection_type,
          visibility: formData.visibility,
          rules: formData.rules,
          auto_update: formData.auto_update,
          display_order: formData.display_order
        })
        .eq('id', editingCollection.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection updated successfully"
      });

      setEditingCollection(null);
      resetForm();
      loadCollections();
    } catch (error) {
      console.error('Error updating collection:', error);
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const { error } = await supabase
        .from('smart_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection deleted successfully"
      });

      loadCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (collectionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('smart_collections')
        .update({ is_active: !isActive })
        .eq('id', collectionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Collection ${!isActive ? 'activated' : 'deactivated'} successfully`
      });

      loadCollections();
    } catch (error) {
      console.error('Error toggling collection status:', error);
      toast({
        title: "Error",
        description: "Failed to update collection status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      collection_type: 'dynamic',
      visibility: 'public',
      rules: {},
      auto_update: true,
      display_order: 0
    });
  };

  const openEditDialog = (collection: SmartCollection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      collection_type: collection.collection_type,
      visibility: collection.visibility,
      rules: collection.rules,
      auto_update: collection.auto_update,
      display_order: collection.display_order
    });
    setShowCreateDialog(true);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = collectionTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  const DynamicRulesForm = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Collection Rules</h4>
      
      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category Filter</Label>
        <Select
          value={formData.rules.category || ''}
          onValueChange={(value) => setFormData(prev => ({
            ...prev,
            rules: { ...prev.rules, category: value || undefined }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="Formal Wear">Formal Wear</SelectItem>
            <SelectItem value="Suits & Blazers">Suits & Blazers</SelectItem>
            <SelectItem value="Accessories">Accessories</SelectItem>
            <SelectItem value="Footwear">Footwear</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Occasion Tags */}
      <div className="space-y-2">
        <Label>Occasion Tags</Label>
        <div className="flex flex-wrap gap-2">
          {occasionTags.map(tag => (
            <Badge
              key={tag}
              variant={formData.rules.occasions?.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                const currentOccasions = formData.rules.occasions || [];
                const newOccasions = currentOccasions.includes(tag)
                  ? currentOccasions.filter(t => t !== tag)
                  : [...currentOccasions, tag];
                
                setFormData(prev => ({
                  ...prev,
                  rules: { ...prev.rules, occasions: newOccasions.length > 0 ? newOccasions : undefined }
                }));
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min price"
            value={formData.rules.price_range?.min || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              rules: {
                ...prev.rules,
                price_range: {
                  ...prev.rules.price_range,
                  min: parseFloat(e.target.value) || 0
                }
              }
            }))}
          />
          <Input
            type="number"
            placeholder="Max price"
            value={formData.rules.price_range?.max || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              rules: {
                ...prev.rules,
                price_range: {
                  ...prev.rules.price_range,
                  max: parseFloat(e.target.value) || 0
                }
              }
            }))}
          />
        </div>
      </div>

      {/* Trending Score (for AI collections) */}
      {formData.collection_type === 'ai_powered' && (
        <div className="space-y-2">
          <Label>Minimum Trending Score</Label>
          <Input
            type="number"
            placeholder="0-100"
            value={formData.rules.trending_score?.min || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              rules: {
                ...prev.rules,
                trending_score: { min: parseInt(e.target.value) || 0 }
              }
            }))}
          />
        </div>
      )}

      {/* New Arrivals Days */}
      <div className="space-y-2">
        <Label>Created Within Days (for New Arrivals)</Label>
        <Input
          type="number"
          placeholder="30"
          value={formData.rules.created_within_days || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            rules: {
              ...prev.rules,
              created_within_days: parseInt(e.target.value) || undefined
            }
          }))}
        />
      </div>
    </div>
  );

  const CollectionForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Collection Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter collection name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_order">Display Order</Label>
          <Input
            id="display_order"
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter collection description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Collection Type</Label>
          <Select
            value={formData.collection_type}
            onValueChange={(value: 'static' | 'dynamic' | 'ai_powered') => 
              setFormData(prev => ({ ...prev, collection_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {collectionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value: 'public' | 'private' | 'featured') => 
              setFormData(prev => ({ ...prev, visibility: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div>{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto_update"
          checked={formData.auto_update}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_update: checked }))}
        />
        <Label htmlFor="auto_update">Auto-update collection</Label>
      </div>

      {(formData.collection_type === 'dynamic' || formData.collection_type === 'ai_powered') && (
        <DynamicRulesForm />
      )}

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            setEditingCollection(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={editingCollection ? handleUpdateCollection : handleCreateCollection}>
          {editingCollection ? 'Update' : 'Create'} Collection
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Collections</h2>
          <p className="text-muted-foreground">
            Manage your product collections and smart filtering rules
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCollection(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </DialogTitle>
            </DialogHeader>
            <CollectionForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="static">Static Collections</SelectItem>
                <SelectItem value="dynamic">Smart Collections</SelectItem>
                <SelectItem value="ai_powered">AI Collections</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Collections ({filteredCollections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{collection.name}</div>
                      {collection.description && (
                        <div className="text-sm text-muted-foreground">
                          {collection.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      {getTypeIcon(collection.collection_type)}
                      {collection.collection_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={collection.visibility === 'featured' ? 'default' : 'outline'}>
                      {collection.visibility}
                    </Badge>
                  </TableCell>
                  <TableCell>{collection.product_count}</TableCell>
                  <TableCell>{collection.display_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={collection.is_active}
                      onCheckedChange={() => handleToggleStatus(collection.id, collection.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(collection)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};