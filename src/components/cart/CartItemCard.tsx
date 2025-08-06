import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { CartItemDB } from '@/lib/supabase';
import { Minus, Plus, X } from 'lucide-react';
import { getProductImageUrl } from '@/lib/shared/supabase-products';

interface CartItemCardProps {
  item: CartItemDB;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateItem, removeItem } = useCart();

  const price = item.variant?.price || item.product?.base_price || 0;
  const total = price * item.quantity;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(item.id);
    } else {
      updateItem(item.id, newQuantity);
    }
  };

  const getProductImage = () => {
    if (item.product) {
      return getProductImageUrl(item.product);
    }
    return '/placeholder.svg';
  };

  const getVariantAttributes = () => {
    if (!item.variant?.attributes) return null;
    
    return Object.entries(item.variant.attributes).map(([key, value]) => (
      <Badge key={key} variant="secondary" className="text-xs">
        {key}: {value}
      </Badge>
    ));
  };

  return (
    <div className="flex gap-4 py-4">
      <div className="flex-shrink-0">
        <img
          src={getProductImage()}
          alt={item.product?.name || 'Product'}
          className="w-16 h-16 object-cover rounded-md"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-2">
              {item.product?.name || 'Unknown Product'}
            </h4>
            
            {getVariantAttributes() && (
              <div className="flex flex-wrap gap-1 mt-1">
                {getVariantAttributes()}
              </div>
            )}

            {item.customizations && Object.keys(item.customizations).length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">Customizations:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(item.customizations).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right">
                <p className="font-medium text-sm">{formatPrice(total)}</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(price)} each
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 ml-2"
            onClick={() => removeItem(item.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}