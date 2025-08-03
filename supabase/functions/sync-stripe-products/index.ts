import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Starting Stripe product sync...");

    // Get all active products from Stripe
    const products = [];
    let hasMore = true;
    let startingAfter;

    while (hasMore) {
      const params: any = { active: true, limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const result = await stripe.products.list(params);
      products.push(...result.data);
      
      hasMore = result.has_more;
      if (hasMore) {
        startingAfter = result.data[result.data.length - 1].id;
      }
    }

    console.log(`Found ${products.length} products in Stripe`);

    // Get all prices for these products
    const pricesMap = new Map();
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const params: any = { active: true, limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const result = await stripe.prices.list(params);
      
      for (const price of result.data) {
        if (!pricesMap.has(price.product)) {
          pricesMap.set(price.product, []);
        }
        pricesMap.get(price.product).push(price);
      }
      
      hasMore = result.has_more;
      if (hasMore) {
        startingAfter = result.data[result.data.length - 1].id;
      }
    }

    console.log(`Found prices for ${pricesMap.size} products`);

    let syncedCount = 0;
    let errorCount = 0;

    // Process each product
    for (const stripeProduct of products) {
      try {
        const prices = pricesMap.get(stripeProduct.id) || [];
        
        // Determine category from metadata or name
        const category = stripeProduct.metadata.category || 
                        (stripeProduct.name.toLowerCase().includes('suit') ? 'suits' :
                         stripeProduct.name.toLowerCase().includes('tie') ? 'ties' :
                         stripeProduct.name.toLowerCase().includes('shirt') ? 'shirts' : 'accessories');

        // Check if product already exists
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id, product_variants(id, stripe_price_id)")
          .eq("stripe_product_id", stripeProduct.id)
          .single();

        const basePrice = prices.length > 0 ? (prices[0].unit_amount || 0) / 100 : 0;

        if (existingProduct) {
          // Update existing product
          await supabase
            .from("products")
            .update({
              name: stripeProduct.name,
              description: stripeProduct.description,
              category: category,
              base_price: basePrice,
              status: stripeProduct.active ? 'active' : 'inactive',
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProduct.id);

          // Sync variants (prices)
          const existingPriceIds = new Set(
            existingProduct.product_variants.map((v: any) => v.stripe_price_id)
          );

          for (const price of prices) {
            if (!existingPriceIds.has(price.id)) {
              // Create new variant for this price
              const attributes = price.metadata || {};
              
              // Generate SKU if not provided
              const sku = price.metadata.sku || `${stripeProduct.id}-${price.id}`;

              const { data: variant } = await supabase
                .from("product_variants")
                .insert({
                  product_id: existingProduct.id,
                  sku: sku,
                  stripe_price_id: price.id,
                  attributes: attributes,
                  price: (price.unit_amount || 0) / 100,
                  active: price.active,
                })
                .select()
                .single();

              // Create inventory record
              if (variant) {
                await supabase
                  .from("inventory")
                  .insert({
                    variant_id: variant.id,
                    available_quantity: parseInt(price.metadata.inventory || "999"),
                    reserved_quantity: 0,
                  });
              }
            }
          }
        } else {
          // Create new product
          const sku = stripeProduct.metadata.sku || stripeProduct.id;

          const { data: newProduct } = await supabase
            .from("products")
            .insert({
              stripe_product_id: stripeProduct.id,
              product_type: "core",
              sku: sku,
              name: stripeProduct.name,
              description: stripeProduct.description,
              category: category,
              base_price: basePrice,
              images: stripeProduct.images || [],
              status: stripeProduct.active ? 'active' : 'inactive',
            })
            .select()
            .single();

          if (newProduct) {
            // Create variants for each price
            for (const price of prices) {
              const attributes = price.metadata || {};
              const variantSku = price.metadata.sku || `${sku}-${price.id}`;

              const { data: variant } = await supabase
                .from("product_variants")
                .insert({
                  product_id: newProduct.id,
                  sku: variantSku,
                  stripe_price_id: price.id,
                  attributes: attributes,
                  price: (price.unit_amount || 0) / 100,
                  active: price.active,
                })
                .select()
                .single();

              // Create inventory record
              if (variant) {
                await supabase
                  .from("inventory")
                  .insert({
                    variant_id: variant.id,
                    available_quantity: parseInt(price.metadata.inventory || "999"),
                    reserved_quantity: 0,
                  });
              }
            }
          }
        }

        syncedCount++;
        console.log(`Synced product: ${stripeProduct.name}`);
      } catch (error) {
        console.error(`Error syncing product ${stripeProduct.id}:`, error);
        errorCount++;
      }
    }

    // Clean up expired stock reservations
    await supabase.rpc("cleanup_expired_reservations");

    return new Response(JSON.stringify({
      success: true,
      synced_products: syncedCount,
      errors: errorCount,
      total_stripe_products: products.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});