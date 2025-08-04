import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { createRateLimitedEndpoint } from '../_shared/rate-limit-middleware.ts';
import { 
  validateWebhookSignature,
  checkReplayProtection,
  validateWebhookPayload,
  sanitizeErrorMessage,
  createSecureWebhookHeaders 
} from "../_shared/webhook-security.ts";

// Environment validation
const KCT_WEBHOOK_SECRET = Deno.env.get("KCT_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!KCT_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Required fields for different webhook types
const REQUIRED_FIELDS = {
  "order.created": ["order_id", "customer_email", "items", "total_amount"],
  "order.updated": ["order_id", "status"],
  "order.cancelled": ["order_id", "reason"],
  "inventory.updated": ["sku", "quantity", "operation"],
  "customer.created": ["customer_id", "email"],
};

/**
 * Main KCT webhook handler
 */
async function handleKCTWebhook(req: Request): Promise<Response> {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: createSecureWebhookHeaders()
    });
  }

  try {

    // Get webhook headers
    const signature = req.headers.get("x-kct-signature");
    const timestamp = req.headers.get("x-kct-timestamp");
    const webhookId = req.headers.get("x-kct-webhook-id");
    
    if (!signature || !timestamp || !webhookId) {
      throw new Error("Missing required webhook headers");
    }

    // Read body
    const body = await req.text();
    
    // Validate webhook signature
    const signatureResult = await validateWebhookSignature(
      body,
      signature,
      KCT_WEBHOOK_SECRET,
      timestamp
    );
    
    if (!signatureResult.isValid) {
      console.error("Webhook signature validation failed:", signatureResult.error);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }), 
        { 
          status: 401,
          headers: createSecureWebhookHeaders()
        }
      );
    }

    // Replay protection
    if (!checkReplayProtection(webhookId)) {
      console.warn(`Duplicate webhook detected: ${webhookId}`);
      return new Response(
        JSON.stringify({ error: "Duplicate webhook" }), 
        { 
          status: 409,
          headers: createSecureWebhookHeaders()
        }
      );
    }

    // Parse and validate payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (e) {
      throw new Error("Invalid JSON payload");
    }

    if (!payload.event_type || !payload.data) {
      throw new Error("Invalid webhook payload structure");
    }

    // Validate required fields based on event type
    const requiredFields = REQUIRED_FIELDS[payload.event_type];
    if (requiredFields) {
      const validation = validateWebhookPayload(payload.data, requiredFields);
      if (!validation.isValid) {
        throw new Error(`Missing required fields: ${validation.missingFields?.join(", ")}`);
      }
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Log webhook event
    await supabase
      .from("webhook_logs")
      .insert({
        webhook_id: webhookId,
        source: "kct",
        event_type: payload.event_type,
        payload: payload,
        status: "processing",
        ip_address: clientIp,
      });

    console.log(`Processing KCT webhook: ${payload.event_type} (${webhookId})`);

    // Process webhook based on event type
    try {
      switch (payload.event_type) {
        case "order.created":
          await handleOrderCreated(supabase, payload.data);
          break;
        case "order.updated":
          await handleOrderUpdated(supabase, payload.data);
          break;
        case "order.cancelled":
          await handleOrderCancelled(supabase, payload.data);
          break;
        case "inventory.updated":
          await handleInventoryUpdate(supabase, payload.data);
          break;
        case "customer.created":
          await handleCustomerCreated(supabase, payload.data);
          break;
        default:
          console.log(`Unhandled event type: ${payload.event_type}`);
      }

      // Update webhook log status
      await supabase
        .from("webhook_logs")
        .update({ 
          status: "completed",
          processed_at: new Date().toISOString()
        })
        .eq("webhook_id", webhookId);

    } catch (processingError) {
      // Log processing error
      console.error(`Error processing ${payload.event_type}:`, processingError);
      
      await supabase
        .from("webhook_logs")
        .update({ 
          status: "failed",
          error_message: processingError.message,
          processed_at: new Date().toISOString()
        })
        .eq("webhook_id", webhookId);

      throw processingError;
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        webhook_id: webhookId 
      }), 
      {
        status: 200,
        headers: createSecureWebhookHeaders()
      }
    );

  } catch (error) {
    console.error("KCT webhook error:", error);
    
    // Return sanitized error response
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes("signature") ? 401 : 
                      error.message?.includes("rate limit") ? 429 : 400;
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: statusCode,
        headers: createSecureWebhookHeaders()
      }
    );
  }
}

// Handler functions with validation and error handling

