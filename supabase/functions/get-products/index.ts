import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductFilters {
  category?: string;
  product_type?: 'core' | 'catalog' | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filters: ProductFilters = {
      category: url.searchParams.get("category") || undefined,
      product_type: url.searchParams.get("product_type") as any || "all",
      search: url.searchParams.get("search") || undefined,
      limit: parseInt(url.searchParams.get("limit") || "20"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Build query
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
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    const { data: products, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data to include computed fields
    const transformedProducts = products?.map(product => {
      const variants = product.product_variants || [];
      const images = product.images || [];
      
      // Calculate price range
      const prices = variants.map(v => v.price).filter(Boolean);
      const minPrice = prices.length > 0 ? Math.min(...prices) : product.base_price;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : product.base_price;
      
      // Calculate total inventory
      const totalInventory = variants.reduce((total, variant) => {
        const inventory = variant.inventory?.[0];
        return total + (inventory?.available_quantity || 0);
      }, 0);

      // Get primary image (first image from Stripe images array)
      const primaryImage = images.length > 0 ? images[0] : null;

      return {
        ...product,
        price_range: {
          min: minPrice,
          max: maxPrice,
        },
        total_inventory: totalInventory,
        primary_image: primaryImage,
        variant_count: variants.length,
        in_stock: totalInventory > 0,
        variants: variants.map(variant => ({
          ...variant,
          available_quantity: variant.inventory?.[0]?.available_quantity || 0,
          reserved_quantity: variant.inventory?.[0]?.reserved_quantity || 0,
        })),
        images: images,
      };
    });

    // Get total count for pagination
    let countQuery = supabase
      .from("products")
      .select("id", { count: "exact" })
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

    const { count } = await countQuery;

    return new Response(JSON.stringify({
      products: transformedProducts,
      pagination: {
        total: count || 0,
        limit: filters.limit,
        offset: filters.offset,
        has_more: (filters.offset + filters.limit) < (count || 0),
      },
      filters: filters,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});