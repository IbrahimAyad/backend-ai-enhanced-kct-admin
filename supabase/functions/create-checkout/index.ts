import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  product_id?: string;
  variant_id?: string;
  stripe_price_id?: string;
  quantity: number;
  customization?: Record<string, any>;
}

interface CheckoutRequest {
  items: CartItem[];
  success_url?: string;
  cancel_url?: string;
  customer_email?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, success_url, cancel_url, customer_email }: CheckoutRequest = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate session ID for stock reservations
    const sessionId = crypto.randomUUID();
    
    // Build line items and validate inventory
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderDetails = { items: [], session_id: sessionId };

    for (const item of items) {
      let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

      if (item.stripe_price_id) {
        // Core product with Stripe price
        lineItem = {
          price: item.stripe_price_id,
          quantity: item.quantity,
        };

        // Get product details for inventory check
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("*, products(*)")
            .eq("id", item.variant_id)
            .single();

          if (variant) {
            // Check inventory
            const { data: availableQty } = await supabase
              .rpc("get_available_inventory", { variant_uuid: variant.id });

            if (availableQty < item.quantity) {
              throw new Error(`Insufficient inventory for ${variant.products.name}`);
            }

            // Reserve stock
            await supabase
              .from("stock_reservations")
              .insert({
                variant_id: variant.id,
                quantity: item.quantity,
                session_id: sessionId,
              });
          }
        }
      } else if (item.product_id || item.variant_id) {
        // Catalog product - create price on the fly
        const { data: variant } = await supabase
          .from("product_variants")
          .select("*, products(*)")
          .eq("id", item.variant_id)
          .single();

        if (!variant) {
          throw new Error(`Product variant not found: ${item.variant_id}`);
        }

        // Check inventory
        const { data: availableQty } = await supabase
          .rpc("get_available_inventory", { variant_uuid: variant.id });

        if (availableQty < item.quantity) {
          throw new Error(`Insufficient inventory for ${variant.products.name}`);
        }

        // Create Stripe price for catalog product
        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: Math.round(variant.price * 100),
          product_data: {
            name: variant.products.name,
            description: variant.products.description,
            metadata: {
              product_id: variant.products.id,
              variant_id: variant.id,
              sku: variant.sku,
            },
          },
        });

        lineItem = {
          price: price.id,
          quantity: item.quantity,
        };

        // Reserve stock
        await supabase
          .from("stock_reservations")
          .insert({
            variant_id: variant.id,
            quantity: item.quantity,
            session_id: sessionId,
          });
      } else {
        throw new Error("Invalid item: must have either stripe_price_id or product_id/variant_id");
      }

      lineItems.push(lineItem);
      orderDetails.items.push({
        ...item,
        price_id: lineItem.price,
      });
    }

    // Get customer if authenticated
    let customerId;
    const authHeader = req.headers.get("Authorization");
    if (authHeader && customer_email) {
      try {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("stripe_customer_id")
          .eq("email", customer_email)
          .single();

        if (existingCustomer?.stripe_customer_id) {
          customerId = existingCustomer.stripe_customer_id;
        }
      } catch {
        // Customer not found, will be created during checkout
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customer_email,
      line_items: lineItems,
      mode: "payment",
      success_url: success_url || `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/cart`,
      metadata: {
        order_details: JSON.stringify(orderDetails),
        session_id: sessionId,
      },
      expires_at: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id,
      checkout_session_id: sessionId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});