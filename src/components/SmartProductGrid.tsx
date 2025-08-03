import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ProductGrid } from '@/components/ProductGrid';
import { useToast } from '@/hooks/use-toast';
import { 
  Filter, 
  Search, 
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Package,
  Star,
  Zap
} from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';

interface SmartCollection {
  id: string;
  name: string;
  description?: string;
  collection_type: 'static' | 'dynamic' | 'ai_powered';
  visibility: 'public' | 'private' | 'featured';
  rules: Record<string, any>;
  product_count: number;
  is_active: boolean;
}

interface FilterState {
  search: string;
  category: string;
  priceRange: [number, number];
  occasions: string[];
  colorFamily: string;
  productType: 'core' | 'catalog' | 'all';
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'newest' | 'trending';
}

const occasionOptions = [
  { value: 'prom', label: 'Prom', emoji: '🎩' },
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'business', label: 'Business', emoji: '💼' },
  { value: 'cocktail', label: 'Cocktail', emoji: '🍸' },
  { value: 'black-tie', label: 'Black Tie', emoji: '🎭' },
  { value: 'homecoming', label: 'Homecoming', emoji: '🏠' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'holiday', label: 'Holiday', emoji: '🎄' }
];

const colorFamilies = [
  { value: 'black', label: 'Black', color: '#000000' },
  { value: 'navy', label: 'Navy', color: '#1e3a8a' },
  { value: 'grey', label: 'Grey', color: '#6b7280' },
  { value: 'brown', label: 'Brown', color: '#92400e' },
  { value: 'burgundy', label: 'Burgundy', color: '#7c2d12' },
  { value: 'jewel-tone', label: 'Jewel Tones', color: '#059669' },
  { value: 'patterns', label: 'Patterns', color: '#8b5cf6' }
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' }
];

export const SmartProductGrid = () => {
  const { toast } = useToast();
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<SmartCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<SmartCollection | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    priceRange: [0, 2000],
    occasions: [],
    colorFamily: 'all',
    productType: 'all',
    sortBy: 'relevance'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('smart_collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const allCollections = data || [];
      setCollections(allCollections);
      setFeaturedCollections(allCollections.filter(c => c.visibility === 'featured'));
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: "Info",
        description: "Collections system is being set up. Using default categories for now.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSelect = (collection: SmartCollection) => {
    setActiveCollection(collection);
    
    // Apply collection rules to filters
    const newFilters: Partial<FilterState> = {};
    
    if (collection.rules.category) {
      newFilters.category = collection.rules.category;
    }
    
    if (collection.rules.occasions) {
      newFilters.occasions = collection.rules.occasions;
    }
    
    if (collection.rules.price_range) {
      newFilters.priceRange = [
        collection.rules.price_range.min || 0,
        collection.rules.price_range.max || 2000
      ];
    }

    if (collection.collection_type === 'ai_powered' && collection.rules.trending_score) {
      newFilters.sortBy = 'trending';
    }

    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActiveCollection(null); // Clear active collection when manually filtering
  }, []);

  const toggleOccasion = (occasion: string) => {
    const newOccasions = filters.occasions.includes(occasion)
      ? filters.occasions.filter(o => o !== occasion)
      : [...filters.occasions, occasion];
    handleFilterChange('occasions', newOccasions);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      priceRange: [0, 2000],
      occasions: [],
      colorFamily: 'all',
      productType: 'all',
      sortBy: 'relevance'
    });
    setActiveCollection(null);
  };

  const getCollectionIcon = (type: string) => {
    switch (type) {
      case 'ai_powered':
        return <Sparkles className="h-4 w-4" />;
      case 'dynamic':
        return <Zap className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Build product grid props based on current filters
  const getProductGridProps = () => {
    return {
      category: filters.category !== 'all' ? filters.category : undefined,
      productType: filters.productType
    };
  };

  return (
    <div className="space-y-6">
      {/* Featured Collections Header */}
      {!loading && featuredCollections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Featured Collections</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredCollections.slice(0, 4).map((collection) => (
              <Card 
                key={collection.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  activeCollection?.id === collection.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleCollectionSelect(collection)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getCollectionIcon(collection.collection_type)}
                    <h3 className="font-medium text-sm">{collection.name}</h3>
                  </div>
                  {collection.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {collection.description}
                    </p>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {collection.product_count} items
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Smart Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Smart Filters
              {activeCollection && (
                <Badge variant="default" className="ml-2">
                  {activeCollection.name}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Advanced
              </Button>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category */}
            <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Formal Wear">Formal Wear</SelectItem>
                <SelectItem value="Suits & Blazers">Suits & Blazers</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Footwear">Footwear</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Type */}
            <Select value={filters.productType} onValueChange={(value) => handleFilterChange('productType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="core">Core Products</SelectItem>
                <SelectItem value="catalog">Catalog Items</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => handleFilterChange('priceRange', value)}
                  max={2000}
                  min={0}
                  step={50}
                  className="w-full"
                />
              </div>

              {/* Occasions */}
              <div className="space-y-2">
                <Label>Occasions</Label>
                <div className="flex flex-wrap gap-2">
                  {occasionOptions.map(occasion => (
                    <Badge
                      key={occasion.value}
                      variant={filters.occasions.includes(occasion.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleOccasion(occasion.value)}
                    >
                      {occasion.emoji} {occasion.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Color Families */}
              <div className="space-y-2">
                <Label>Color Family</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={filters.colorFamily === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleFilterChange('colorFamily', 'all')}
                  >
                    All Colors
                  </Badge>
                  {colorFamilies.map(color => (
                    <Badge
                      key={color.value}
                      variant={filters.colorFamily === color.value ? 'default' : 'outline'}
                      className="cursor-pointer flex items-center gap-1"
                      onClick={() => handleFilterChange('colorFamily', color.value)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: color.color }}
                      />
                      {color.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Collections Tabs */}
      {!loading && collections.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" onClick={() => setActiveCollection(null)}>
              All Products
            </TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="dynamic">Smart Collections</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ProductGrid {...getProductGridProps()} />
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {featuredCollections.map((collection) => (
                <Card 
                  key={collection.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCollectionSelect(collection)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {getCollectionIcon(collection.collection_type)}
                      <h3 className="font-semibold">{collection.name}</h3>
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {collection.product_count} items
                      </Badge>
                      <Badge variant="outline">
                        {collection.collection_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {activeCollection && <ProductGrid {...getProductGridProps()} />}
          </TabsContent>

          <TabsContent value="dynamic" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.filter(c => c.collection_type === 'dynamic').map((collection) => (
                <Card 
                  key={collection.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleCollectionSelect(collection)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4" />
                      <h3 className="font-semibold">{collection.name}</h3>
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {collection.description}
                      </p>
                    )}
                    <Badge variant="secondary">
                      {collection.product_count} items
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <ProductGrid {...getProductGridProps()} />
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <ProductGrid {...getProductGridProps()} />
          </TabsContent>
        </Tabs>
      )}

      {/* Fallback to regular ProductGrid if collections aren't loaded */}
      {loading && (
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <ProductGrid productType="all" />
        </div>
      )}
    </div>
  );
};