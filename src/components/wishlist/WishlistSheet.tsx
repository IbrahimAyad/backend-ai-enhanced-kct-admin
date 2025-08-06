import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { KCTMenswearAPI, type WishlistItem } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { getProductImageUrl } from '@/lib/shared/supabase-products';

interface WishlistSheetProps {
  children: React.ReactNode;
}

export function WishlistSheet({ children }: WishlistSheetProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const items = await KCTMenswearAPI.getWishlist(user.id);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to load wishlist.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (item: WishlistItem) => {
    if (!user) return;

    try {
      await KCTMenswearAPI.removeFromWishlist(user.id, item.product_id, item.variant_id);
      setWishlistItems(prev => prev.filter(i => i.id !== item.id));
      toast({
        title: "Removed from wishlist",
        description: "Item removed from your wishlist.",
      });
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist.",
        variant: "destructive",
      });
    }
  };

  const moveToCart = async (item: WishlistItem) => {
    if (!user) return;

    try {
      await addItem(
        item.product_id,
        item.variant_id || undefined,
        1,
        {}
      );
      
      // Optionally remove from wishlist after adding to cart
      await removeFromWishlist(item);
      
      toast({
        title: "Added to cart",
        description: "Item moved from wishlist to cart.",
      });
    } catch (error: any) {
      console.error('Error moving to cart:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!user) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Wishlist
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in to see your wishlist</h3>
            <p className="text-muted-foreground">Save your favorite items for later</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Wishlist
            {wishlistItems.length > 0 && (
              <Badge variant="secondary">
                {wishlistItems.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 bg-muted rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground">Add items you love to save them for later</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wishlistItems.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                        {item.product && (
                          <img 
                            src={getProductImageUrl(item.product)}
                            alt={item.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.product?.name || 'Unknown Product'}
                        </h4>
                        
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.variant.price)}
                          </p>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => moveToCart(item)}
                            className="flex-1"
                          >
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Add to Cart
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromWishlist(item)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {index < wishlistItems.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}