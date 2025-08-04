import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createRateLimitedEndpoint } from '../_shared/rate-limit-middleware.ts';
import { 
  checkReplayProtection, 
  sanitizeErrorMessage,
  createSecureWebhookHeaders 
} from "../_shared/webhook-security.ts";

// Environment validation
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Main Stripe webhook handler
 */
async function handleStripeWebhook(req: Request): Promise<Response> {
  // Webhooks should only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: createSecureWebhookHeaders()
    });
  }

  try {

    // Initialize Stripe with validated secret
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with validated credentials
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Get required headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing webhook signature");
    }

    // Read body as text for signature verification
    const body = await req.text();
    
    // Construct and verify webhook event
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }), 
        { 
          status: 401,
          headers: createSecureWebhookHeaders()
        }
      );
    }

    // Replay protection
    if (!checkReplayProtection(event.id)) {
      console.warn(`Duplicate webhook detected: ${event.id}`);
      return new Response(
        JSON.stringify({ error: "Duplicate webhook" }), 
        { 
          status: 409,
          headers: createSecureWebhookHeaders()
        }
      );
    }

    // Log webhook processing
    console.log(`Processing webhook: ${event.type} (${event.id})`);
    
    // Log webhook event in database
    await supabase
      .from("webhook_logs")
      .insert({
        webhook_id: event.id,
        source: "stripe",
        event_type: event.type,
        payload: event,
        status: "processing",
        ip_address: clientIp,
      });

    // Process webhook based on event type
    try {
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
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentFailed(supabase, paymentIntent);
          break;
        }
        case "customer.created": {
          const customer = event.data.object as Stripe.Customer;
          await handleCustomerCreated(supabase, customer);
          break;
        }
        case "charge.dispute.created": {
          const dispute = event.data.object as Stripe.Dispute;
          await handleDisputeCreated(supabase, dispute);
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Update webhook log status
      await supabase
        .from("webhook_logs")
        .update({ 
          status: "completed",
          processed_at: new Date().toISOString()
        })
        .eq("webhook_id", event.id);

    } catch (processingError) {
      // Log processing error
      console.error(`Error processing ${event.type}:`, processingError);
      
      await supabase
        .from("webhook_logs")
        .update({ 
          status: "failed",
          error_message: processingError.message,
          processed_at: new Date().toISOString()
        })
        .eq("webhook_id", event.id);

      throw processingError;
    }

    // Return success response
    return new Response(
      JSON.stringify({ received: true }), 
      {
        status: 200,
        headers: createSecureWebhookHeaders()
      }
    );

  } catch (error) {
    // Log error securely
    console.error("Webhook error:", error);
    
    // Return sanitized error response
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes("signature") ? 401 : 400;
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: statusCode,
        headers: createSecureWebhookHeaders()
      }
    );
  }
}

// Handler functions with improved error handling and validation

async function handleCheckoutCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  // Validate session data
  if (!session.id || !session.payment_status) {
    throw new Error("Invalid checkout session data");
  }

  // Only process paid sessions
  if (session.payment_status !== "paid") {
    console.log(`Session ${session.id} not paid yet, skipping`);
    return;
  }

  console.log(`Processing checkout session: ${session.id}`);

  // Use database transaction for consistency
  const { data, error } = await supabase.rpc("process_stripe_checkout", {
    session_id: session.id,
    session_data: session,
  });

  if (error) {
    throw new Error(`Failed to process checkout: ${error.message}`);
  }

  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail(supabase, session);
  } catch (emailError) {
    // Log but don't fail the webhook
    console.error("Failed to send confirmation email:", emailError);
  }
}

async function handlePaymentSucceeded(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  if (!paymentIntent.id) {
    throw new Error("Invalid payment intent data");
  }

  console.log(`Processing payment success: ${paymentIntent.id}`);

  const { error } = await supabase
    .from("orders")
    .update({ 
      status: "processing",
      payment_received_at: new Date().toISOString()
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

async function handlePaymentFailed(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  if (!paymentIntent.id) {
    throw new Error("Invalid payment intent data");
  }

  console.log(`Processing payment failure: ${paymentIntent.id}`);

  const { error } = await supabase
    .from("orders")
    .update({ 
      status: "payment_failed",
      payment_error: paymentIntent.last_payment_error?.message
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  // Could trigger a payment failure email here
}

async function handleCustomerCreated(supabase: any, customer: Stripe.Customer) {
  if (!customer.id || !customer.email) {
    console.log("Skipping customer creation - missing required data");
    return;
  }

  console.log(`Processing new customer: ${customer.id}`);

  // Check if customer already exists
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", customer.email)
    .single();

  if (!existingCustomer) {
    const { error } = await supabase
      .from("customers")
      .insert({
        email: customer.email,
        first_name: customer.name?.split(" ")[0],
        last_name: customer.name?.split(" ").slice(1).join(" "),
        phone: customer.phone,
        stripe_customer_id: customer.id,
      });

    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  } else {
    // Update existing customer with Stripe ID
    await supabase
      .from("customers")
      .update({ stripe_customer_id: customer.id })
      .eq("id", existingCustomer.id);
  }
}

async function handleDisputeCreated(supabase: any, dispute: Stripe.Dispute) {
  console.log(`Processing dispute: ${dispute.id}`);
  
  // Log dispute for manual review
  await supabase
    .from("payment_disputes")
    .insert({
      stripe_dispute_id: dispute.id,
      payment_intent_id: dispute.payment_intent,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      created_at: new Date(dispute.created * 1000).toISOString(),
    });

  // Could trigger an alert email to admins here
}

async function sendOrderConfirmationEmail(supabase: any, session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) return;

  const orderData = {
    orderId: session.metadata?.order_id || session.id,
    customerEmail,
    customerName: session.customer_details?.name || "Valued Customer",
    total: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error("Failed to trigger order confirmation email");
  }
}

// Apply webhook rate limiting (1000 requests/minute)
const protectedHandler = rateLimitedEndpoints.webhook(handleStripeWebhook);

// Serve the protected endpoint
serve(protectedHandler);