import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../email-service/index.ts'

interface WelcomeEmailData {
  customerEmail: string
  customerName: string
  isFirstTime?: boolean
}

function generateWelcomeHTML(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welcome to Our Store!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 700;">Welcome ${data.isFirstTime ? 'to Our Store' : 'Back'}!</h1>
          <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.9;">
            ${data.isFirstTime ? "We're excited to have you join our community" : "Great to see you again"}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px;">
          <div style="margin-bottom: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Hi ${data.customerName},</h2>
            <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.6; font-size: 16px;">
              ${data.isFirstTime 
                ? "Thank you for creating an account with us! We're thrilled to welcome you to our community of happy customers."
                : "Welcome back! We're glad to see you again and appreciate your continued trust in us."
              }
            </p>
            <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 16px;">
              ${data.isFirstTime
                ? "Here's what you can expect from us:"
                : "Here's what's new since your last visit:"
              }
            </p>
          </div>

          <!-- Benefits -->
          <div style="margin-bottom: 32px;">
            <div style="display: grid; gap: 16px;">
              <div style="display: flex; align-items: start; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                <div style="background-color: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold;">✓</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">Exclusive Member Discounts</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Get early access to sales and member-only promotions</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: start; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981;">
                <div style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold;">🚚</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">Fast & Free Shipping</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Free shipping on orders over $50</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: start; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <div style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold;">⭐</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">Loyalty Rewards</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Earn points with every purchase and unlock exclusive rewards</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ${data.isFirstTime ? 'Start Shopping' : 'Continue Shopping'}
            </a>
          </div>

          ${data.isFirstTime ? `
          <!-- First-time bonus -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 32px;">
            <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 18px;">🎉 Welcome Bonus!</h3>
            <p style="margin: 0 0 12px 0; color: #92400e; font-size: 14px;">Use code <strong>WELCOME10</strong> for 10% off your first order</p>
            <p style="margin: 0; color: #92400e; font-size: 12px;">Valid for 30 days</p>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Questions? We're here to help! Contact us at 
              <a href="mailto:support@yourstore.com" style="color: #667eea; text-decoration: none;">support@yourstore.com</a>
            </p>
            <div style="margin-top: 20px;">
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Follow us</a>
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Facebook</a>
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Instagram</a>
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Twitter</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateWelcomeText(data: WelcomeEmailData): string {
  return `
Welcome ${data.isFirstTime ? 'to Our Store' : 'Back'}!

Hi ${data.customerName},

${data.isFirstTime 
  ? "Thank you for creating an account with us! We're thrilled to welcome you to our community of happy customers."
  : "Welcome back! We're glad to see you again and appreciate your continued trust in us."
}

What you can expect from us:
• Exclusive member discounts and early access to sales
• Fast & free shipping on orders over $50
• Loyalty rewards program with points and exclusive benefits

${data.isFirstTime ? `
🎉 Welcome Bonus!
Use code WELCOME10 for 10% off your first order
Valid for 30 days
` : ''}

Questions? Contact us at support@yourstore.com

Thank you for choosing us!
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailData: WelcomeEmailData = await req.json()
    
    if (!emailData.customerEmail || !emailData.customerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: customerEmail and customerName' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailTemplate = {
      to: emailData.customerEmail,
      subject: `Welcome ${emailData.isFirstTime ? 'to Our Store' : 'Back'}, ${emailData.customerName}!`,
      html: generateWelcomeHTML(emailData),
      text: generateWelcomeText(emailData)
    }

    const success = await sendEmail(emailTemplate)
    
    if (success) {
      console.log(`Welcome email sent to ${emailData.customerEmail}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 'Welcome email sent successfully' : 'Failed to send welcome email'
      }),
      { 
        status: success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Welcome email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})