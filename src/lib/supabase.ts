import { createClient } from '@supabase/supabase-js';

// Get environment variables - Vite uses import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our database
export interface Product {
  id: string;
  stripe_product_id?: string;
  product_type: 'core' | 'catalog';
  sku: string;
  name: string;
  description?: string;
  category: string;
  base_price: number;
  images: string[];
  is_bundleable: boolean;
  status: 'active' | 'inactive' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  price_range?: { min: number; max: number };
  total_inventory?: number;
  primary_image?: string;
  variant_count?: number;
  in_stock?: boolean;
  variants?: ProductVariant[];
  product_images?: ProductImage[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  stripe_price_id?: string;
  attributes: Record<string, any>;
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  available_quantity?: number;
  reserved_quantity?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id?: string;
  r2_key: string;
  r2_url: string;
  image_type: 'primary' | 'gallery' | 'thumbnail' | 'detail';
  sort_order: number;
  alt_text?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  auth_user_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  customer_id?: string;
  guest_email?: string;
  items: any[];
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  customer?: Customer;
  totals?: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  tracking?: {
    status: string;
    created_at: string;
    updated_at: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  sku: string;
  name: string;
  attributes?: Record<string, any>;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  customization?: Record<string, any>;
}

export interface CartItem {
  product_id?: string;
  variant_id?: string;
  stripe_price_id?: string;
  quantity: number;
  customization?: Record<string, any>;
}

// Auth and User Types
export interface UserProfile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  onboarding_completed: boolean;
  measurements: Record<string, any>;
  style_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CartItemDB {
  id: string;
  user_id?: string;
  session_id?: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  customizations?: Record<string, any>;
  saved_for_later: boolean;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  notify_on_sale: boolean;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  name: string;
  items: any[];
  occasion?: string;
  is_public: boolean;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  email_marketing: boolean;
  order_updates: boolean;
  style_tips: boolean;
}

export interface Wedding {
  id: string;
  wedding_code: string;
  couple_names: string;
  event_date: string;
  venue_name?: string;
  party_size: number;
  color_scheme: {
    primary: string;
    accent?: string;
  };
  coordinator_email: string;
  coordinator_phone?: string;
  discount_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  measurements: Record<string, any>;
  measurement_status: string;
  assigned_outfit: Record<string, any>;
  outfit_status: string;
  order_id?: string;
  created_at: string;
  updated_at: string;
}

// API Functions
export class KCTMenswearAPI {
  static async getProducts(filters?: {
    category?: string;
    product_type?: 'core' | 'catalog' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const { data, error } = await supabase.functions.invoke('get-products', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) throw error;
    return data;
  }

  static async createCheckout(items: CartItem[], options?: {
    success_url?: string;
    cancel_url?: string;
    customer_email?: string;
  }) {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { items, ...options },
    });

    if (error) throw error;
    return data;
  }

  static async getOrder(identifier: {
    id?: string;
    order_number?: string;
    session_id?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(identifier).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });

    const { data, error } = await supabase.functions.invoke('get-order', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) throw error;
    return data;
  }

  static async syncStripeProducts() {
    const { data, error } = await supabase.functions.invoke('sync-stripe-products', {
      method: 'POST',
    });

    if (error) throw error;
    return data;
  }

