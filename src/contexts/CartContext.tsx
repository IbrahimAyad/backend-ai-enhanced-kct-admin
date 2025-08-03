import React, { createContext, useContext, useEffect, useState } from 'react';
import { KCTMenswearAPI, CartItemDB } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItemDB[];
  loading: boolean;
  addItem: (productId: string, variantId?: string, quantity?: number, customizations?: Record<string, any>) => Promise<void>;
  updateItem: (itemId: string, quantity?: number, customizations?: Record<string, any>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getItemCount: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemDB[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate session ID for guest users
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('cart_session_id');
    if (stored) return stored;
    const newId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', newId);
    return newId;
  });

  useEffect(() => {
    loadCart();
  }, [user?.id]);

  useEffect(() => {
    // Transfer guest cart when user logs in
    if (user?.id && sessionId) {
      transferGuestCart();
    }
  }, [user?.id, sessionId]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const cartItems = await KCTMenswearAPI.getCart(user?.id, sessionId);
      setItems(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const transferGuestCart = async () => {
    try {
      await KCTMenswearAPI.transferGuestCart(sessionId, user!.id);
      await loadCart(); // Reload cart after transfer
    } catch (error) {
      console.error('Error transferring guest cart:', error);
    }
  };

  const addItem = async (
    productId: string,
    variantId?: string,
    quantity: number = 1,
    customizations?: Record<string, any>
  ) => {
    try {
      // Check if item already exists
      const existingItem = items.find(
        item => item.product_id === productId && 
                 (variantId ? item.variant_id === variantId : !item.variant_id)
      );

      if (existingItem) {
        // Update existing item
        await updateItem(existingItem.id, existingItem.quantity + quantity, customizations);
      } else {
        // Add new item
        await KCTMenswearAPI.addToCart({
          product_id: productId,
          variant_id: variantId,
          quantity,
          customizations,
          user_id: user?.id,
          session_id: user?.id ? undefined : sessionId
        });
        await loadCart();
        toast.success('Item added to cart');
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const updateItem = async (itemId: string, quantity?: number, customizations?: Record<string, any>) => {
    try {
      if (quantity === 0) {
        await removeItem(itemId);
        return;
      }

      await KCTMenswearAPI.updateCartItem(itemId, { quantity, customizations });
      await loadCart();
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update item');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await KCTMenswearAPI.removeFromCart(itemId);
      await loadCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing cart item:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await KCTMenswearAPI.clearCart(user?.id, sessionId);
      setItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const price = item.variant?.price || item.product?.base_price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const value = {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    getCartTotal,
    getItemCount,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}