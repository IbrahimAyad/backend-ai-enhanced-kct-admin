import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '@/components/ProductGrid';
import { UserMenu } from '@/components/auth/UserMenu';
import { CartSheet } from '@/components/cart/CartSheet';
import { WishlistSheet } from '@/components/wishlist/WishlistSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Shirt, Package, Zap, Heart, Crown, BarChart3 } from 'lucide-react';
import { KCTMenswearAPI, type Product } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { addItem, getItemCount } = useCart();
  const { toast } = useToast();

  const categories = [
    { id: 'all', name: 'All Products', icon: Package },
    { id: 'suits', name: 'Suits', icon: Shirt },
    { id: 'shirts', name: 'Shirts', icon: Shirt },
    { id: 'ties', name: 'Ties', icon: Shirt },
    { id: 'accessories', name: 'Accessories', icon: Package },
  ];

  const handleAddToCart = async (product: Product, variant?: any) => {
    try {
      await addItem(
        product.id,
        variant?.id,
        1,
        variant?.attributes || {}
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const syncProducts = async () => {
    try {
      toast({
        title: "Syncing Products",
        description: "Syncing products from Stripe...",
      });

      const result = await KCTMenswearAPI.syncStripeProducts();
      
      toast({
        title: "Sync Complete",
        description: `Synced ${result.synced_products} products from Stripe.`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync products.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold">KCT Menswear</h1>
                <Badge variant="secondary">MVP</Badge>
              </div>
              
              {/* Main Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Shop
                </Link>
                <Link to="/weddings" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                  <Crown className="h-4 w-4" />
                  Weddings
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={syncProducts}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Sync Stripe
              </Button>
              
              <WishlistSheet>
                <Button variant="outline" size="sm" className="relative">
                  <Heart className="h-4 w-4" />
                </Button>
              </WishlistSheet>
              
              <CartSheet>
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingBag className="h-4 w-4" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                      {getItemCount()}
                    </span>
                  )}
                </Button>
              </CartSheet>
              
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {category.name}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Cart Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Cart ({getItemCount()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getItemCount() === 0 ? (
                  <p className="text-muted-foreground text-sm">Your cart is empty</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      {getItemCount()} item{getItemCount() === 1 ? '' : 's'} in cart
                    </p>
                    <CartSheet>
                      <Button className="w-full" size="sm">
                        View Cart
                      </Button>
                    </CartSheet>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="core">Core (Stripe)</TabsTrigger>
                <TabsTrigger value="catalog">Catalog</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <ProductGrid
                  category={activeCategory === 'all' ? undefined : activeCategory}
                  productType="all"
                  onAddToCart={handleAddToCart}
                />
              </TabsContent>

              <TabsContent value="core">
                <ProductGrid
                  category={activeCategory === 'all' ? undefined : activeCategory}
                  productType="core"
                  onAddToCart={handleAddToCart}
                />
              </TabsContent>

              <TabsContent value="catalog">
                <ProductGrid
                  category={activeCategory === 'all' ? undefined : activeCategory}
                  productType="catalog"
                  onAddToCart={handleAddToCart}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
