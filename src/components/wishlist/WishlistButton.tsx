import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { KCTMenswearAPI } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  variantId?: string;
  isInWishlist?: boolean;
  onWishlistChange?: (inWishlist: boolean) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function WishlistButton({ 
  productId, 
  variantId, 
  isInWishlist = false, 
  onWishlistChange,
  className,
  size = 'default'
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(isInWishlist);

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (inWishlist) {
        await KCTMenswearAPI.removeFromWishlist(user.id, productId, variantId);
        setInWishlist(false);
        onWishlistChange?.(false);
        toast({
          title: "Removed from wishlist",
          description: "Item removed from your wishlist.",
        });
      } else {
        await KCTMenswearAPI.addToWishlist(user.id, productId, variantId);
        setInWishlist(true);
        onWishlistChange?.(true);
        toast({
          title: "Added to wishlist",
          description: "Item added to your wishlist.",
        });
      }
    } catch (error: any) {
      console.error('Wishlist error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={inWishlist ? "default" : "outline"}
      size={size}
      onClick={handleToggleWishlist}
      disabled={loading}
      className={cn(
        "relative transition-colors",
        inWishlist && "bg-red-500 hover:bg-red-600 text-white border-red-500",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          inWishlist && "fill-current"
        )} 
      />
      <span className="sr-only">
        {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      </span>
    </Button>
  );
}