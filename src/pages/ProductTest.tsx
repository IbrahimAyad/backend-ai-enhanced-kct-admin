import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { fetchProductsWithImages } from '@/lib/shared/supabase-products';

export default function ProductTest() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [schemaStatus, setSchemaStatus] = useState<any>({});
  const { toast } = useToast();

  const checkSchema = async () => {
    setLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Check if required columns exist
      const { data: columns, error: columnsError } = await supabase.rpc('get_table_columns', {
        table_name: 'products'
      }).catch(() => ({ data: null, error: 'RPC function not found' }));

      // Try direct query if RPC doesn't exist
      let productColumns: string[] = [];
      if (columnsError || !columns) {
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .limit(1);
        
        if (products && products.length > 0) {
          productColumns = Object.keys(products[0]);
        }
      } else {
        productColumns = columns || [];
      }

      const requiredColumns = [
        'id', 'name', 'sku', 'category', 'base_price', 'status',
        'price_range', 'total_inventory', 'primary_image', 
        'variant_count', 'in_stock', 'image_gallery'
      ];

      const status = {
        products: {
          exists: productColumns.length > 0,
          columns: requiredColumns.reduce((acc, col) => {
            acc[col] = productColumns.includes(col);
            return acc;
          }, {} as Record<string, boolean>)
        }
      };

      setSchemaStatus(status);

      // Load products using shared service
      const productsResult = await fetchProductsWithImages({ limit: 10 });
      
      if (!productsResult.success) {
        throw new Error(productsResult.error || 'Failed to fetch products');
      }
      
      const productsData = productsResult.data;
      setProducts(productsData || []);

      toast({
        title: "Schema Check Complete",
        description: `Found ${productsData?.length || 0} products`
      });
    } catch (error) {
      console.error('Error checking schema:', error);
      toast({
        title: "Error",
        description: "Failed to check schema",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSchema();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Product Schema Test</h1>
          <Button onClick={checkSchema} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schema Status</CardTitle>
          </CardHeader>
          <CardContent>
            {schemaStatus.products && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(schemaStatus.products.exists)}
                  <span className="font-semibold">Products Table</span>
                </div>
                
                {schemaStatus.products.exists && (
                  <div className="ml-6 space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Required Columns:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(schemaStatus.products.columns).map(([col, exists]) => (
                        <div key={col} className="flex items-center gap-2 text-sm">
                          {getStatusIcon(exists as boolean)}
                          <span className={exists ? '' : 'text-red-600'}>{col}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium">{product.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Base Price:</span>
                      <p className="font-medium">${product.base_price}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Variants:</span>
                      <p className="font-medium">{product.variant_count || product.product_variants?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Stock:</span>
                      <p className="font-medium">{product.total_inventory || 0}</p>
                    </div>
                  </div>

                  {product.product_variants && product.product_variants.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Variants:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.product_variants.map((variant: any) => (
                          <Badge key={variant.id} variant="outline" className="text-xs">
                            {variant.sku} - Stock: {variant.stock_quantity || 0}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No products found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Run <code className="bg-muted px-1 py-0.5 rounded">fix-product-schema.sql</code> in Supabase SQL Editor to add missing columns</p>
              <p>2. The ProductManagement component will then work with real data</p>
              <p>3. Make sure to add some sample variants with stock quantities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}