import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { sanitizeString } from "../_shared/validation.ts";
import { checkRateLimit, sanitizeErrorMessage } from "../_shared/webhook-security.ts";

// Environment validation
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Valid values for filtering
const VALID_CATEGORIES = [
  "Suits", "Shirts", "Accessories", "Shoes", "Outerwear", 
  "Trousers", "Casual", "Formal", "Wedding", "Custom"
];
const VALID_PRODUCT_TYPES = ["core", "catalog", "all"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_SEARCH_LENGTH = 100;

interface ProductFilters {
  category?: string;
  product_type?: 'core' | 'catalog' | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept GET requests
  if (req.method !== "GET") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders
    });
  }

  // Rate limiting (more lenient for read operations)
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = checkRateLimit(`get-products:${clientIp}`);
  
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded" }), 
      { 
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60)
        }
      }
    );
  }

  try {
    const url = new URL(req.url);
    
    // Parse and validate filters
    const rawFilters = {
      category: url.searchParams.get("category"),
      product_type: url.searchParams.get("product_type"),
      search: url.searchParams.get("search"),
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    };

    // Validate and sanitize filters
    const filters: ProductFilters = {};

    // Validate category
    if (rawFilters.category) {
      const category = sanitizeString(rawFilters.category, 50);
      if (VALID_CATEGORIES.includes(category)) {
        filters.category = category;
      } else {
        throw new Error("Invalid category");
      }
    }

    // Validate product type
    if (rawFilters.product_type) {
      const productType = rawFilters.product_type.toLowerCase();
      if (VALID_PRODUCT_TYPES.includes(productType)) {
        filters.product_type = productType as any;
      } else {
        throw new Error("Invalid product type");
      }
    } else {
      filters.product_type = "all";
    }

    // Validate and sanitize search
    if (rawFilters.search) {
      const search = sanitizeString(rawFilters.search, MAX_SEARCH_LENGTH);
      // Remove special characters that could break the query
      const cleanSearch = search.replace(/[%_]/g, '');
      if (cleanSearch.length > 0) {
        filters.search = cleanSearch;
      }
    }

    // Validate pagination
    const limit = parseInt(rawFilters.limit || String(DEFAULT_LIMIT));
    if (isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
      filters.limit = DEFAULT_LIMIT;
    } else {
      filters.limit = limit;
    }

    const offset = parseInt(rawFilters.offset || "0");
    if (isNaN(offset) || offset < 0 || offset > 10000) {
      filters.offset = 0;
    } else {
      filters.offset = offset;
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Build query with sanitized filters
    let query = supabase
      .from("products")
      .select(`
        *,
        product_variants (
          *,
          inventory (*)
        )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.product_type && filters.product_type !== "all") {
      query = query.eq("product_type", filters.product_type);
    }

    if (filters.search) {
      // Use parameterized search to prevent injection
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data: products, error } = await query;

    if (error) {
      console.error("Database query error:", error);
      throw new Error("Failed to fetch products");
    }

    // Transform data safely
    const transformedProducts = (products || []).map(product => {
      try {
        const variants = Array.isArray(product.product_variants) ? product.product_variants : [];
        const images = Array.isArray(product.images) ? product.images : [];
        
        // Calculate price range safely
        const prices = variants
          .map(v => parseFloat(v.price))
          .filter(p => !isNaN(p) && p >= 0);
        
        const minPrice = prices.length > 0 ? Math.min(...prices) : product.base_price || 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : product.base_price || 0;
        
        // Calculate total inventory safely
        const totalInventory = variants.reduce((total, variant) => {
          const inventory = variant.inventory?.[0];
          const available = parseInt(inventory?.available_quantity) || 0;
          return total + Math.max(0, available);
        }, 0);

        // Get primary image safely
        const primaryImage = images.length > 0 && typeof images[0] === 'string' 
          ? images[0] 
          : null;

        return {
          id: product.id,
          name: sanitizeString(product.name || '', 200),
          description: sanitizeString(product.description || '', 1000),
          category: product.category,
          product_type: product.product_type,
          base_price: parseFloat(product.base_price) || 0,
          price_range: {
            min: minPrice,
            max: maxPrice,
          },
          total_inventory: totalInventory,
          primary_image: primaryImage,
          variant_count: variants.length,
          in_stock: totalInventory > 0,
          variants: variants.map(variant => ({
            id: variant.id,
            sku: sanitizeString(variant.sku || '', 100),
            attributes: variant.attributes || {},
            price: parseFloat(variant.price) || 0,
            available_quantity: parseInt(variant.inventory?.[0]?.available_quantity) || 0,
            reserved_quantity: parseInt(variant.inventory?.[0]?.reserved_quantity) || 0,
          })),
          images: images.filter(img => typeof img === 'string').slice(0, 10), // Limit images
          created_at: product.created_at,
          updated_at: product.updated_at,
        };
      } catch (transformError) {
        console.error("Product transformation error:", transformError, product.id);
        // Return minimal product info on transformation error
        return {
          id: product.id,
          name: product.name || 'Unknown Product',
          error: 'Product data error',
        };
      }
    });

    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    if (filters.category) {
      countQuery = countQuery.eq("category", filters.category);
    }

    if (filters.product_type && filters.product_type !== "all") {
      countQuery = countQuery.eq("product_type", filters.product_type);
    }

    if (filters.search) {
      countQuery = countQuery.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Count query error:", countError);
      // Continue without total count rather than failing
    }

    // Return response with cache headers for performance
    return new Response(JSON.stringify({
      products: transformedProducts,
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        has_more: (filters.offset + filters.limit) < (count || 0),
      },
      filters: {
        category: filters.category,
        product_type: filters.product_type,
        search: filters.search,
      },
    }), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60", // Cache for 1 minute
      },
      status: 200,
    });

  } catch (error) {
    console.error("Get products error:", error);
    
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes("Invalid") ? 400 : 
                      error.message?.includes("Rate limit") ? 429 : 500;

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});