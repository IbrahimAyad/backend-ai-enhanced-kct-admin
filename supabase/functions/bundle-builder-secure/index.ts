import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from "../_shared/cors.ts";
import { sanitizeString, validateAmount } from "../_shared/validation.ts";
import { createRateLimitedEndpoint, createUserTieredLimits } from '../_shared/rate-limit-middleware.ts';
import { sanitizeErrorMessage } from "../_shared/webhook-security.ts";

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase configuration");
  throw new Error("Server configuration error");
}

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Valid values
const VALID_BUNDLE_TYPES = ['complete_outfit', 'seasonal', 'wedding_party', 'business_bundle', 'custom'];
const VALID_CATEGORIES = ['Suits', 'Shirts', 'Accessories', 'Shoes', 'Ties', 'Outerwear', 'Trousers'];
const VALID_OCCASIONS = ['wedding', 'business', 'casual', 'formal', 'party', 'date'];
const MAX_PRODUCTS_PER_BUNDLE = 10;
const MAX_SUGGESTIONS_LIMIT = 50;

interface CalculateRequest {
  product_ids: string[];
  bundle_type?: string;
}

interface SuggestionsRequest {
  selected_products: string[];
  target_category?: string;
  occasion?: string;
}

/**
 * Main bundle builder handler
 */
