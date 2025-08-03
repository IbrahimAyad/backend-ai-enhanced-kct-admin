import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("No Stripe signature found");
    return new Response("No signature", { status: 400 });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(`Webhook Error: ${err}`, { status: 400 });
    }

    console.log("Processing event:", event.type);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe, supabase);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: any
) {
  console.log("Processing checkout completion for session:", session.id);

  try {
    // Get line items from session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
    });

    // Extract customer info
    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerName = session.customer_details?.name || "";
    const [firstName, ...lastNameParts] = customerName.split(" ");
    const lastName = lastNameParts.join(" ");

    // Create or get customer
    let customer;
    if (customerEmail) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("email", customerEmail)
        .single();

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            email: customerEmail,
            first_name: firstName || "",
            last_name: lastName || "",
            phone: session.customer_details?.phone || "",
            stripe_customer_id: session.customer || "",
          })
          .select()
          .single();

        if (customerError) {
          console.error("Error creating customer:", customerError);
          throw customerError;
        }
        customer = newCustomer;
      }
    }

    // Parse cart items from metadata
    let orderItems = [];
    try {
      const itemsMetadata = session.metadata?.items;
      if (itemsMetadata) {
        const cartItems = JSON.parse(itemsMetadata);
        orderItems = cartItems.map((item: any) => ({
          product_sku: generateSKU(item),
          product_name: item.name,
          stripe_product_id: item.stripeProductId,
          stripe_price_id: item.stripePriceId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          size: item.size || item.metadata?.size || "One Size",
          color: item.color || "Default",
          category: item.category || "Unknown",
          image_url: item.image || "",
          attributes: {
            type: item.metadata?.type || "",
            fit: item.metadata?.fit || "",
            style: item.metadata?.style || "",
          },
        }));
      }
    } catch (parseError) {
      console.error("Error parsing cart items:", parseError);
      // Fallback: create items from line items
      orderItems = lineItems.data.map((item, index) => ({
        product_sku: `UNKNOWN-${index}`,
        product_name: item.description || "Unknown Product",
        stripe_product_id: (item.price?.product as any)?.id || "",
        stripe_price_id: item.price?.id || "",
        quantity: item.quantity || 1,
        unit_price: (item.amount_total || 0) / 100,
        total_price: (item.amount_total || 0) / 100,
        size: "Unknown",
        color: "Unknown",
        category: "Unknown",
        image_url: "",
        attributes: {},
      }));
    }

    // Generate order number
    const orderNumber = `KCT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Detect bundle info
    const bundleInfo = {
      is_bundle: session.metadata?.order_type === "bundle",
      bundle_type: session.metadata?.bundle_type || null,
      bundle_discount: parseFloat(session.metadata?.bundle_discount || "0"),
    };

    // Create order with correct field names matching database schema
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer?.id || null,
        guest_email: customer ? null : customerEmail, // Use guest_email for non-customers
        status: "confirmed", // Match available status values
        order_type: bundleInfo.is_bundle ? "bundle" : "standard",
        subtotal: ((session.amount_subtotal || 0) / 100),
        tax_amount: ((session.total_details?.amount_tax || 0) / 100),
        shipping_amount: ((session.total_details?.amount_shipping || 0) / 100),
        discount_amount: bundleInfo.bundle_discount,
        total_amount: ((session.amount_total || 0) / 100),
        currency: session.currency?.toUpperCase() || "USD",
        payment_status: "paid",
        payment_method: "stripe",
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        // Map shipping address to individual fields
        shipping_first_name: session.shipping_details?.name?.split(" ")[0] || "",
        shipping_last_name: session.shipping_details?.name?.split(" ").slice(1).join(" ") || "",
        shipping_address_line_1: session.shipping_details?.address?.line1 || "",
        shipping_address_line_2: session.shipping_details?.address?.line2 || "",
        shipping_city: session.shipping_details?.address?.city || "",
        shipping_state: session.shipping_details?.address?.state || "",
        shipping_postal_code: session.shipping_details?.address?.postal_code || "",
        shipping_country: session.shipping_details?.address?.country || "US",
        // Map billing address to individual fields
        billing_first_name: firstName || "",
        billing_last_name: lastName || "",
        billing_address_line_1: session.customer_details?.address?.line1 || "",
        billing_address_line_2: session.customer_details?.address?.line2 || "",
        billing_city: session.customer_details?.address?.city || "",
        billing_state: session.customer_details?.address?.state || "",
        billing_postal_code: session.customer_details?.address?.postal_code || "",
        billing_country: session.customer_details?.address?.country || "US",
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    console.log("Order created:", order.id, order.order_number);

    // Create order items
    for (const item of orderItems) {
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          ...item,
        });

      if (itemError) {
        console.error("Error creating order item:", itemError);
      }
    }

    // Send order confirmation email (placeholder)
    try {
      await supabase.functions.invoke("send-order-confirmation", {
        body: {
          order: order,
          customer: customer,
          items: orderItems,
        },
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the order if email fails
    }

    console.log(`Order ${orderNumber} processed successfully`);
  } catch (error) {
    console.error("Error processing checkout completion:", error);
    throw error;
  }
}

async function handlePaymentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
) {
  console.log("Processing payment success for:", paymentIntent.id);

  try {
    const { error } = await supabase
      .from("orders")
      .update({ status: "processing" })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Error updating order status:", error);
      throw error;
    }

    console.log(`Updated order status to processing for payment ${paymentIntent.id}`);
  } catch (error) {
    console.error("Error processing payment success:", error);
    throw error;
  }
}

function generateSKU(item: any): string {
  const category = item.category || "UNKNOWN";
  const color = (item.color || "DEFAULT").toUpperCase().replace(/\s+/g, "");
  const size = (item.size || "OS").replace(/[^A-Z0-9]/g, "");
  
  let sku = `KCT-${category.toUpperCase()}-${color}`;
  
  // Add type/style info based on category
  if (item.metadata) {
    if (item.metadata.type) {
      sku += `-${item.metadata.type.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
    }
    if (item.metadata.style) {
      sku += `-${item.metadata.style.toUpperCase()}`;
    }
    if (item.metadata.fit) {
      sku += `-${item.metadata.fit.toUpperCase()}`;
    }
  }
  
  if (size !== "OS") {
    sku += `-${size}`;
  }
  
  return sku;
}