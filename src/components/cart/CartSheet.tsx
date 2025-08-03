import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { CartItemCard } from './CartItemCard';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { KCTMenswearAPI } from '@/lib/supabase';
import { toast } from 'sonner';

interface CartSheetProps {
  children: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
  const { items, loading, clearCart, getCartTotal, getItemCount } = useCart();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      const cartItems = items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        stripe_price_id: item.variant?.stripe_price_id,
        quantity: item.quantity,
        customization: item.customizations
      }));

      const checkoutData = await KCTMenswearAPI.createCheckout(cartItems, {
        success_url: `${window.location.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}`,
        customer_email: user?.email
      });

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {getItemCount() > 0 && (
              <Badge variant="secondary">{getItemCount()}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {getItemCount() === 0 
              ? "Your cart is empty"
              : `${getItemCount()} item${getItemCount() === 1 ? '' : 's'} in your cart`
            }
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some items to get started
              </p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={loading || items.length === 0}
                >
                  Proceed to Checkout
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearCart}
                  disabled={loading || items.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}