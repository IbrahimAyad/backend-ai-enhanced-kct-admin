import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
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

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, stripe, session);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(supabase, customer);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleCheckoutCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  console.log(`Processing checkout session: ${session.id}`);

  // Get line items with product details
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });

  // Parse order details from metadata
  const orderDetails = session.metadata?.order_details 
    ? JSON.parse(session.metadata.order_details)
    : {};

  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) {
    throw new Error("No customer email found in session");
  }

  // Create or get customer
  let customer;
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("*")
    .eq("email", customerEmail)
    .single();

  if (existingCustomer) {
    customer = existingCustomer;
    // Update Stripe customer ID if not set
    if (!customer.stripe_customer_id && session.customer) {
      await supabase
        .from("customers")
        .update({ stripe_customer_id: session.customer })
        .eq("id", customer.id);
    }
  } else {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        email: customerEmail,
        first_name: session.customer_details?.name?.split(" ")[0],
        last_name: session.customer_details?.name?.split(" ").slice(1).join(" "),
        phone: session.customer_details?.phone,
        stripe_customer_id: session.customer,
      })
      .select()
      .single();

    if (error) throw error;
    customer = newCustomer;
  }

  // Process line items and build order items
  const orderItems = [];
  const processedItems = [];
  
  for (const item of lineItems.data) {
    const price = item.price;
    const product = price?.product as Stripe.Product;
    
    if (!price || !product) continue;

    // Get product from our database
    const { data: dbProduct } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("stripe_product_id", product.id)
      .single();

    // Extract customization from metadata or order details
    const customization = orderDetails.items?.find((i: any) => 
      i.price_id === price.id
    )?.customization || {};

    // Find matching variant based on customization
    let variant = null;
    if (dbProduct?.product_variants) {
      variant = dbProduct.product_variants.find((v: any) => 
        JSON.stringify(v.attributes) === JSON.stringify(customization)
      );
    }

    const orderItem = {
      sku: dbProduct?.sku || product.metadata?.sku || `STRIPE_${product.id}`,
      name: product.name,
      quantity: item.quantity || 1,
      unit_price: (price.unit_amount || 0) / 100,
      total_price: ((price.unit_amount || 0) * (item.quantity || 1)) / 100,
      attributes: customization,
      product_id: dbProduct?.id,
      variant_id: variant?.id,
    };

    orderItems.push(orderItem);
    processedItems.push({
      ...orderItem,
      stripe_price_id: price.id,
      stripe_product_id: product.id,
    });

    // Update inventory if variant exists
    if (variant) {
      await supabase.rpc("update_inventory_on_sale", {
        variant_uuid: variant.id,
        quantity_sold: item.quantity || 1,
      });
    }
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      customer_id: customer.id,
      guest_email: customer.auth_user_id ? null : customerEmail,
      items: processedItems,
      subtotal: (session.amount_subtotal || 0) / 100,
      tax_amount: (session.total_details?.amount_tax || 0) / 100,
      shipping_amount: (session.total_details?.amount_shipping || 0) / 100,
      total: (session.amount_total || 0) / 100,
      currency: session.currency || "usd",
      status: "confirmed",
      shipping_address: session.shipping_details?.address,
      billing_address: session.customer_details?.address,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsWithOrderId);

  if (itemsError) throw itemsError;

  // Clear any stock reservations for this session
  if (session.metadata?.session_id) {
    await supabase
      .from("stock_reservations")
      .delete()
      .eq("session_id", session.metadata.session_id);
  }

  // Send order confirmation email
  try {
    const orderData = {
      orderId: order.order_number || order.id,
      customerEmail,
      customerName: session.customer_details?.name || customer.first_name || 'Valued Customer',
      items: processedItems.map(item => ({
        id: item.product_id || item.stripe_product_id,
        name: item.name,
        price: item.unit_price,
        quantity: item.quantity,
        image: null // You can add image URLs here if available
      })),
      total: (session.amount_total || 0) / 100,
      shippingAddress: {
        street: session.shipping_details?.address?.line1 || '',
        city: session.shipping_details?.address?.city || '',
        state: session.shipping_details?.address?.state || '',
        zipCode: session.shipping_details?.address?.postal_code || '',
        country: session.shipping_details?.address?.country || 'US'
      },
      orderDate: new Date().toISOString()
    };

    // Call order confirmation email function
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify(orderData)
    });

    console.log(`Order confirmation email triggered for order: ${order.order_number}`);
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError);
    // Don't throw error here, order processing should continue
  }

  console.log(`Order created successfully: ${order.order_number}`);
}

async function handlePaymentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing payment intent: ${paymentIntent.id}`);

  // Update order status
  await supabase
    .from("orders")
    .update({ status: "processing" })
    .eq("stripe_payment_intent_id", paymentIntent.id);
}

async function handleCustomerCreated(supabase: any, customer: Stripe.Customer) {
  console.log(`Processing new customer: ${customer.id}`);

  if (!customer.email) return;

  // Check if customer already exists
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", customer.email)
    .single();

  if (!existingCustomer) {
    await supabase
      .from("customers")
      .insert({
        email: customer.email,
        first_name: customer.name?.split(" ")[0],
        last_name: customer.name?.split(" ").slice(1).join(" "),
        phone: customer.phone,
        stripe_customer_id: customer.id,
      });
  } else {
    // Update existing customer with Stripe ID
    await supabase
      .from("customers")
      .update({ stripe_customer_id: customer.id })
      .eq("id", existingCustomer.id);
  }
}