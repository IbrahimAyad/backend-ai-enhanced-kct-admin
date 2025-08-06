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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Upload,
  Download,
  Package,
  Eye,
  Copy,
  MoreHorizontal,
  AlertTriangle,
  Image,
  Palette,
  Ruler,
  Shirt,
  DollarSign,
  Globe,
  Tag,
  X,
  GripVertical
} from 'lucide-react';
import { KCTMenswearAPI, Product } from '@/lib/supabase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchProductsWithImages, getProductImageUrl, supabase as sharedSupabase } from '@/lib/shared/supabase-products';

interface ProductFormData {
  // Basic Info
  sku: string;
  name: string;
  description: string;
  category: string;
  product_type: 'core' | 'catalog';
  base_price: number;
  stripe_product_id?: string;
  status: 'active' | 'inactive' | 'archived';
  is_bundleable: boolean;
  
  // Images
  images: ProductImage[];
  
  // Colors & Sizes
  available_colors: string[];
  variants: ProductVariant[];
  
  // Materials & Attributes
  materials: string;
  care_instructions: string;
  fit_type: string;
  occasion: string;
  features: string[];
  
  // SEO
  meta_title: string;
  meta_description: string;
  url_slug: string;
}

interface ProductVariant {
  size: string;
  color: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

interface ProductImage {
  url: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
}

const categories = [
  'Suits & Blazers',
  'Shirts & Tops',
  'Trousers & Pants',
  'Accessories',
  'Footwear',
  'Formal Wear',
  'Casual Wear'
];

const productTypes = [
  '3-piece-suit',
  '2-piece-suit',
  'blazer',
  'dress-shirt',
  'casual-shirt',
  'trousers',
  'vest',
  'tie',
  'pocket-square',
  'cufflinks',
  'shoes'
];

const availableColors = [
  'Navy', 'Black', 'Charcoal', 'Grey', 'Brown', 'White', 'Blue', 
  'Burgundy', 'Green', 'Beige', 'Tan', 'Cream', 'Silver'
];

const fitTypes = [
  'Slim Fit', 'Classic Fit', 'Regular Fit', 'Tailored Fit', 'Modern Fit'
];

const occasions = [
  'Business', 'Formal', 'Wedding', 'Casual', 'Evening', 'Special Events'
];

const commonFeatures = [
  'Wrinkle Resistant', 'Moisture Wicking', 'Stretch Fabric', 'Easy Care',
  'Breathable', 'Stain Resistant', 'Non-Iron', 'Quick Dry'
];

export const ProductManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    category: '',
    product_type: 'catalog',
    base_price: 0,
    stripe_product_id: '',
    status: 'active',
    is_bundleable: true,
    images: [],
    available_colors: [],
    variants: [],
    materials: '',
    care_instructions: '',
    fit_type: '',
    occasion: '',
    features: [],
    meta_title: '',
    meta_description: '',
    url_slug: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading products...');
      
      // Use shared service for fetching products
      const result = await fetchProductsWithImages({ limit: 10 });
      const { data, error } = result.success 
        ? { data: result.data, error: null } 
        : { data: null, error: new Error(result.error || 'Failed to fetch products') };

      console.log('📊 Products query result:', { data, error });

