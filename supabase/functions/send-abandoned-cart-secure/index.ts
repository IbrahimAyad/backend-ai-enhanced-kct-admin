import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateEmail, sanitizeString, validateAmount } from '../_shared/validation.ts';
import { checkRateLimit, sanitizeErrorMessage } from '../_shared/webhook-security.ts';

// Environment validation
const SENDGRID_API_KEY = Deno.env.get('KCT-Email-Key') || Deno.env.get('SENDGRID_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VERIFIED_SENDER_EMAIL = Deno.env.get('VERIFIED_SENDER_EMAIL') || 'cart@kctmenswear.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'KCT Menswear';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@kctmenswear.com';
const STORE_URL = Deno.env.get('STORE_URL') || 'https://kctmenswear.com';

if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Constants
const MAX_NAME_LENGTH = 100;
const MAX_ITEM_NAME_LENGTH = 200;
const MAX_VARIANT_LENGTH = 100;
const MAX_IMAGE_URL_LENGTH = 500;
const MAX_CART_ITEMS = 50;
const MAX_HOURS_ABANDONED = 720; // 30 days
const ALLOWED_CART_DOMAINS = [
  'kctmenswear.com',
  'www.kctmenswear.com',
  'localhost'
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

interface AbandonedCartData {
  customerEmail: string;
  customerName: string;
  cartItems: CartItem[];
  cartTotal: number;
  cartUrl: string;
  hoursAbandoned: number;
}

function isValidCartUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || 
           (urlObj.protocol === 'http:' && urlObj.hostname === 'localhost');
  } catch {
    return false;
  }
}

function isAllowedCartDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_CART_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function generateSecureAbandonedCartHTML(data: AbandonedCartData): string {
  const itemsHTML = data.cartItems.slice(0, 3).map(item => {
    const imageHtml = item.image 
      ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 16px; border-radius: 8px;" onerror="this.style.display='none'">` 
      : '';
    
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px 0;">
          <div style="display: flex; align-items: center;">
            ${imageHtml}
            <div>
              <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.name}</div>
              ${item.variant ? `<div style="color: #6b7280; font-size: 12px;">${item.variant}</div>` : ''}
              <div style="color: #6b7280; font-size: 12px;">Qty: ${item.quantity}</div>
            </div>
          </div>
        </td>
        <td style="padding: 16px 0; text-align: right; font-weight: 600; color: #111827;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const remainingItems = data.cartItems.length - 3;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>You left something in your cart! - KCT Menswear</title>
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
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🛒 Don't Miss Out!</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Your items are waiting for you</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">Hi ${data.customerName},</h2>
            <p style="margin: 0 0 16px 0; color: #374151; line-height: 1.6;">
              We noticed you left some great items in your cart ${data.hoursAbandoned} hours ago. 
              Don't let them slip away – complete your purchase now!
            </p>
          </div>

          <!-- Urgency Banner -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <h3 style="margin: 0 0 4px 0; color: #92400e; font-size: 16px;">⏰ Limited Time!</h3>
            <p style="margin: 0; color: #92400e; font-size: 14px;">Complete your purchase in the next 24 hours to secure these items</p>
          </div>

          <!-- Cart Items -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">Your Reserved Items</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
              ${itemsHTML}
              ${remainingItems > 0 ? `
              <tr>
                <td colspan="2" style="padding: 16px; text-align: center; color: #6b7280; font-size: 14px; font-style: italic;">
                  + ${remainingItems} more item${remainingItems > 1 ? 's' : ''} in your cart
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Total -->
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; color: #374151;">Cart Total:</span>
              <span style="font-size: 20px; font-weight: 700; color: #111827;">$${data.cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <!-- Special Offer -->
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #10b981 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; color: #065f46; font-size: 18px;">💰 Special Offer Just for You!</h3>
            <p style="margin: 0 0 12px 0; color: #065f46; font-size: 14px;">
              Complete your purchase now and get <strong>FREE SHIPPING</strong> on this order!
            </p>
            <p style="margin: 0; color: #065f46; font-size: 12px;">Use code: FREESHIP24</p>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${data.cartUrl}?utm_source=email&utm_medium=abandoned_cart&utm_campaign=cart_recovery" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
              Complete My Purchase
            </a>
          </div>

          <!-- Social Proof -->
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">⭐⭐⭐⭐⭐</p>
            <p style="margin: 0; color: #6b7280; font-size: 13px; font-style: italic;">
              "Fast shipping and excellent quality! Highly recommend." - Sarah M., Verified Customer
            </p>
          </div>

          <!-- Alternative Actions -->
          <div style="text-align: center; margin-bottom: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">Need help deciding?</p>
            <div>
              <a href="${STORE_URL}/contact" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px;">📞 Call Us</a>
              <a href="${STORE_URL}/chat" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px;">💬 Live Chat</a>
              <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px;">📧 Email Support</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Questions about your cart? Contact us at 
              <a href="mailto:${SUPPORT_EMAIL}" style="color: #f59e0b; text-decoration: none;">${SUPPORT_EMAIL}</a>
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This cart was last updated ${data.hoursAbandoned} hours ago. Items may sell out quickly!
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              This is a transactional email about your cart at KCT Menswear.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSecureAbandonedCartText(data: AbandonedCartData): string {
  const itemsList = data.cartItems.map(item => 
    `- ${item.name} ${item.variant ? `(${item.variant})` : ''} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  return `
🛒 Don't Miss Out! Your items are waiting for you - KCT Menswear

Hi ${data.customerName},

We noticed you left some great items in your cart ${data.hoursAbandoned} hours ago. Don't let them slip away – complete your purchase now!

⏰ LIMITED TIME: Complete your purchase in the next 24 hours to secure these items.

Your Reserved Items:
${itemsList}

Cart Total: $${data.cartTotal.toFixed(2)}

💰 SPECIAL OFFER JUST FOR YOU!
Complete your purchase now and get FREE SHIPPING on this order!
Use code: FREESHIP24

Complete your purchase: ${data.cartUrl}?utm_source=email&utm_medium=abandoned_cart&utm_campaign=cart_recovery

⭐⭐⭐⭐⭐ "Fast shipping and excellent quality! Highly recommend." - Sarah M., Verified Customer

Need help deciding?
📞 Call Us | 💬 Live Chat | 📧 Email Support at ${SUPPORT_EMAIL}

This cart was last updated ${data.hoursAbandoned} hours ago. Items may sell out quickly!

---
This is a transactional email about your cart at KCT Menswear.
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
  const rateLimitResult = checkRateLimit(`abandoned-cart:${clientIp}`);
  
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
    let cartData: AbandonedCartData;
    try {
      cartData = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Validate customer email
    if (!cartData.customerEmail) {
      throw new Error('Customer email is required');
    }

    const emailValidation = validateEmail(cartData.customerEmail);
    if (!emailValidation.isValid) {
      throw new Error('Invalid customer email format');
    }

    // Validate and sanitize customer name
    if (!cartData.customerName) {
      throw new Error('Customer name is required');
    }

    const customerName = sanitizeString(cartData.customerName, MAX_NAME_LENGTH);
    if (!customerName) {
      throw new Error('Invalid customer name');
    }

    // Validate cart items
    if (!Array.isArray(cartData.cartItems) || cartData.cartItems.length === 0) {
      throw new Error('Cart must contain at least one item');
    }

    if (cartData.cartItems.length > MAX_CART_ITEMS) {
      throw new Error(`Too many cart items (max ${MAX_CART_ITEMS})`);
    }

    // Validate and sanitize cart items
    const sanitizedItems: CartItem[] = [];
    let calculatedTotal = 0;

    for (let i = 0; i < cartData.cartItems.length; i++) {
      const item = cartData.cartItems[i];
      
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

      const sanitizedItem: CartItem = {
        id: sanitizeString(item.id || '', 50),
        name: sanitizeString(item.name, MAX_ITEM_NAME_LENGTH),
        price: priceValidation.sanitized!,
        quantity: quantity
      };

      // Validate variant if provided
      if (item.variant) {
        sanitizedItem.variant = sanitizeString(item.variant, MAX_VARIANT_LENGTH);
      }

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

    // Validate cart total
    const totalValidation = validateAmount(cartData.cartTotal, { min: 0, max: 100000 });
    if (!totalValidation.isValid) {
      throw new Error('Invalid cart total');
    }

    // Validate total matches calculated total (with small tolerance for rounding)
    if (Math.abs(calculatedTotal - totalValidation.sanitized!) > 0.01) {
      console.warn(`Cart total mismatch: calculated ${calculatedTotal}, provided ${totalValidation.sanitized}`);
    }

    // Validate cart URL
    if (!cartData.cartUrl || typeof cartData.cartUrl !== 'string') {
      throw new Error('Cart URL is required');
    }

    const cartUrl = sanitizeString(cartData.cartUrl, 500);
    if (!cartUrl || !isValidCartUrl(cartUrl) || !isAllowedCartDomain(cartUrl)) {
      throw new Error('Invalid or unauthorized cart URL');
    }

    // Validate hours abandoned
    const hoursAbandoned = parseInt(String(cartData.hoursAbandoned));
    if (isNaN(hoursAbandoned) || hoursAbandoned < 0 || hoursAbandoned > MAX_HOURS_ABANDONED) {
      throw new Error('Invalid hours abandoned value');
    }

    // Prepare sanitized data
    const sanitizedData: AbandonedCartData = {
      customerEmail: emailValidation.sanitized!,
      customerName: customerName,
      cartItems: sanitizedItems,
      cartTotal: totalValidation.sanitized!,
      cartUrl: cartUrl,
      hoursAbandoned: hoursAbandoned
    };

    // Generate email content
    const emailHtml = generateSecureAbandonedCartHTML(sanitizedData);
    const emailText = generateSecureAbandonedCartText(sanitizedData);

    // Send email via SendGrid
    const emailPayload = {
      personalizations: [{
        to: [{ email: sanitizedData.customerEmail }],
        subject: `🛒 ${sanitizedData.customerName}, you left something in your cart!`
      }],
      from: {
        email: VERIFIED_SENDER_EMAIL,
        name: SENDER_NAME
      },
      content: [
        { type: "text/plain", value: emailText },
        { type: "text/html", value: emailHtml }
      ],
      categories: ['abandoned_cart', 'marketing', 'transactional'],
      custom_args: {
        customer_email: sanitizedData.customerEmail,
        cart_total: sanitizedData.cartTotal.toString(),
        items_count: sanitizedData.cartItems.length.toString(),
        hours_abandoned: sanitizedData.hoursAbandoned.toString()
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
        recipient_email: sanitizedData.customerEmail,
        email_type: 'abandoned_cart',
        template_id: 'abandoned-cart',
        status: success ? 'sent' : 'failed',
        error_message: success ? null : `SendGrid error: ${response.status}`,
        sent_at: success ? new Date().toISOString() : null,
        metadata: {
          customer_name: sanitizedData.customerName,
          cart_total: sanitizedData.cartTotal,
          items_count: sanitizedData.cartItems.length,
          hours_abandoned: sanitizedData.hoursAbandoned
        }
      });

    // Log the abandoned cart email for analytics
    if (success) {
      await supabase
        .from('abandoned_cart_emails')
        .insert({
          customer_email: sanitizedData.customerEmail,
          cart_total: sanitizedData.cartTotal,
          items_count: sanitizedData.cartItems.length,
          hours_abandoned: sanitizedData.hoursAbandoned,
          sent_at: new Date().toISOString()
        });
    }

    if (!success) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      throw new Error('Failed to send abandoned cart email');
    }

    console.log(`Abandoned cart email sent to ${sanitizedData.customerEmail}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Abandoned cart email sent successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Abandoned cart email error:', error);
    
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 :
                      error.message?.includes('Invalid') ? 400 :
                      error.message?.includes('required') ? 400 :
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