async function handleBundleBuilder(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    );

    // Get user if authenticated
    let user = null;
    if (authHeader) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // Handle calculate endpoint
    if (action === 'calculate' && req.method === 'POST') {
      let body: CalculateRequest;
      try {
        body = await req.json();
      } catch {
        throw new Error('Invalid JSON payload');
      }

      // Validate product_ids
      if (!body.product_ids || !Array.isArray(body.product_ids) || body.product_ids.length === 0) {
        throw new Error('Product IDs are required');
      }

      if (body.product_ids.length > MAX_PRODUCTS_PER_BUNDLE) {
        throw new Error(`Maximum ${MAX_PRODUCTS_PER_BUNDLE} products allowed per bundle`);
      }

      // Validate each product ID is a valid UUID
      const productIds = body.product_ids.map(id => {
        if (typeof id !== 'string' || !isValidUUID(id)) {
          throw new Error('Invalid product ID format');
        }
        return id;
      });

      // Validate bundle_type
      let bundleType = 'complete_outfit';
      if (body.bundle_type) {
        const sanitizedType = sanitizeString(body.bundle_type, 50).toLowerCase();
        if (VALID_BUNDLE_TYPES.includes(sanitizedType)) {
          bundleType = sanitizedType;
        } else {
          throw new Error('Invalid bundle type');
        }
      }

      // Get products with validation
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id, name, category, base_price,
          product_variants!inner(id, price, attributes)
        `)
        .in('id', productIds)
        .eq('status', 'active');

      if (productsError || !products) {
        throw new Error('Failed to fetch products');
      }

      if (products.length !== productIds.length) {
        throw new Error('Some products not found or inactive');
      }

      // Get applicable bundles
      const { data: bundles, error: bundlesError } = await supabase
        .from('bundles')
        .select('*')
        .eq('is_active', true)
        .or(`bundle_type.eq.${bundleType},bundle_type.eq.custom`);

      if (bundlesError) {
        throw new Error('Failed to fetch bundle configurations');
      }

      const calculation = calculateBundleDiscount(products, bundles || []);

      // Validate calculated amounts
      const totalValidation = validateAmount(calculation.final_total, { min: 0, max: 10000 });
      if (!totalValidation.isValid) {
        throw new Error('Invalid total amount calculated');
      }

      // Track analytics if user is logged in
      if (user) {
        const sessionId = req.headers.get('x-session-id');
        if (sessionId && isValidUUID(sessionId)) {
          await supabase.from('bundle_analytics').insert({
            customer_id: user.id,
            session_id: sessionId,
            items_selected: productIds,
            total_original_price: calculation.original_total,
            discount_applied: calculation.discount_amount,
            final_price: calculation.final_total,
            conversion_step: 'calculated'
          });
        }
      }

      return new Response(
        JSON.stringify(calculation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle suggestions endpoint
    if (action === 'suggestions' && req.method === 'POST') {
      let body: SuggestionsRequest;
      try {
        body = await req.json();
      } catch {
        throw new Error('Invalid JSON payload');
      }

      // Validate selected_products
      if (!body.selected_products || !Array.isArray(body.selected_products)) {
        throw new Error('Selected products are required');
      }

      const selectedProducts = body.selected_products
        .slice(0, MAX_PRODUCTS_PER_BUNDLE)
        .map(id => {
          if (typeof id !== 'string' || !isValidUUID(id)) {
            throw new Error('Invalid product ID format');
          }
          return id;
        });

      // Validate target_category
      let targetCategory: string | undefined;
      if (body.target_category) {
        const sanitizedCategory = sanitizeString(body.target_category, 50);
        if (VALID_CATEGORIES.includes(sanitizedCategory)) {
          targetCategory = sanitizedCategory;
        } else {
          throw new Error('Invalid target category');
        }
      }

      // Validate occasion
      let occasion: string | undefined;
      if (body.occasion) {
        const sanitizedOccasion = sanitizeString(body.occasion, 50).toLowerCase();
        if (VALID_OCCASIONS.includes(sanitizedOccasion)) {
          occasion = sanitizedOccasion;
        } else {
          throw new Error('Invalid occasion');
        }
      }

      // Get complementary products
      const suggestions = await getComplementaryProducts(
        supabase, 
        selectedProducts, 
        targetCategory, 
        occasion
      );

      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle popular combinations endpoint
    if (action === 'popular-combinations' && req.method === 'GET') {
      const limitParam = url.searchParams.get('limit');
      let limit = 10;
      
      if (limitParam) {
        const parsedLimit = parseInt(limitParam);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_SUGGESTIONS_LIMIT) {
          throw new Error('Invalid limit parameter');
        }
        limit = parsedLimit;
      }

      const { data: combinations, error } = await supabase
        .from('outfit_combinations')
        .select('*')
        .eq('is_active', true)
        .order('purchase_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error('Failed to fetch popular combinations');
      }

      // Sanitize response data
      const sanitizedCombinations = (combinations || []).map(combo => ({
        id: combo.id,
        name: sanitizeString(combo.name || '', 100),
        description: sanitizeString(combo.description || '', 500),
        product_ids: Array.isArray(combo.product_ids) ? combo.product_ids.filter(isValidUUID) : [],
        bundle_type: combo.bundle_type,
        discount_percentage: parseFloat(combo.discount_percentage) || 0,
        purchase_count: parseInt(combo.purchase_count) || 0,
        created_at: combo.created_at
      }));

      return new Response(
        JSON.stringify({ 
          combinations: sanitizedCombinations,
          total: sanitizedCombinations.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Error in bundle-builder:', error);
    
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes('Invalid') ? 400 :
                      error.message?.includes('Rate limit') ? 429 : 500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function calculateBundleDiscount(products: any[], bundles: any[]) {
  // Calculate original total with validation
  const originalTotal = products.reduce((sum, product) => {
    const prices = product.product_variants
      .map((v: any) => parseFloat(v.price))
      .filter((p: number) => !isNaN(p) && p >= 0);
    
    if (prices.length === 0) return sum;
    
    const lowestPrice = Math.min(...prices);
    return sum + lowestPrice;
  }, 0);

  if (originalTotal <= 0) {
    return {
      original_total: 0,
      discount_percentage: 0,
      discount_amount: 0,
      final_total: 0,
      applied_bundle: null,
      savings: 0,
      items_count: products.length
    };
  }

  let bestDiscount = 0;
  let appliedBundle = null;

  // Find best applicable bundle
  for (const bundle of bundles) {
    try {
      const discount = calculateDiscountForBundle(products, bundle);
      if (discount > bestDiscount) {
        bestDiscount = discount;
        appliedBundle = bundle;
      }
    } catch (error) {
      console.error('Error calculating bundle discount:', error);
      continue;
    }
  }

  // Apply discount with validation
  bestDiscount = Math.min(100, Math.max(0, bestDiscount)); // Ensure 0-100%
  const discountAmount = (originalTotal * bestDiscount) / 100;
  const finalTotal = Math.max(0, originalTotal - discountAmount);

  return {
    original_total: Math.round(originalTotal * 100) / 100,
    discount_percentage: bestDiscount,
    discount_amount: Math.round(discountAmount * 100) / 100,
    final_total: Math.round(finalTotal * 100) / 100,
    applied_bundle: appliedBundle ? {
      id: appliedBundle.id,
      name: sanitizeString(appliedBundle.name || '', 100),
      bundle_type: appliedBundle.bundle_type
    } : null,
    savings: Math.round(discountAmount * 100) / 100,
    items_count: products.length
  };
}

function calculateDiscountForBundle(products: any[], bundle: any): number {
  const productCount = products.length;

  // Validate bundle data
  if (!bundle || typeof bundle !== 'object') return 0;

  // Check minimum items requirement
  const minItems = parseInt(bundle.min_items) || 0;
  if (productCount < minItems) return 0;

  // Check category requirements
  if (bundle.required_categories && Array.isArray(bundle.required_categories) && bundle.required_categories.length > 0) {
    const productCategories = new Set(products.map(p => p.category));
    const hasAllRequired = bundle.required_categories.every((cat: string) => 
      productCategories.has(cat)
    );
    if (!hasAllRequired) return 0;
  }

  // Apply discount based on type
  if (bundle.discount_type === 'percentage') {
    const discount = parseFloat(bundle.discount_value);
    return isNaN(discount) ? 0 : Math.min(100, Math.max(0, discount));
  }

  if (bundle.discount_type === 'tiered' && Array.isArray(bundle.discount_tiers)) {
    const applicableTier = bundle.discount_tiers
      .filter((tier: any) => {
        const tierMinItems = parseInt(tier.min_items);
        return !isNaN(tierMinItems) && productCount >= tierMinItems;
      })
      .sort((a: any, b: any) => {
        const aMin = parseInt(a.min_items) || 0;
        const bMin = parseInt(b.min_items) || 0;
        return bMin - aMin;
      })[0];
    
    if (applicableTier) {
      const discount = parseFloat(applicableTier.discount);
      return isNaN(discount) ? 0 : Math.min(100, Math.max(0, discount));
    }
  }

  return 0;
}

async function getComplementaryProducts(
  supabase: any, 
  selectedProducts: string[], 
  targetCategory?: string, 
  occasion?: string
) {
  // Build query with proper filtering
  let query = supabase
    .from('products')
    .select(`
      id, name, category, base_price, images,
      product_variants!inner(id, price, attributes)
    `)
    .eq('status', 'active');

  // Exclude already selected products
  if (selectedProducts.length > 0) {
    query = query.not('id', 'in', `(${selectedProducts.join(',')})`);
  }

  if (targetCategory) {
    query = query.eq('category', targetCategory);
  }

  const { data: products, error } = await query.limit(20);

  if (error) throw new Error('Failed to fetch complementary products');

  // Get selected products for scoring
  const { data: selectedProductData } = await supabase
    .from('products')
    .select('id, category')
    .in('id', selectedProducts);

  // Score products based on complementarity
  const scoredProducts = (products || []).map((product: any) => {
    let score = 0.1; // Base score

    // Category pairing scores
    const categoryPairings: Record<string, string[]> = {
      'Suits': ['Shirts', 'Ties', 'Shoes', 'Accessories'],
      'Shirts': ['Ties', 'Suits', 'Accessories', 'Trousers'],
      'Ties': ['Suits', 'Shirts', 'Accessories'],
      'Shoes': ['Suits', 'Accessories', 'Trousers'],
      'Trousers': ['Shirts', 'Shoes', 'Accessories'],
      'Accessories': ['Suits', 'Shirts', 'Shoes']
    };

    // Score based on category complementarity
    if (selectedProductData) {
      for (const selected of selectedProductData) {
        const complementaryCategories = categoryPairings[selected.category] || [];
        if (complementaryCategories.includes(product.category)) {
          score += 0.4;
        }
      }
    }

    // Score based on occasion appropriateness
    if (occasion && product.name) {
      const productText = sanitizeString(product.name + ' ' + (product.description || ''), 500).toLowerCase();
      const occasionKeywords: Record<string, string[]> = {
        'wedding': ['wedding', 'formal', 'ceremony', 'tuxedo'],
        'business': ['business', 'office', 'professional', 'corporate'],
        'casual': ['casual', 'weekend', 'relaxed', 'comfortable'],
        'formal': ['formal', 'black tie', 'evening', 'dress'],
        'party': ['party', 'celebration', 'festive', 'event']
      };
      
      const keywords = occasionKeywords[occasion] || [];
      for (const keyword of keywords) {
        if (productText.includes(keyword)) {
          score += 0.2;
        }
      }
    }

    // Ensure score is between 0 and 1
    score = Math.min(1, Math.max(0, score));

    return {
      id: product.id,
      name: sanitizeString(product.name || '', 100),
      category: product.category,
      base_price: parseFloat(product.base_price) || 0,
      primary_image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
      complementarity_score: score,
      variant_count: Array.isArray(product.product_variants) ? product.product_variants.length : 0
    };
  });

  // Sort by complementarity score and return top results
  return scoredProducts
    .sort((a: any, b: any) => b.complementarity_score - a.complementarity_score)
    .slice(0, 10);
}

// Create tiered rate limiting for bundle builder:
// - Admin users: 500 requests/minute
// - Authenticated users: 200 requests/minute (search default)
// - Anonymous users: 100 requests/minute (api default)
const tieredRateLimits = createUserTieredLimits('search');

// Apply tiered rate limiting to the handler
const protectedHandler = rateLimitedEndpoints.tiered(handleBundleBuilder, tieredRateLimits);

// Serve the protected endpoint
serve(protectedHandler);