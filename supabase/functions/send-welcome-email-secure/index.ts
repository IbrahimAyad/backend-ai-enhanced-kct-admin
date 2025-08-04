import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateEmail, sanitizeString } from '../_shared/validation.ts';
import { checkRateLimit, sanitizeErrorMessage } from '../_shared/webhook-security.ts';

// Environment validation
const SENDGRID_API_KEY = Deno.env.get('KCT-Email-Key') || Deno.env.get('SENDGRID_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VERIFIED_SENDER_EMAIL = Deno.env.get('VERIFIED_SENDER_EMAIL') || 'welcome@kctmenswear.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'KCT Menswear';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@kctmenswear.com';
const STORE_URL = Deno.env.get('STORE_URL') || 'https://kctmenswear.com';

if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Constants
const MAX_NAME_LENGTH = 100;

interface WelcomeEmailData {
  customerEmail: string;
  customerName: string;
  isFirstTime?: boolean;
}

function generateSecureWelcomeHTML(data: WelcomeEmailData): string {
  const welcomeTitle = data.isFirstTime ? 'Welcome to KCT Menswear' : 'Welcome Back';
  const welcomeMessage = data.isFirstTime 
    ? "We're excited to have you join our community of style enthusiasts" 
    : "Great to see you again";
  
  const mainContent = data.isFirstTime
    ? "Thank you for creating an account with us! We're thrilled to welcome you to our community of happy customers."
    : "Welcome back! We're glad to see you again and appreciate your continued trust in us.";

  const benefitsTitle = data.isFirstTime
    ? "Here's what you can expect from us:"
    : "Here's what's new since your last visit:";

  const ctaText = data.isFirstTime ? 'Start Shopping' : 'Continue Shopping';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${welcomeTitle} - KCT Menswear</title>
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
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 700;">${welcomeTitle}!</h1>
          <p style="margin: 12px 0 0 0; font-size: 18px; opacity: 0.9;">
            ${welcomeMessage}
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 32px;">
          <div style="margin-bottom: 32px;">
            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Hi ${data.customerName},</h2>
            <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.6; font-size: 16px;">
              ${mainContent}
            </p>
            <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 16px;">
              ${benefitsTitle}
            </p>
          </div>

          <!-- Benefits -->
          <div style="margin-bottom: 32px;">
            <div style="margin-bottom: 16px;">
              <div style="display: flex; align-items: flex-start; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 12px;">
                <div style="background-color: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; font-size: 12px;">✓</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">Exclusive Member Discounts</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Get early access to sales and member-only promotions</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 12px;">
                <div style="background-color: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; font-size: 12px;">🚚</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">Fast & Free Shipping</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Free shipping on orders over $50</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: flex-start; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <div style="background-color: #f59e0b; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-weight: bold; font-size: 12px;">⭐</div>
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 16px;">Loyalty Rewards</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Earn points with every purchase and unlock exclusive rewards</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${STORE_URL}?utm_source=email&utm_medium=welcome&utm_campaign=welcome_email" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ${ctaText}
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
              <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea; text-decoration: none;">${SUPPORT_EMAIL}</a>
            </p>
            <div style="margin-top: 20px;">
              <a href="${STORE_URL}/social" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Follow us</a>
              <a href="${STORE_URL}/facebook" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Facebook</a>
              <a href="${STORE_URL}/instagram" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Instagram</a>
              <a href="${STORE_URL}/twitter" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 14px;">Twitter</a>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
              This is a transactional welcome email. You received this because you created an account at KCT Menswear.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSecureWelcomeText(data: WelcomeEmailData): string {
  const welcomeTitle = data.isFirstTime ? 'Welcome to KCT Menswear' : 'Welcome Back';
  const mainContent = data.isFirstTime
    ? "Thank you for creating an account with us! We're thrilled to welcome you to our community of happy customers."
    : "Welcome back! We're glad to see you again and appreciate your continued trust in us.";

  const ctaText = data.isFirstTime ? 'Start Shopping' : 'Continue Shopping';

  return `
${welcomeTitle}!

Hi ${data.customerName},

${mainContent}

What you can expect from us:
• Exclusive member discounts and early access to sales
• Fast & free shipping on orders over $50
• Loyalty rewards program with points and exclusive benefits

${data.isFirstTime ? `
🎉 Welcome Bonus!
Use code WELCOME10 for 10% off your first order
Valid for 30 days
` : ''}

${ctaText}: ${STORE_URL}?utm_source=email&utm_medium=welcome&utm_campaign=welcome_email

Questions? Contact us at ${SUPPORT_EMAIL}

Thank you for choosing KCT Menswear!

---
This is a transactional welcome email.
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
  const rateLimitResult = checkRateLimit(`welcome-email:${clientIp}`);
  
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
    let emailData: WelcomeEmailData;
    try {
      emailData = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Validate customer email
    if (!emailData.customerEmail) {
      throw new Error('Customer email is required');
    }

    const emailValidation = validateEmail(emailData.customerEmail);
    if (!emailValidation.isValid) {
      throw new Error('Invalid customer email format');
    }

    // Validate and sanitize customer name
    if (!emailData.customerName) {
      throw new Error('Customer name is required');
    }

    const customerName = sanitizeString(emailData.customerName, MAX_NAME_LENGTH);
    if (!customerName) {
      throw new Error('Invalid customer name');
    }

    // Validate isFirstTime flag
    const isFirstTime = Boolean(emailData.isFirstTime);

    // Prepare sanitized data
    const sanitizedData: WelcomeEmailData = {
      customerEmail: emailValidation.sanitized!,
      customerName: customerName,
      isFirstTime: isFirstTime
    };

    // Generate email content
    const emailHtml = generateSecureWelcomeHTML(sanitizedData);
    const emailText = generateSecureWelcomeText(sanitizedData);
    
    const welcomeTitle = sanitizedData.isFirstTime ? 'Welcome to KCT Menswear' : 'Welcome Back';

    // Send email via SendGrid
    const emailPayload = {
      personalizations: [{
        to: [{ email: sanitizedData.customerEmail }],
        subject: `${welcomeTitle}, ${sanitizedData.customerName}!`
      }],
      from: {
        email: VERIFIED_SENDER_EMAIL,
        name: SENDER_NAME
      },
      content: [
        { type: "text/plain", value: emailText },
        { type: "text/html", value: emailHtml }
      ],
      categories: ['welcome_email', 'transactional'],
      custom_args: {
        customer_email: sanitizedData.customerEmail,
        email_type: sanitizedData.isFirstTime ? 'first_time_welcome' : 'returning_welcome'
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
        email_type: 'welcome_email',
        template_id: 'welcome-email',
        status: success ? 'sent' : 'failed',
        error_message: success ? null : `SendGrid error: ${response.status}`,
        sent_at: success ? new Date().toISOString() : null,
        metadata: {
          is_first_time: sanitizedData.isFirstTime,
          customer_name: sanitizedData.customerName
        }
      });

    if (!success) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      throw new Error('Failed to send welcome email');
    }

    console.log(`Welcome email sent to ${sanitizedData.customerEmail}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Welcome email sent successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Welcome email error:', error);
    
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