async function handleOrderCreated(supabase: any, data: any) {
  console.log(`Processing order creation: ${data.order_id}`);
  
  // Validate customer exists or create
  let customer;
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("*")
    .eq("email", data.customer_email)
    .single();

  if (!existingCustomer) {
    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        email: data.customer_email,
        first_name: data.customer_name?.split(" ")[0],
        last_name: data.customer_name?.split(" ").slice(1).join(" "),
        phone: data.customer_phone,
        kct_customer_id: data.customer_id,
      })
      .select()
      .single();

    if (error) throw error;
    customer = newCustomer;
  } else {
    customer = existingCustomer;
  }

  // Create order with validation
  const orderData = {
    kct_order_id: data.order_id,
    customer_id: customer.id,
    guest_email: customer.auth_user_id ? null : data.customer_email,
    items: data.items || [],
    subtotal: data.subtotal || 0,
    tax_amount: data.tax_amount || 0,
    shipping_amount: data.shipping_amount || 0,
    total: data.total_amount || 0,
    currency: data.currency || "usd",
    status: data.status || "pending",
    shipping_address: data.shipping_address,
    billing_address: data.billing_address,
    metadata: {
      source: "kct_webhook",
      kct_data: data
    }
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderData)
    .select()
    .single();

  if (orderError) throw orderError;

  // Process order items with inventory updates
  for (const item of data.items) {
    // Validate item data
    if (!item.sku || !item.quantity) continue;

    const orderItemData = {
      order_id: order.id,
      sku: item.sku,
      name: item.name || item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || (item.unit_price * item.quantity),
      attributes: item.attributes || {},
      product_id: item.product_id,
      variant_id: item.variant_id,
    };

    await supabase
      .from("order_items")
      .insert(orderItemData);

    // Update inventory if variant ID provided
    if (item.variant_id) {
      await supabase.rpc("update_inventory_on_sale", {
        variant_uuid: item.variant_id,
        quantity_sold: item.quantity,
      });
    }
  }

  // Trigger order confirmation email
  try {
    await sendOrderConfirmationEmail(supabase, order, customer, data);
  } catch (emailError) {
    console.error("Failed to send confirmation email:", emailError);
  }

  console.log(`Order created successfully: ${order.order_number}`);
}

async function handleOrderUpdated(supabase: any, data: any) {
  console.log(`Processing order update: ${data.order_id}`);
  
  const updateData: any = {
    status: data.status,
    updated_at: new Date().toISOString(),
  };

  // Add tracking info if provided
  if (data.tracking_number) {
    updateData.tracking_number = data.tracking_number;
    updateData.tracking_carrier = data.tracking_carrier;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("kct_order_id", data.order_id);

  if (error) throw error;

  // Log status change
  await supabase
    .from("order_status_history")
    .insert({
      order_id: data.order_id,
      status: data.status,
      notes: data.notes,
      changed_by: "kct_webhook",
    });
}

async function handleOrderCancelled(supabase: any, data: any) {
  console.log(`Processing order cancellation: ${data.order_id}`);
  
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("kct_order_id", data.order_id)
    .single();

  if (fetchError) throw fetchError;

  // Update order status
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancellation_reason: data.reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateError) throw updateError;

  // Restore inventory for cancelled items
  for (const item of order.order_items) {
    if (item.variant_id) {
      await supabase.rpc("restore_inventory_on_cancel", {
        variant_uuid: item.variant_id,
        quantity_restored: item.quantity,
      });
    }
  }

  // Could trigger cancellation email here
}

async function handleInventoryUpdate(supabase: any, data: any) {
  console.log(`Processing inventory update: ${data.sku}`);
  
  // Find product variant by SKU
  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("sku", data.sku)
    .single();

  if (variantError) {
    console.error(`Variant not found for SKU: ${data.sku}`);
    return;
  }

  // Update inventory based on operation
  let newQuantity;
  const currentQuantity = variant.inventory_quantity || 0;
  
  switch (data.operation) {
    case "set":
      newQuantity = data.quantity;
      break;
    case "increment":
      newQuantity = currentQuantity + data.quantity;
      break;
    case "decrement":
      newQuantity = Math.max(0, currentQuantity - data.quantity);
      break;
    default:
      throw new Error(`Invalid operation: ${data.operation}`);
  }

  const { error: updateError } = await supabase
    .from("inventory")
    .update({
      quantity_available: newQuantity,
      last_updated: new Date().toISOString(),
      updated_by: "kct_webhook",
    })
    .eq("variant_id", variant.id);

  if (updateError) throw updateError;

  console.log(`Inventory updated for ${data.sku}: ${currentQuantity} -> ${newQuantity}`);
}

async function handleCustomerCreated(supabase: any, data: any) {
  console.log(`Processing customer creation: ${data.customer_id}`);
  
  // Check if customer already exists
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", data.email)
    .single();

  if (!existingCustomer) {
    const { error } = await supabase
      .from("customers")
      .insert({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        kct_customer_id: data.customer_id,
        metadata: data.metadata || {},
      });

    if (error) throw error;

    // Could trigger welcome email here
  } else {
    // Update existing customer with KCT ID
    await supabase
      .from("customers")
      .update({ kct_customer_id: data.customer_id })
      .eq("id", existingCustomer.id);
  }
}

async function sendOrderConfirmationEmail(supabase: any, order: any, customer: any, data: any) {
  const emailData = {
    orderId: order.order_number || order.id,
    customerEmail: customer.email,
    customerName: customer.first_name || "Valued Customer",
    items: data.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.unit_price,
    })),
    total: order.total,
    shippingAddress: order.shipping_address,
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    throw new Error("Failed to trigger order confirmation email");
  }
}

// Apply webhook rate limiting (1000 requests/minute)
const protectedHandler = rateLimitedEndpoints.webhook(handleKCTWebhook);

// Serve the protected endpoint
serve(protectedHandler);