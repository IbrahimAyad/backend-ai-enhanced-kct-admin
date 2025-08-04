import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { createRateLimitedEndpoint, createUserTieredLimits } from '../_shared/rate-limit-middleware.ts';
import { validateEmail, sanitizeString } from '../_shared/validation.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

// Environment validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Constants
const MAX_PRODUCTS_PER_PAGE = 100;
const DEFAULT_PAGE_SIZE = 20;
const ALLOWED_CATEGORIES = [
  'suits', 'shirts', 'ties', 'shoes', 'accessories', 
  'casual', 'formal', 'wedding', 'business'
];
const ALLOWED_SORT_FIELDS = ['name', 'price', 'created_at', 'popularity'];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

interface ProductQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

/**
 * Main product fetching handler
 */
async function handleGetProducts(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Parse query parameters
    let query: ProductQuery = {};
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      query = {
        category: url.searchParams.get('category') || undefined,
        search: url.searchParams.get('search') || undefined,
        minPrice: url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')!) : undefined,
        maxPrice: url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')!) : undefined,
        inStock: url.searchParams.get('inStock') ? url.searchParams.get('inStock') === 'true' : undefined,
        page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : DEFAULT_PAGE_SIZE,
        sortBy: url.searchParams.get('sortBy') || 'created_at',
        sortOrder: url.searchParams.get('sortOrder') || 'desc'
      };
    } else {
      // POST method with JSON body
      try {
        const body = await req.json();
        query = body;
      } catch {
        throw new Error('Invalid JSON in request body');
      }
    }

    // Validate and sanitize query parameters
    const validatedQuery = validateProductQuery(query);

    // Build Supabase query
    let dbQuery = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        category,
        in_stock,
        stripe_price_id,
        metadata,
        created_at,
        updated_at
      `);

    // Apply filters
    if (validatedQuery.category) {
      dbQuery = dbQuery.eq('category', validatedQuery.category);
    }

    if (validatedQuery.search) {
      // Full-text search on name and description
      dbQuery = dbQuery.or(`name.ilike.%${validatedQuery.search}%,description.ilike.%${validatedQuery.search}%`);
    }

    if (validatedQuery.minPrice !== undefined) {
      dbQuery = dbQuery.gte('price', validatedQuery.minPrice);
    }

    if (validatedQuery.maxPrice !== undefined) {
      dbQuery = dbQuery.lte('price', validatedQuery.maxPrice);
    }

    if (validatedQuery.inStock !== undefined) {
      dbQuery = dbQuery.eq('in_stock', validatedQuery.inStock);
    }

    // Apply sorting
    const sortField = validatedQuery.sortBy || 'created_at';
    const sortOrder = validatedQuery.sortOrder || 'desc';
    dbQuery = dbQuery.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = Math.max(1, validatedQuery.page || 1);
    const limit = Math.min(MAX_PRODUCTS_PER_PAGE, validatedQuery.limit || DEFAULT_PAGE_SIZE);
    const offset = (page - 1) * limit;

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data: products, error, count } = await dbQuery;

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch products');
    }

    // Get total count for pagination (separate query for performance)
    let totalCount = 0;
    if (products && products.length > 0) {
      const { count: total } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      totalCount = total || 0;
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Response
    const response = {
      products: products || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      query: validatedQuery,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minutes cache
        }
      }
    );

  } catch (error) {
    console.error('Get products error:', error);
    
    const errorMessage = error.message?.includes('Invalid') ? error.message : 'Failed to fetch products';
    const statusCode = error.message?.includes('Invalid') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}

/**
 * Validate and sanitize product query parameters
 */
function validateProductQuery(query: any): ProductQuery {
  const validated: ProductQuery = {};

  // Category validation
  if (query.category) {
    const category = sanitizeString(query.category, 50).toLowerCase();
    if (ALLOWED_CATEGORIES.includes(category)) {
      validated.category = category;
    } else {
      throw new Error(`Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
    }
  }

  // Search validation
  if (query.search) {
    const search = sanitizeString(query.search, 100);
    if (search.length >= 2) {
      validated.search = search;
    } else {
      throw new Error('Search term must be at least 2 characters');
    }
  }

  // Price validation
  if (query.minPrice !== undefined) {
    const minPrice = parseFloat(query.minPrice);
    if (!isNaN(minPrice) && minPrice >= 0) {
      validated.minPrice = minPrice;
    } else {
      throw new Error('Invalid minPrice value');
    }
  }

  if (query.maxPrice !== undefined) {
    const maxPrice = parseFloat(query.maxPrice);
    if (!isNaN(maxPrice) && maxPrice >= 0) {
      validated.maxPrice = maxPrice;
    } else {
      throw new Error('Invalid maxPrice value');
    }
  }

  // Price range validation
  if (validated.minPrice !== undefined && validated.maxPrice !== undefined) {
    if (validated.minPrice > validated.maxPrice) {
      throw new Error('minPrice cannot be greater than maxPrice');
    }
  }

  // Stock filter validation
  if (query.inStock !== undefined) {
    validated.inStock = Boolean(query.inStock);
  }

  // Pagination validation
  if (query.page !== undefined) {
    const page = parseInt(query.page);
    if (!isNaN(page) && page >= 1) {
      validated.page = page;
    } else {
      throw new Error('Invalid page number');
    }
  }

  if (query.limit !== undefined) {
    const limit = parseInt(query.limit);
    if (!isNaN(limit) && limit >= 1 && limit <= MAX_PRODUCTS_PER_PAGE) {
      validated.limit = limit;
    } else {
      throw new Error(`Invalid limit. Must be between 1 and ${MAX_PRODUCTS_PER_PAGE}`);
    }
  }

  // Sorting validation
  if (query.sortBy) {
    const sortBy = sanitizeString(query.sortBy, 50).toLowerCase();
    if (ALLOWED_SORT_FIELDS.includes(sortBy)) {
      validated.sortBy = sortBy;
    } else {
      throw new Error(`Invalid sortBy. Allowed: ${ALLOWED_SORT_FIELDS.join(', ')}`);
    }
  }

  if (query.sortOrder) {
    const sortOrder = sanitizeString(query.sortOrder, 10).toLowerCase();
    if (ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      validated.sortOrder = sortOrder;
    } else {
      throw new Error(`Invalid sortOrder. Allowed: ${ALLOWED_SORT_ORDERS.join(', ')}`);
    }
  }

  return validated;
}

// Create tiered rate limiting:
// - Admin users: 500 requests/minute
// - Authenticated users: 200 requests/minute  
// - Anonymous users: 100 requests/minute
const tieredRateLimits = createUserTieredLimits('search');

// Apply tiered rate limiting to the handler
const protectedHandler = rateLimitedEndpoints.tiered(handleGetProducts, tieredRateLimits);

// Serve the protected endpoint
serve(protectedHandler);