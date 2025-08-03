import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("id");
    const orderNumber = url.searchParams.get("order_number");
    const sessionId = url.searchParams.get("session_id");

    if (!orderId && !orderNumber && !sessionId) {
      throw new Error("Order ID, order number, or session ID is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Build query based on identifier
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (*),
        customers (
          email,
          first_name,
          last_name,
          phone
        )
      `);

    if (orderId) {
      query = query.eq("id", orderId);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else if (sessionId) {
      query = query.eq("stripe_checkout_session_id", sessionId);
    }

    const { data: order, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      throw error;
    }

    // Check if user has permission to view this order
    const authHeader = req.headers.get("Authorization");
    let userCanView = false;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      
      if (userData.user) {
        // Check if user owns this order through customer relationship
        userCanView = order.customers?.some((customer: any) => 
          customer.auth_user_id === userData.user.id
        ) || order.guest_email === userData.user.email;
      }
    } else {
      // For guest orders, allow access without auth
      userCanView = !!order.guest_email;
    }

    if (!userCanView) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Transform order data
    const transformedOrder = {
      ...order,
      customer: order.customers || {
        email: order.guest_email,
        first_name: null,
        last_name: null,
        phone: null,
      },
      items: order.order_items.map((item: any) => ({
        ...item,
        customization: item.attributes,
      })),
      totals: {
        subtotal: order.subtotal,
        tax: order.tax_amount,
        shipping: order.shipping_amount,
        total: order.total,
      },
      tracking: {
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    };

    // Remove sensitive fields
    delete transformedOrder.customers;
    delete transformedOrder.order_items;

    return new Response(JSON.stringify(transformedOrder), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});