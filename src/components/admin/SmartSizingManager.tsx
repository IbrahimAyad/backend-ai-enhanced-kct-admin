import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Eye } from 'lucide-react';
import { 
  getSizeTemplate, 
  generateVariantsFromTemplate, 
  fetchProductsWithImages,
  SizeTemplate 
} from '@/lib/shared/supabase-products';

export default function SmartSizingManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sizeTemplate, setSizeTemplate] = useState<SizeTemplate | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [variantResults, setVariantResults] = useState<any>(null);

  const categories = [
    { value: 'suits', label: 'Suits' },
    { value: 'blazers', label: 'Blazers' },
    { value: 'dress_shirts', label: 'Dress Shirts' },
    { value: 'sweaters', label: 'Sweaters' },
    { value: 'dress_shoes', label: 'Dress Shoes' },
    { value: 'ties', label: 'Ties' }
  ];

  // Load size template when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadSizeTemplate(selectedCategory);
    }
  }, [selectedCategory]);

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
  }, []);

  const loadSizeTemplate = async (category: string) => {
    setLoading(true);
    try {
      const result = await getSizeTemplate(category);
      if (result.success) {
        setSizeTemplate(result.data);
      } else {
        console.error('Failed to load size template:', result.error);
      }
    } catch (error) {
      console.error('Error loading size template:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await fetchProductsWithImages({ limit: 50 });
      if (result.success) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const generateVariants = async () => {
    if (!selectedProduct || !selectedCategory) return;

    setGeneratingVariants(true);
    setVariantResults(null);

    try {
      const result = await generateVariantsFromTemplate(selectedProduct, selectedCategory);
      setVariantResults(result);
      
      if (result.success) {
        alert(`Successfully generated ${result.data?.length || 0} variants!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating variants:', error);
      alert('Failed to generate variants');
    } finally {
      setGeneratingVariants(false);
    }
  };

  const renderSizePreview = () => {
    if (!sizeTemplate) return null;

    const sizes = sizeTemplate.sizes;
    
    return (
      <div className="space-y-4">
        <h4 className="font-medium">Size Preview for {sizeTemplate.template_name}</h4>
        
        {selectedCategory === 'suits' && (
          <div className="space-y-2">
            {['short', 'regular', 'long'].map(length => {
              if (!sizes[length]) return null;
              return (
                <div key={length} className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="w-20">{length.toUpperCase()}</Badge>
                  {sizes[length].map((size: string) => (
                    <Badge key={size} variant="secondary">{size}</Badge>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {selectedCategory === 'blazers' && sizes.regular && (
          <div className="flex flex-wrap gap-2">
            {sizes.regular.map((size: string) => (
              <Badge key={size} variant="secondary">{size}</Badge>
            ))}
          </div>
        )}

        {selectedCategory === 'dress_shirts' && (
          <div className="space-y-2">
            <div>
              <strong>Neck Sizes:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {sizes.neck_sizes?.map((size: string) => (
                  <Badge key={size} variant="secondary">{size}"</Badge>
                ))}
              </div>
            </div>
            <div>
              <strong>Sleeve Lengths:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {sizes.sleeve_lengths?.map((length: string) => (
                  <Badge key={length} variant="secondary">{length}</Badge>
                ))}
              </div>
            </div>
            <div>
              <strong>Fit Types:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {sizes.fit_types?.map((fit: string) => (
                  <Badge key={fit} variant="secondary">{fit}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedCategory === 'sweaters' && sizes.sizes && (
          <div className="flex flex-wrap gap-2">
            {sizes.sizes.map((size: string) => (
              <Badge key={size} variant="secondary">{size}</Badge>
            ))}
          </div>
        )}

        {selectedCategory === 'dress_shoes' && (
          <div className="space-y-2">
            <div>
              <strong>Whole Sizes:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {sizes.whole_sizes?.map((size: number) => (
                  <Badge key={size} variant="secondary">{size}</Badge>
                ))}
              </div>
            </div>
            {sizes.half_sizes_available && (
              <div>
                <Badge variant="outline">Half sizes available</Badge>
              </div>
            )}
          </div>
        )}

        {selectedCategory === 'ties' && (
          <div className="space-y-2">
            <div>
              <strong>Styles:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {sizes.styles?.map((style: string) => (
                  <Badge key={style} variant="secondary">{style}</Badge>
                ))}
              </div>
            </div>
            {sizes.one_size_fits_most && (
              <Badge variant="outline">One size fits most</Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Smart Sizing Manager</h2>
        <p className="text-muted-foreground">
          Manage size templates and generate product variants automatically
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Size Template Viewer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Size Templates
            </CardTitle>
            <CardDescription>
              View available size templates by category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading template...</span>
              </div>
            )}

            {sizeTemplate && !loading && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  {renderSizePreview()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Display Type: <Badge variant="outline">{sizeTemplate.display_type}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variant Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Variants
            </CardTitle>
            <CardDescription>
              Auto-generate size variants for products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && selectedProduct && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h5 className="font-medium mb-2">Generation Preview</h5>
                <p className="text-sm text-muted-foreground">
                  This will generate variants based on the <strong>{selectedCategory}</strong> template.
                </p>
                {sizeTemplate && (
                  <div className="mt-2">
                    <Badge variant="outline">
                      {selectedCategory === 'suits' && 
                        `${(sizeTemplate.sizes.short?.length || 0) + 
                           (sizeTemplate.sizes.regular?.length || 0) + 
                           (sizeTemplate.sizes.long?.length || 0)} variants`
                      }
                      {selectedCategory === 'blazers' && 
                        `${sizeTemplate.sizes.regular?.length || 0} variants`
                      }
                      {selectedCategory === 'dress_shirts' && 
                        `${(sizeTemplate.sizes.neck_sizes?.length || 0) * 
                           (sizeTemplate.sizes.sleeve_lengths?.length || 0) * 
                           (sizeTemplate.sizes.fit_types?.length || 0)} variants`
                      }
                      {selectedCategory === 'sweaters' && 
                        `${sizeTemplate.sizes.sizes?.length || 0} variants`
                      }
                      {selectedCategory === 'dress_shoes' && 
                        `${((sizeTemplate.sizes.whole_sizes?.length || 0) * 
                           (sizeTemplate.sizes.half_sizes_available ? 2 : 1))} variants`
                      }
                      {selectedCategory === 'ties' && 
                        `${sizeTemplate.sizes.styles?.length || 1} variants`
                      }
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={generateVariants}
              disabled={!selectedProduct || !selectedCategory || generatingVariants}
              className="w-full"
            >
              {generatingVariants ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Variants'
              )}
            </Button>

            {variantResults && (
              <div className={`p-4 border rounded-lg ${
                variantResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`font-medium ${
                  variantResults.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {variantResults.success 
                    ? `✓ Generated ${variantResults.data?.length || 0} variants`
                    : `✗ Error: ${variantResults.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}