import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateEmail, sanitizeString } from '../_shared/validation.ts';
import { checkRateLimit, sanitizeErrorMessage } from '../_shared/webhook-security.ts';

// Environment validation
const SENDGRID_API_KEY = Deno.env.get('KCT-Email-Key') || Deno.env.get('SENDGRID_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VERIFIED_SENDER_EMAIL = Deno.env.get('VERIFIED_SENDER_EMAIL') || 'security@kctmenswear.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'KCT Menswear Security';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@kctmenswear.com';
const SECURITY_EMAIL = Deno.env.get('SECURITY_EMAIL') || 'security@kctmenswear.com';

if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Constants
const MAX_NAME_LENGTH = 100;
const MAX_TOKEN_LENGTH = 200;
const MAX_URL_LENGTH = 500;
const ALLOWED_RESET_DOMAINS = [
  'kctmenswear.com',
  'www.kctmenswear.com',
  'admin.kctmenswear.com',
  'localhost'
];

interface PasswordResetData {
  customerEmail: string;
  customerName: string;
  resetToken: string;
  resetUrl: string;
  requestIp?: string;
}

function isValidResetUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || 
           (urlObj.protocol === 'http:' && urlObj.hostname === 'localhost');
  } catch {
    return false;
  }
}

function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_RESET_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function generateSecurePasswordResetHTML(data: PasswordResetData): string {
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Password - KCT Menswear</title>
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
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🔒 Reset Your Password</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Secure password reset request</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 20px;">Hi ${data.customerName},</h2>
            <p style="margin: 0 0 16px 0; color: #374151; line-height: 1.6;">
              We received a request to reset the password for your KCT Menswear account. If you made this request, click the button below to reset your password.
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>

          <!-- Security Alert -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-start;">
              <div style="color: #f59e0b; margin-right: 12px; font-size: 20px;">⚠️</div>
              <div>
                <h4 style="margin: 0 0 4px 0; color: #92400e; font-size: 14px; font-weight: 600;">Security Notice</h4>
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.4;">
                  This reset link will expire in 1 hour for your security. If you didn't request this, please contact our support team immediately.
                </p>
              </div>
            </div>
          </div>

          <!-- Reset Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${data.resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Reset My Password
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
              Button not working? Copy and paste this link into your browser:
            </p>
            <p style="margin: 0; word-break: break-all; color: #6b7280; font-size: 13px; font-family: monospace; background-color: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">
              ${data.resetUrl}
            </p>
          </div>

          <!-- Security Tips -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px;">🛡️ Password Security Tips</h3>
            <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
              <li>Use at least 8 characters with a mix of letters, numbers, and symbols</li>
              <li>Don't reuse passwords from other accounts</li>
              <li>Consider using a password manager</li>
              <li>Enable two-factor authentication when available</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            ${data.requestIp ? `
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              This password reset was requested from IP address: ${data.requestIp}
            </p>
            ` : ''}
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              If you have concerns about your account security, contact us at 
              <a href="mailto:${SECURITY_EMAIL}" style="color: #dc2626; text-decoration: none;">${SECURITY_EMAIL}</a>
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This link expires in 1 hour • Sent at ${currentTime}
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              This is a transactional security email from KCT Menswear.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSecurePasswordResetText(data: PasswordResetData): string {
  const currentTime = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
Password Reset Request - KCT Menswear

Hi ${data.customerName},

We received a request to reset the password for your KCT Menswear account. If you made this request, use the link below to reset your password:

${data.resetUrl}

Security Notice:
- This reset link will expire in 1 hour for your security
- If you didn't request this, please ignore this email
- If you have concerns, contact us at ${SECURITY_EMAIL}

Password Security Tips:
• Use at least 8 characters with a mix of letters, numbers, and symbols
• Don't reuse passwords from other accounts
• Consider using a password manager
• Enable two-factor authentication when available

${data.requestIp ? `This password reset was requested from IP address: ${data.requestIp}` : ''}

This link expires in 1 hour.
Sent at ${currentTime}

If you have any questions, contact our support team at ${SUPPORT_EMAIL}

---
This is a transactional security email from KCT Menswear.
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

  // Stricter rate limiting for password reset (security-critical)
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = checkRateLimit(`password-reset:${clientIp}`, 5, 60); // 5 per minute max
  
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

    // Verify authorization (must be service role for security)
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || token !== SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Unauthorized - Service role required for password reset');
    }

    // Parse and validate request
    let resetData: PasswordResetData;
    try {
      resetData = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Validate customer email
    if (!resetData.customerEmail) {
      throw new Error('Customer email is required');
    }

    const emailValidation = validateEmail(resetData.customerEmail);
    if (!emailValidation.isValid) {
      throw new Error('Invalid customer email format');
    }

    // Validate and sanitize customer name
    if (!resetData.customerName) {
      throw new Error('Customer name is required');
    }

    const customerName = sanitizeString(resetData.customerName, MAX_NAME_LENGTH);
    if (!customerName) {
      throw new Error('Invalid customer name');
    }

    // Validate reset token
    if (!resetData.resetToken || typeof resetData.resetToken !== 'string') {
      throw new Error('Reset token is required');
    }

    const resetToken = sanitizeString(resetData.resetToken, MAX_TOKEN_LENGTH);
    if (!resetToken || resetToken.length < 16) {
      throw new Error('Invalid reset token');
    }

    // Validate reset URL
    if (!resetData.resetUrl || typeof resetData.resetUrl !== 'string') {
      throw new Error('Reset URL is required');
    }

    const resetUrl = sanitizeString(resetData.resetUrl, MAX_URL_LENGTH);
    if (!resetUrl || !isValidResetUrl(resetUrl) || !isAllowedDomain(resetUrl)) {
      throw new Error('Invalid or unauthorized reset URL');
    }

    // Validate and sanitize request IP if provided
    let requestIp: string | undefined;
    if (resetData.requestIp) {
      requestIp = sanitizeString(resetData.requestIp, 45); // Max IPv6 length
    }

    // Prepare sanitized data
    const sanitizedData: PasswordResetData = {
      customerEmail: emailValidation.sanitized!,
      customerName: customerName,
      resetToken: resetToken,
      resetUrl: resetUrl,
      requestIp: requestIp
    };

    // Generate email content
    const emailHtml = generateSecurePasswordResetHTML(sanitizedData);
    const emailText = generateSecurePasswordResetText(sanitizedData);

    // Send email via SendGrid
    const emailPayload = {
      personalizations: [{
        to: [{ email: sanitizedData.customerEmail }],
        subject: '🔒 Reset Your Password - Action Required'
      }],
      from: {
        email: VERIFIED_SENDER_EMAIL,
        name: SENDER_NAME
      },
      content: [
        { type: "text/plain", value: emailText },
        { type: "text/html", value: emailHtml }
      ],
      categories: ['password_reset', 'security', 'transactional'],
      custom_args: {
        customer_email: sanitizedData.customerEmail,
        request_ip: sanitizedData.requestIp || 'unknown',
        token_length: sanitizedData.resetToken.length.toString()
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

    // Log password reset email attempt (critical for security audit)
    await supabase
      .from('email_logs')
      .insert({
        recipient_email: sanitizedData.customerEmail,
        email_type: 'password_reset',
        template_id: 'password-reset',
        status: success ? 'sent' : 'failed',
        error_message: success ? null : `SendGrid error: ${response.status}`,
        sent_at: success ? new Date().toISOString() : null,
        metadata: {
          customer_name: sanitizedData.customerName,
          request_ip: sanitizedData.requestIp,
          token_length: sanitizedData.resetToken.length,
          reset_url_domain: new URL(sanitizedData.resetUrl).hostname
        }
      });

    if (!success) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log(`Password reset email sent to ${sanitizedData.customerEmail} from IP ${sanitizedData.requestIp || 'unknown'}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password reset email sent successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Password reset email error:', error);
    
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