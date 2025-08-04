import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateEmail, validateAmount, sanitizeString, validateAddress } from '../_shared/validation.ts';
import { createRateLimitedEndpoint } from '../_shared/rate-limit-middleware.ts';
import { sanitizeErrorMessage } from '../_shared/webhook-security.ts';

// Environment validation
const SENDGRID_API_KEY = Deno.env.get('KCT-Email-Key') || Deno.env.get('SENDGRID_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VERIFIED_SENDER_EMAIL = Deno.env.get('VERIFIED_SENDER_EMAIL') || 'orders@kctmenswear.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'KCT Menswear';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@kctmenswear.com';
const ORDER_TRACKING_URL = Deno.env.get('ORDER_TRACKING_URL') || 'https://kctmenswear.com/track-order';

if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Constants
const MAX_ORDER_ITEMS = 100;
const MAX_ITEM_NAME_LENGTH = 200;
const MAX_IMAGE_URL_LENGTH = 500;

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface OrderData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderDate: string;
}

function isValidOrderId(orderId: string): boolean {
  // Order ID should be alphanumeric, dash, or underscore, max 50 chars
  const orderIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  return orderIdRegex.test(orderId);
}

function generateSecureOrderConfirmationHTML(order: OrderData): string {
  const itemsHTML = order.items.map(item => {
    const imageHtml = item.image 
      ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 16px; border-radius: 8px;" onerror="this.style.display='none'">` 
      : '';
    
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px 0;">
          <div style="display: flex; align-items: center;">
            ${imageHtml}
            <div>
              <div style="font-weight: 600; color: #111827;">${item.name}</div>
              <div style="color: #6b7280; font-size: 14px;">Quantity: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding: 16px 0; text-align: right; font-weight: 600; color: #111827;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const orderDateFormatted = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Confirmation - KCT Menswear</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your purchase</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">Hi ${order.customerName},</h2>
            <p style="margin: 0; color: #6b7280; line-height: 1.6;">
              Your order has been confirmed and will be shipped within 1-2 business days. Here are your order details:
            </p>
          </div>

          <!-- Order Info -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 50%;">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Order Number</div>
                  <div style="font-weight: 600; color: #111827;">#${order.orderId}</div>
                </td>
                <td style="width: 50%; text-align: right;">
                  <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Order Date</div>
                  <div style="font-weight: 600; color: #111827;">${orderDateFormatted}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Items -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHTML}
            </table>
          </div>

          <!-- Total -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 700; color: #111827;">
                Total: $${order.total.toFixed(2)}
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">Shipping Address</h3>
            <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; color: #374151; line-height: 1.5;">
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
              ${order.shippingAddress.country}
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; color: #6b7280;">
              Questions about your order? Contact us at 
              <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea; text-decoration: none;">${SUPPORT_EMAIL}</a>
            </p>
            <div style="margin-top: 16px;">
              <a href="${ORDER_TRACKING_URL}?order=${order.orderId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Track Your Order
              </a>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
              This is a transactional email regarding your order. You received this email because you made a purchase at KCT Menswear.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSecureOrderConfirmationText(order: OrderData): string {
  const itemsList = order.items.map(item => 
    `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  const orderDateFormatted = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
Order Confirmation - Thank you for your purchase at KCT Menswear!

Hi ${order.customerName},

Your order has been confirmed and will be shipped within 1-2 business days.

Order Details:
Order Number: #${order.orderId}
Order Date: ${orderDateFormatted}

Items:
${itemsList}

Total: $${order.total.toFixed(2)}

Shipping Address:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
${order.shippingAddress.country}

Track your order: ${ORDER_TRACKING_URL}?order=${order.orderId}

Questions about your order? Contact us at ${SUPPORT_EMAIL}

Thank you for shopping with KCT Menswear!

---
This is a transactional email regarding your order.
`;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = checkRateLimit(`order-confirmation:${clientIp}`);
  
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
    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    // Parse and validate request
    let orderData: OrderData;
    try {
      orderData = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Validate order ID
    if (!orderData.orderId || !isValidOrderId(orderData.orderId)) {
      throw new Error('Invalid order ID');
    }

    // Validate customer email
    const emailValidation = validateEmail(orderData.customerEmail);
    if (!emailValidation.isValid) {
      throw new Error('Invalid customer email');
    }

    // Validate customer name
    const customerName = sanitizeString(orderData.customerName || 'Valued Customer', 100);

    // Validate order items
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (orderData.items.length > MAX_ORDER_ITEMS) {
      throw new Error(`Too many order items (max ${MAX_ORDER_ITEMS})`);
    }

    // Validate and sanitize items
    const sanitizedItems: OrderItem[] = [];
    let calculatedTotal = 0;

    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      
      if (!item.name || typeof item.name !== 'string') {
        throw new Error(`Invalid item name at position ${i + 1}`);
      }

      const priceValidation = validateAmount(item.price, { min: 0, max: 10000 });
      if (!priceValidation.isValid) {
        throw new Error(`Invalid price for item ${i + 1}`);
      }

      const quantity = parseInt(String(item.quantity));
      if (isNaN(quantity) || quantity < 1 || quantity > 100) {
        throw new Error(`Invalid quantity for item ${i + 1}`);
      }

      const sanitizedItem: OrderItem = {
        id: sanitizeString(item.id || '', 50),
        name: sanitizeString(item.name, MAX_ITEM_NAME_LENGTH),
        price: priceValidation.sanitized!,
        quantity: quantity
      };

      // Validate image URL if provided
      if (item.image) {
        try {
          const imageUrl = new URL(item.image);
          if (imageUrl.protocol === 'https:' || (imageUrl.protocol === 'http:' && imageUrl.hostname === 'localhost')) {
            sanitizedItem.image = sanitizeString(item.image, MAX_IMAGE_URL_LENGTH);
          }
        } catch {
          // Invalid URL, skip image
        }
      }

      sanitizedItems.push(sanitizedItem);
      calculatedTotal += sanitizedItem.price * sanitizedItem.quantity;
    }

    // Validate total
    const totalValidation = validateAmount(orderData.total, { min: 0, max: 100000 });
    if (!totalValidation.isValid) {
      throw new Error('Invalid order total');
    }

    // Validate total matches calculated total (with small tolerance for rounding)
    if (Math.abs(calculatedTotal - totalValidation.sanitized!) > 0.01) {
      console.warn(`Order total mismatch: calculated ${calculatedTotal}, provided ${totalValidation.sanitized}`);
    }

    // Validate shipping address
    const addressValidation = validateAddress(orderData.shippingAddress, true);
    if (!addressValidation.isValid) {
      throw new Error(`Invalid shipping address: ${addressValidation.errors[0]}`);
    }

    // Validate order date
    let orderDate: Date;
    try {
      orderDate = new Date(orderData.orderDate);
      if (isNaN(orderDate.getTime())) {
        throw new Error();
      }
    } catch {
      orderDate = new Date(); // Default to now if invalid
    }

    // Prepare sanitized order data
    const sanitizedOrder: OrderData = {
      orderId: orderData.orderId,
      customerEmail: emailValidation.sanitized!,
      customerName: customerName,
      items: sanitizedItems,
      total: totalValidation.sanitized!,
      shippingAddress: addressValidation.sanitized!,
      orderDate: orderDate.toISOString()
    };

    // Generate email content
    const emailHtml = generateSecureOrderConfirmationHTML(sanitizedOrder);
    const emailText = generateSecureOrderConfirmationText(sanitizedOrder);

    // Send email via SendGrid
    const emailPayload = {
      personalizations: [{
        to: [{ email: sanitizedOrder.customerEmail }],
        subject: `Order Confirmation #${sanitizedOrder.orderId} - Thank you for your purchase!`
      }],
      from: {
        email: VERIFIED_SENDER_EMAIL,
        name: SENDER_NAME
      },
      content: [
        { type: "text/plain", value: emailText },
        { type: "text/html", value: emailHtml }
      ],
      categories: ['order_confirmation', 'transactional'],
      custom_args: {
        order_id: sanitizedOrder.orderId,
        customer_email: sanitizedOrder.customerEmail
      }
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const success = response.ok;

    // Log email send attempt
    await supabase
      .from('email_logs')
      .insert({
        recipient_email: sanitizedOrder.customerEmail,
        email_type: 'order_confirmation',
        template_id: 'order-confirmation',
        status: success ? 'sent' : 'failed',
        error_message: success ? null : `SendGrid error: ${response.status}`,
        sent_at: success ? new Date().toISOString() : null,
        metadata: {
          order_id: sanitizedOrder.orderId,
          order_total: sanitizedOrder.total,
          item_count: sanitizedOrder.items.length
        }
      });

    if (!success) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      throw new Error('Failed to send order confirmation email');
    }

    console.log(`Order confirmation email sent to ${sanitizedOrder.customerEmail} for order #${sanitizedOrder.orderId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Order confirmation email sent successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Order confirmation email error:', error);
    
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 :
                      error.message?.includes('Invalid') ? 400 :
                      error.message?.includes('Rate limit') ? 429 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});