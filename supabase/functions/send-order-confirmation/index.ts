import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../email-service/index.ts'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface OrderData {
  orderId: string
  customerEmail: string
  customerName: string
  items: OrderItem[]
  total: number
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  orderDate: string
}

function generateOrderConfirmationHTML(order: OrderData): string {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px 0; display: flex; align-items: center;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 16px; border-radius: 8px;">` : ''}
        <div>
          <div style="font-weight: 600; color: #111827;">${item.name}</div>
          <div style="color: #6b7280; font-size: 14px;">Quantity: ${item.quantity}</div>
        </div>
      </td>
      <td style="padding: 16px 0; text-align: right; font-weight: 600; color: #111827;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
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
              Your order has been confirmed and will be shipped soon. Here are your order details:
            </p>
          </div>

          <!-- Order Info -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Order Number</div>
                <div style="font-weight: 600; color: #111827;">#${order.orderId}</div>
              </div>
              <div>
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Order Date</div>
                <div style="font-weight: 600; color: #111827;">${new Date(order.orderDate).toLocaleDateString()}</div>
              </div>
            </div>
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
              <a href="mailto:support@yourstore.com" style="color: #667eea; text-decoration: none;">support@yourstore.com</a>
            </p>
            <div style="margin-top: 16px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Track Your Order
              </a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateOrderConfirmationText(order: OrderData): string {
  const itemsList = order.items.map(item => 
    `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n')

  return `
Order Confirmation - Thank you for your purchase!

Hi ${order.customerName},

Your order has been confirmed and will be shipped soon.

Order Details:
Order Number: #${order.orderId}
Order Date: ${new Date(order.orderDate).toLocaleDateString()}

Items:
${itemsList}

Total: $${order.total.toFixed(2)}

Shipping Address:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
${order.shippingAddress.country}

Questions about your order? Contact us at support@yourstore.com

Thank you for shopping with us!
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const orderData: OrderData = await req.json()
    
    // Validate required fields
    if (!orderData.customerEmail || !orderData.orderId || !orderData.items?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required order data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailTemplate = {
      to: orderData.customerEmail,
      subject: `Order Confirmation #${orderData.orderId} - Thank you for your purchase!`,
      html: generateOrderConfirmationHTML(orderData),
      text: generateOrderConfirmationText(orderData)
    }

    const success = await sendEmail(emailTemplate)
    
    if (success) {
      console.log(`Order confirmation email sent to ${orderData.customerEmail} for order #${orderData.orderId}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 'Order confirmation email sent successfully' : 'Failed to send order confirmation email'
      }),
      { 
        status: success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Order confirmation email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})