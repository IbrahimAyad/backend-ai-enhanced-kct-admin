import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KCTMenswearAPI, type Product } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { getProductImageUrl } from '@/lib/shared/supabase-products';

interface ProductGridProps {
  category?: string;
  productType?: 'core' | 'catalog' | 'all';
  onAddToCart?: (product: Product, variant?: any) => void;
}

export function ProductGrid({ category, productType = 'all', onAddToCart }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    has_more: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, [category, productType]);

  const loadProducts = async (offset = 0) => {
    try {
      setLoading(true);
      const response = await KCTMenswearAPI.getProducts({
        category,
        product_type: productType,
        limit: 20,
        offset,
      });

      if (offset === 0) {
        setProducts(response.products);
      } else {
        setProducts(prev => [...prev, ...response.products]);
      }
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const newOffset = pagination.offset + pagination.limit;
    loadProducts(newOffset);
  };

  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {pagination.total} products found
        </p>
        {category && (
          <Badge variant="secondary" className="capitalize">
            {category}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {pagination.has_more && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variant?: any) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariant);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const displayPrice = product.price_range 
    ? product.price_range.min === product.price_range.max
      ? formatPrice(product.price_range.min)
      : `${formatPrice(product.price_range.min)} - ${formatPrice(product.price_range.max)}`
    : formatPrice(product.base_price);

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-square bg-muted rounded-t-lg overflow-hidden relative">
          <img
            src={getProductImageUrl(product)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          
          {/* Wishlist button in top-right corner */}
          <div className="absolute top-2 right-2">
            <WishlistButton 
              productId={product.id}
              variantId={selectedVariant?.id}
              size="sm"
            />
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold line-clamp-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {product.category}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold">{displayPrice}</p>
            <div className="flex items-center gap-2">
              <Badge variant={product.product_type === 'core' ? 'default' : 'secondary'}>
                {product.product_type}
              </Badge>
              {!product.in_stock && (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          </div>

          {product.variants && product.variants.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Variants:</p>
              <div className="flex flex-wrap gap-1">
                {product.variants.slice(0, 3).map((variant) => (
                  <Badge
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {Object.values(variant.attributes).join(' ')}
                  </Badge>
                ))}
                {product.variants.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.variants.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={!product.in_stock}
          className="w-full"
        >
          {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
}