  // Direct database queries for authenticated users
  static async getUserOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        customers (*)
      `)
      .eq('customers.auth_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getInventoryStatus(variantId: string) {
    const { data, error } = await supabase
      .rpc('get_available_inventory', { variant_uuid: variantId });

    if (error) throw error;
    return data;
  }

  // Authentication Methods
  static async signUp(email: string, password: string, userData?: Partial<UserProfile>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {}
      }
    });

    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
    return data;
  }

  // User Profile Methods
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateMeasurements(userId: string, measurements: Record<string, any>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ measurements })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Cart Methods
  static async getCart(userId?: string, sessionId?: string) {
    const { data, error } = await supabase.rpc('get_cart_items', {
      p_user_id: userId || null,
      p_session_id: sessionId || null
    });

    if (error) throw error;
    return data || [];
  }

  static async addToCart(item: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    customizations?: Record<string, any>;
    user_id?: string;
    session_id?: string;
  }) {
    const { data, error } = await supabase.rpc('add_to_cart', {
      p_product_id: item.product_id,
      p_variant_id: item.variant_id || null,
      p_quantity: item.quantity,
      p_customizations: item.customizations || {},
      p_user_id: item.user_id || null,
      p_session_id: item.session_id || null
    });

    if (error) throw error;
    return data?.[0] || data;
  }

  static async updateCartItem(itemId: string, updates: { quantity?: number; customizations?: Record<string, any> }) {
    const { data, error } = await supabase.rpc('update_cart_item', {
      p_item_id: itemId,
      p_quantity: updates.quantity || null,
      p_customizations: updates.customizations || null
    });

    if (error) throw error;
    return data?.[0] || data;
  }

  static async removeFromCart(itemId: string) {
    const { data, error } = await supabase.rpc('remove_cart_item', {
      p_item_id: itemId
    });

    if (error) throw error;
    return data;
  }

  static async clearCart(userId?: string, sessionId?: string) {
    const { data, error } = await supabase.rpc('clear_cart', {
      p_user_id: userId || null,
      p_session_id: sessionId || null
    });

    if (error) throw error;
    return data;
  }

  static async transferGuestCart(sessionId: string, userId: string) {
    const { data, error } = await supabase.rpc('transfer_guest_cart', {
      p_session_id: sessionId,
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  }

  // Wishlist Methods
  static async getWishlist(userId: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        product:products(*),
        variant:product_variants(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addToWishlist(userId: string, productId: string, variantId?: string) {
    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        product_id: productId,
        variant_id: variantId
      })
      .select(`
        *,
        product:products(*),
        variant:product_variants(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async removeFromWishlist(userId: string, productId: string, variantId?: string) {
    let query = supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  // Saved Outfits Methods
  static async getSavedOutfits(userId: string) {
    const { data, error } = await supabase
      .from('saved_outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async saveOutfit(userId: string, outfit: {
    name: string;
    items: any[];
    occasion?: string;
    is_public?: boolean;
  }) {
    const { data, error } = await supabase
      .from('saved_outfits')
      .insert({
        user_id: userId,
        ...outfit
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteOutfit(outfitId: string) {
    const { error } = await supabase
      .from('saved_outfits')
      .delete()
      .eq('id', outfitId);

    if (error) throw error;
  }

  // User Preferences
  static async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Guest to Account Conversion
  static async claimGuestOrder(orderId: string, claimToken: string, userId: string) {
    const { data, error } = await supabase
      .from('order_claims')
      .update({ claimed_by: userId })
      .eq('order_id', orderId)
      .eq('claim_token', claimToken)
      .gt('expires_at', new Date().toISOString())
      .select()
      .single();

    return data;
  }

  // Wedding Management Methods
  static async createWedding(wedding: {
    couple_names: string;
    event_date: string;
    venue_name?: string;
    party_size: number;
    color_scheme: { primary: string; accent?: string };
    coordinator_email: string;
    coordinator_phone?: string;
  }) {
    // Generate unique 6-character wedding code
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    let wedding_code = generateCode();
    
    // Ensure code is unique
    let codeExists = true;
    while (codeExists) {
      const { data } = await supabase
        .from('weddings')
        .select('id')
        .eq('wedding_code', wedding_code)
        .single();
      
      if (!data) codeExists = false;
      else wedding_code = generateCode();
    }

    // Calculate discount based on party size
    const discount_percentage = wedding.party_size >= 10 ? 20 : 
                               wedding.party_size >= 7 ? 15 : 
                               wedding.party_size >= 5 ? 10 : 5;

    const { data, error } = await supabase
      .from('weddings')
      .insert({
        ...wedding,
        wedding_code,
        discount_percentage,
        status: 'planning'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWeddingByCode(code: string) {
    const { data, error } = await supabase
      .from('weddings')
      .select(`
        *,
        wedding_members(*)
      `)
      .eq('wedding_code', code.toUpperCase())
      .single();

    if (error) throw error;
    return data;
  }

  static async addWeddingMember(weddingId: string, member: {
    role: string;
    name: string;
    email?: string;
    phone?: string;
  }) {
    const { data, error } = await supabase
      .from('wedding_members')
      .insert({
        wedding_id: weddingId,
        ...member
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWeddingMemberMeasurements(memberId: string, measurements: Record<string, any>) {
    const { data, error } = await supabase
      .from('wedding_members')
      .update({
        measurements,
        measurement_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWeddingMembers(weddingId: string) {
    const { data, error } = await supabase
      .from('wedding_members')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getUserWeddings(userEmail: string) {
    const { data, error } = await supabase
      .from('weddings')
      .select(`
        *,
        wedding_members!inner(*)
      `)
      .or(`coordinator_email.eq.${userEmail},wedding_members.email.eq.${userEmail}`);

    if (error) throw error;
    return data;
  }

  // Admin Methods
  static async getAllWeddings() {
    const { data, error } = await supabase
      .from('weddings')
      .select(`
        *,
        wedding_members(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getWeddingStatistics() {
    const { data: weddings, error } = await supabase
      .from('weddings')
      .select('*');

    if (error) throw error;

    const { data: members, error: membersError } = await supabase
      .from('wedding_members')
      .select('*');

    if (membersError) throw membersError;

    return {
      totalWeddings: weddings?.length || 0,
      totalMembers: members?.length || 0,
      upcomingWeddings: weddings?.filter(w => new Date(w.event_date) > new Date()).length || 0,
      completedMeasurements: members?.filter(m => m.measurement_status === 'complete').length || 0
    };
  }
}