      if (error) {
        console.error('❌ Products table error:', error);
        setProducts([]);
        toast({
          title: "Database Setup Required",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Products loaded successfully:', data?.length || 0, 'items');
      setProducts(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No Products Found",
          description: "Products table is empty. Add some products to get started!",
        });
      }
      
    } catch (error) {
      console.error('💥 Error loading products:', error);
      setProducts([]);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'feature' | 'unfeature') => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to perform bulk actions",
        variant: "destructive"
      });
      return;
    }

    try {
      // Implement bulk actions
      // Use shared supabase instance
      
      switch (action) {
        case 'activate':
          await sharedSupabase
            .from('products')
            .update({ status: 'active' })
            .in('id', selectedProducts);
          break;
        case 'deactivate':
          await sharedSupabase
            .from('products')
            .update({ status: 'inactive' })
            .in('id', selectedProducts);
          break;
        case 'feature':
          await sharedSupabase
            .from('products')
            .update({ is_bundleable: true })
            .in('id', selectedProducts);
          break;
        case 'unfeature':
          await sharedSupabase
            .from('products')
            .update({ is_bundleable: false })
            .in('id', selectedProducts);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
            await sharedSupabase
              .from('products')
              .delete()
              .in('id', selectedProducts);
          } else {
            return;
          }
          break;
      }

      toast({
        title: "Success",
        description: `Bulk action ${action} completed for ${selectedProducts.length} products`
      });

      loadProducts();
      setSelectedProducts([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      // Use shared supabase instance
      
      const { data, error } = await sharedSupabase
        .from('products')
        .insert({
          sku: formData.sku || `SKU-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          product_type: formData.product_type,
          base_price: formData.base_price,
          status: formData.status,
          primary_image: formData.images.length > 0 ? formData.images[0].url : null,
          image_gallery: formData.images.map(img => img.url)
        })
        .select()
        .single();

      if (error) throw error;

      // Add variants and images if any
      if (formData.variants.length > 0) {
        await sharedSupabase
          .from('product_variants')
          .insert(
            formData.variants.map(variant => ({
              product_id: data.id,
              ...variant
            }))
          );
      }

      // Note: Images are now stored in primary_image and image_gallery columns
      // The product_images table insertion is commented out until table structure is confirmed

      toast({
        title: "Success",
        description: "Product added successfully"
      });

      setShowAddDialog(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      // Use shared supabase instance
      
      const { error } = await sharedSupabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          product_type: formData.product_type,
          base_price: formData.base_price,
          status: formData.status,
          primary_image: formData.images.length > 0 ? formData.images[0].url : null,
          image_gallery: formData.images.map(img => img.url)
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully"
      });

      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      // Use shared supabase instance
      
      const { error } = await sharedSupabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Size templates for different product types
  const generateSizeTemplate = (productType: string) => {
    const templates: Record<string, ProductVariant[]> = {
      '3-piece-suit': generateSuitSizes(true),
      '2-piece-suit': generateSuitSizes(false),
      'blazer': generateBlazerSizes(),
      'dress-shirt': generateDressShirtSizes()
    };
    
    return templates[productType] || [];
  };

  const generateSuitSizes = (isThreePiece: boolean): ProductVariant[] => {
    const jacketSizes = [34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54];
    const lengths = ['S', 'R', 'L'];
    const variants: ProductVariant[] = [];

    jacketSizes.forEach(size => {
      lengths.forEach(length => {
        // Check availability based on length restrictions
        if (length === 'S' && size > 50) return;
        if (length === 'L' && size < 38) return;

        const jacketSize = `${size}${length}`;
        const pantSize = `${size - 6}W`; // 6 drop for pants
        
        // Jacket variant
        variants.push({
          size: jacketSize,
          color: 'Navy', // Default color
          sku: `JACKET-${jacketSize}-NAV`,
          price: formData.base_price,
          stock_quantity: 0
        });

        // Pants variant
        variants.push({
          size: `${jacketSize} + ${pantSize}`,
          color: 'Navy',
          sku: `PANTS-${pantSize}-NAV`,
          price: 0, // Usually included with jacket
          stock_quantity: 0
        });

        // Vest variant for 3-piece suits
        if (isThreePiece) {
          variants.push({
            size: jacketSize,
            color: 'Navy',
            sku: `VEST-${jacketSize}-NAV`,
            price: 0, // Usually included
            stock_quantity: 0
          });
        }
      });
    });

    return variants;
  };

  const generateBlazerSizes = (): ProductVariant[] => {
    const jacketSizes = [34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54];
    const lengths = ['S', 'R', 'L'];
    const variants: ProductVariant[] = [];

    jacketSizes.forEach(size => {
      lengths.forEach(length => {
        // Check availability based on length restrictions
        if (length === 'S' && size > 50) return;
        if (length === 'L' && size < 38) return;

        const blazerSize = `${size}${length}`;
        
        variants.push({
          size: blazerSize,
          color: 'Navy', // Default color
          sku: `BLAZER-${blazerSize}-NAV`,
          price: formData.base_price,
          stock_quantity: 0
        });
      });
    });

    return variants;
  };

  const generateDressShirtSizes = (): ProductVariant[] => {
    const variants: ProductVariant[] = [];
    
    // Slim Fit Sizes
    const slimFitSizes = [
      { neck: '15"', size: 'S' },
      { neck: '15.5"', size: 'M' },
      { neck: '16"', size: 'L' },
      { neck: '16.5"', size: 'XL' },
      { neck: '17"', size: 'XXL' }
    ];

    slimFitSizes.forEach(({ neck, size }) => {
      variants.push({
        size: `${neck} Slim ${size}`,
        color: 'White', // Default color
        sku: `SHIRT-SLIM-${neck.replace('"', '')}-WHT`,
        price: formData.base_price,
        stock_quantity: 0
      });
    });

    // Classic Fit Sizes
    const classicFitNecks = ['15"', '15.5"', '16"', '16.5"', '17"', '17.5"', '18"', '18.5"', '19"', '19.5"', '20"', '22"'];
    const sleeveLengths = ['32-33', '34-35', '36-37'];

    classicFitNecks.forEach(neck => {
      sleeveLengths.forEach(sleeve => {
        variants.push({
          size: `${neck} ${sleeve} Classic`,
          color: 'White',
          sku: `SHIRT-CLASSIC-${neck.replace('"', '')}-${sleeve.replace('-', '')}-WHT`,
          price: formData.base_price,
          stock_quantity: 0
        });
      });
    });

    return variants;
  };

  const handleApplySizeTemplate = () => {
    const templateVariants = generateSizeTemplate(formData.product_type);
    setFormData(prev => ({
      ...prev,
      variants: templateVariants
    }));
    
    toast({
      title: "Size Template Applied",
      description: `Added ${templateVariants.length} size variants for ${formData.product_type}`
    });
  };

  // Generate variants from colors and sizes
  const generateVariants = () => {
    if (formData.available_colors.length === 0) return;
    
    const variants: ProductVariant[] = [];
    formData.available_colors.forEach(color => {
      formData.variants.forEach(variant => {
        variants.push({
          ...variant,
          color,
          sku: `${formData.sku}-${variant.size.replace(/\s+/g, '')}-${color.substring(0, 3).toUpperCase()}`,
          price: formData.base_price
        });
      });
    });
    
    setFormData(prev => ({ ...prev, variants }));
    toast({
      title: "Variants Generated",
      description: `Created ${variants.length} variants from color and size combinations`
    });
  };

  // Auto-generate URL slug from product name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle color selection
  const handleColorChange = (color: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      available_colors: checked 
        ? [...prev.available_colors, color]
        : prev.available_colors.filter(c => c !== color)
    }));
  };

  // Handle features selection
  const handleFeatureChange = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, feature]
        : prev.features.filter(f => f !== feature)
    }));
  };

  // Bulk edit variant prices
  const bulkEditVariantPrices = (newPrice: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant => ({
        ...variant,
        price: newPrice
      }))
    }));
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      product_type: 'catalog',
      base_price: 0,
      stripe_product_id: '',
      status: 'active',
      is_bundleable: true,
      images: [],
      available_colors: [],
      variants: [],
      materials: '',
      care_instructions: '',
      fit_type: '',
      occasion: '',
      features: [],
      meta_title: '',
      meta_description: '',
      url_slug: ''
    });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name,
      description: product.description || '',
      category: product.category,
      product_type: product.product_type,
      base_price: product.base_price,
      stripe_product_id: product.stripe_product_id || '',
      status: product.status,
      is_bundleable: product.is_bundleable,
      images: [],
      available_colors: [],
      variants: [],
      materials: '',
      care_instructions: '',
      fit_type: '',
      occasion: '',
      features: [],
      meta_title: '',
      meta_description: '',
      url_slug: ''
    });
    setShowAddDialog(true);
  };

  const ProductForm = () => (
    <Tabs defaultValue="basic" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="basic" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Basic
        </TabsTrigger>
        <TabsTrigger value="images" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Images
        </TabsTrigger>
        <TabsTrigger value="variants" className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Variants
        </TabsTrigger>
        <TabsTrigger value="attributes" className="flex items-center gap-2">
          <Shirt className="h-4 w-4" />
          Details
        </TabsTrigger>
        <TabsTrigger value="seo" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          SEO
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </TabsTrigger>
      </TabsList>

      {/* Basic Information Tab */}
      <TabsContent value="basic" className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="Enter unique SKU"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData(prev => ({ 
                  ...prev, 
                  name,
                  meta_title: prev.meta_title || name,
                  url_slug: prev.url_slug || generateSlug(name)
                }));
              }}
              placeholder="Enter product name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_type">Product Type *</Label>
            <Select
              value={formData.product_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, product_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price ($) *</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              value={formData.base_price}
              onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stripe_product_id">Stripe Product ID</Label>
            <Input
              id="stripe_product_id"
              value={formData.stripe_product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, stripe_product_id: e.target.value }))}
              placeholder="prod_1234567890"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter detailed product description"
            rows={4}
          />
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_bundleable"
              checked={formData.is_bundleable}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bundleable: checked as boolean }))}
            />
            <Label htmlFor="is_bundleable">Bundleable</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive' | 'archived') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      {/* Images Tab */}
      <TabsContent value="images" className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Product Images</h3>
              <p className="text-sm text-muted-foreground">Upload and manage product images</p>
            </div>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Images
            </Button>
          </div>
          
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Drag & drop images here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <Button variant="outline" className="mt-4">Choose Files</Button>
          </div>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={image.url} 
                    alt={image.alt_text}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Badge 
                    variant={image.is_primary ? "default" : "secondary"}
                    className="absolute bottom-2 left-2"
                  >
                    {image.is_primary ? "Primary" : `${image.display_order}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Variants Tab */}
      <TabsContent value="variants" className="space-y-6">
        <div className="space-y-6">
          {/* Color Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Available Colors</h3>
                <p className="text-sm text-muted-foreground">Select colors available for this product</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {availableColors.map(color => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={formData.available_colors.includes(color)}
                    onCheckedChange={(checked) => handleColorChange(color, checked as boolean)}
                  />
                  <Label htmlFor={`color-${color}`} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border ${color === 'White' ? 'border-gray-300' : 'border-gray-200'}`} 
                         style={{backgroundColor: color.toLowerCase()}} />
                    <span>{color}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Size Templates */}
          {['3-piece-suit', '2-piece-suit', 'blazer', 'dress-shirt'].includes(formData.product_type) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Size Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Apply pre-configured sizes for {formData.product_type.replace('-', ' ')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplySizeTemplate}
                  disabled={!formData.base_price}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Apply Size Template
                </Button>
              </div>
            </div>
          )}

          {/* Variant Generation */}
          {formData.available_colors.length > 0 && formData.variants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Generate Variants</h3>
                  <p className="text-sm text-muted-foreground">Create variants from color × size combinations</p>
                </div>
                <Button variant="outline" onClick={generateVariants}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Generate All Variants
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Edit Prices */}
          {formData.variants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-medium">Bulk Edit Prices</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="New price"
                    className="w-32"
                    onChange={(e) => {
                      const price = parseFloat(e.target.value);
                      if (!isNaN(price)) {
                        bulkEditVariantPrices(price);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Apply to all variants</span>
                </div>
              </div>
            </div>
          )}

          {/* Variants List */}
          {formData.variants.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Generated Variants ({formData.variants.length})</h4>
              <div className="max-h-64 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.variants.map((variant, index) => (
                      <TableRow key={index}>
                        <TableCell>{variant.size}</TableCell>
                        <TableCell>{variant.color}</TableCell>
                        <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                        <TableCell>${variant.price}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={variant.stock_quantity}
                            onChange={(e) => {
                              const stock = parseInt(e.target.value) || 0;
                              setFormData(prev => ({
                                ...prev,
                                variants: prev.variants.map((v, i) => 
                                  i === index ? { ...v, stock_quantity: stock } : v
                                )
                              }));
                            }}
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, variants: [] }))}
              >
                Clear All Variants
              </Button>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Details Tab */}
      <TabsContent value="attributes" className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materials">Materials & Fabric</Label>
              <Textarea
                id="materials"
                value={formData.materials}
                onChange={(e) => setFormData(prev => ({ ...prev, materials: e.target.value }))}
                placeholder="e.g., 100% Wool, Super 120s"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="care_instructions">Care Instructions</Label>
              <Textarea
                id="care_instructions"
                value={formData.care_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, care_instructions: e.target.value }))}
                placeholder="e.g., Dry clean only"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fit_type">Fit Type</Label>
              <Select
                value={formData.fit_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fit_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fit type" />
                </SelectTrigger>
                <SelectContent>
                  {fitTypes.map(fit => (
                    <SelectItem key={fit} value={fit}>{fit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select
                value={formData.occasion}
                onValueChange={(value) => setFormData(prev => ({ ...prev, occasion: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  {occasions.map(occasion => (
                    <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="grid grid-cols-2 gap-2">
                {commonFeatures.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`feature-${feature}`}
                      checked={formData.features.includes(feature)}
                      onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                    />
                    <Label htmlFor={`feature-${feature}`} className="text-sm">{feature}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* SEO Tab */}
      <TabsContent value="seo" className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Meta Title (0-60 characters)</Label>
            <Input
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
              placeholder="SEO optimized title"
              maxLength={60}
            />
            <div className="text-xs text-muted-foreground">
              {formData.meta_title.length}/60 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Meta Description (0-160 characters)</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
              placeholder="Brief description for search engines"
              maxLength={160}
              rows={3}
            />
            <div className="text-xs text-muted-foreground">
              {formData.meta_description.length}/160 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_slug">URL Slug</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">/products/</span>
              <Input
                id="url_slug"
                value={formData.url_slug}
                onChange={(e) => setFormData(prev => ({ ...prev, url_slug: e.target.value }))}
                placeholder="product-url-slug"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, url_slug: generateSlug(formData.name) }))}
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Preview Tab */}
      <TabsContent value="preview" className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Product Preview</h3>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold">{formData.name || 'Product Name'}</h4>
                  <Badge variant="outline">{formData.category}</Badge>
                  <p className="text-2xl font-bold">${formData.base_price}</p>
                </div>
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>

              <p className="text-muted-foreground">{formData.description || 'Product description will appear here'}</p>

              {formData.available_colors.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Colors:</Label>
                  <div className="flex gap-2">
                    {formData.available_colors.map(color => (
                      <div key={color} className="flex items-center space-x-1">
                        <div className={`w-4 h-4 rounded-full border`} 
                             style={{backgroundColor: color.toLowerCase()}} />
                        <span className="text-sm">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.features.length > 0 && (
                <div className="space-y-2">
                  <Label>Features:</Label>
                  <div className="flex flex-wrap gap-1">
                    {formData.features.map(feature => (
                      <Badge key={feature} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.variants.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Sizes:</Label>
                  <div className="text-sm text-muted-foreground">
                    {formData.variants.length} variants available
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </TabsContent>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingProduct(null); resetForm(); }}>
          Cancel
        </Button>
        <Button onClick={editingProduct ? handleEditProduct : handleAddProduct}>
          {editingProduct ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </Tabs>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Product Management</h2>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingProduct(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <ProductForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">{selectedProducts.length} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                  Deactivate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('feature')}>
                  Feature
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('unfeature')}>
                  Unfeature
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.description?.slice(0, 60)}...</p>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.product_type}</Badge>
                  </TableCell>
                  <TableCell>${product.base_price}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={product.status === 'active' ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                      {product.is_bundleable && (
                        <Badge variant="outline">Bundleable</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {(product as any).total_inventory || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bundleable Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.is_bundleable).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {products.filter(p => (p as any).total_inventory < 5).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};