import { useEffect, useState } from 'react';
import { fetchProductsWithImages, getProductImageUrl } from '@/lib/shared/supabase-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestProductImages() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const result = await fetchProductsWithImages({ limit: 20 });
        if (result.success) {
          setProducts(result.data);
          console.log('Loaded products:', result.data);
        } else {
          setError(result.error || 'Failed to load products');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) return <div className="p-8">Loading products...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Product Images Test - Found {products.length} products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square bg-gray-100">
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${product.name}:`, e);
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
                onLoad={() => {
                  console.log(`Successfully loaded image for ${product.name}`);
                }}
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm">{product.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{product.category}</p>
              <p className="text-xs text-gray-500 mt-1">
                Images: {product.images?.length || 0}
                {product.images && product.images.length > 0 && (
                  <span className="block text-xs mt-1">
                    First image: {product.images[0].image_type} - {product.images[0].r2_url?.substring(0, 50)}...
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}