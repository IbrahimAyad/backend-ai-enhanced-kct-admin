import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../email-service/index.ts'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
}

interface AbandonedCartData {
  customerEmail: string
  customerName: string
  cartItems: CartItem[]
  cartTotal: number
  cartUrl: string
  hoursAbandoned: number
}

function generateAbandonedCartHTML(data: AbandonedCartData): string {
  const itemsHTML = data.cartItems.slice(0, 3).map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px 0; display: flex; align-items: center;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 16px; border-radius: 8px;">` : ''}
        <div>
          <div style="font-weight: 600; color: #111827; font-size: 14px;">${item.name}</div>
          ${item.variant ? `<div style="color: #6b7280; font-size: 12px;">${item.variant}</div>` : ''}
          <div style="color: #6b7280; font-size: 12px;">Qty: ${item.quantity}</div>
        </div>
      </td>
      <td style="padding: 16px 0; text-align: right; font-weight: 600; color: #111827;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const remainingItems = data.cartItems.length - 3;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>You left something in your cart!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
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
              <a href="#" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px;">📞 Call Us</a>
              <a href="#" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px;">💬 Live Chat</a>
              <a href="#" style="color: #667eea; text-decoration: none; margin: 0 12px; font-size: 14px;">📧 Email Support</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Questions about your cart? Contact us at 
              <a href="mailto:support@yourstore.com" style="color: #f59e0b; text-decoration: none;">support@yourstore.com</a>
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This cart was last updated ${data.hoursAbandoned} hours ago. Items may sell out quickly!
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAbandonedCartText(data: AbandonedCartData): string {
  const itemsList = data.cartItems.map(item => 
    `- ${item.name} ${item.variant ? `(${item.variant})` : ''} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n')

  return `
🛒 Don't Miss Out! Your items are waiting for you

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
📞 Call Us | 💬 Live Chat | 📧 Email Support at support@yourstore.com

This cart was last updated ${data.hoursAbandoned} hours ago. Items may sell out quickly!
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const cartData: AbandonedCartData = await req.json()
    
    if (!cartData.customerEmail || !cartData.customerName || !cartData.cartItems?.length || !cartData.cartUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: customerEmail, customerName, cartItems, and cartUrl' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailTemplate = {
      to: cartData.customerEmail,
      subject: `🛒 ${cartData.customerName}, you left something in your cart!`,
      html: generateAbandonedCartHTML(cartData),
      text: generateAbandonedCartText(cartData)
    }

    const success = await sendEmail(emailTemplate)
    
    if (success) {
      console.log(`Abandoned cart email sent to ${cartData.customerEmail}`)
      
      // Log the abandoned cart email for analytics
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      )

      await supabase
        .from('abandoned_cart_emails')
        .insert({
          customer_email: cartData.customerEmail,
          cart_total: cartData.cartTotal,
          items_count: cartData.cartItems.length,
          hours_abandoned: cartData.hoursAbandoned,
          sent_at: new Date().toISOString()
        })
    }
    
    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 'Abandoned cart email sent successfully' : 'Failed to send abandoned cart email'
      }),
      { 
        status: success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Abandoned cart email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})