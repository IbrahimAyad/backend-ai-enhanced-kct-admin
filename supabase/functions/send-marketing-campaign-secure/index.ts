import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateEmail, sanitizeString } from '../_shared/validation.ts';
import { checkRateLimit, sanitizeErrorMessage } from '../_shared/webhook-security.ts';

// Environment validation
const SENDGRID_API_KEY = Deno.env.get('KCT-Email-Key') || Deno.env.get('SENDGRID_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VERIFIED_SENDER_EMAIL = Deno.env.get('VERIFIED_SENDER_EMAIL') || 'marketing@kctmenswear.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'KCT Menswear';
const SUPPORT_EMAIL = Deno.env.get('SUPPORT_EMAIL') || 'support@kctmenswear.com';
const STORE_URL = Deno.env.get('STORE_URL') || 'https://kctmenswear.com';

if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Constants
const MAX_CAMPAIGN_ID_LENGTH = 100;
const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000; // 50KB
const MAX_SENDER_NAME_LENGTH = 100;
const MAX_PREVIEW_TEXT_LENGTH = 150;
const MAX_CTA_TEXT_LENGTH = 50;
const MAX_CTA_URL_LENGTH = 500;
const MAX_CUSTOMERS_PER_BATCH = 100;
const BATCH_DELAY_MS = 1000; // 1 second between batches

const ALLOWED_CUSTOMER_SEGMENTS = [
  'all',
  'vip',
  'loyal',
  'new',
  'at_risk',
  'active',
  'inactive',
  'high_value',
  'frequent_buyers'
];

const ALLOWED_CTA_DOMAINS = [
  'kctmenswear.com',
  'www.kctmenswear.com',
  'localhost'
];

interface MarketingCampaignData {
  campaignId: string;
  subject: string;
  content: string;
  customerSegment: string;
  senderName?: string;
  previewText?: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  segment?: string;
}

function isValidCtaUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || 
           (urlObj.protocol === 'http:' && urlObj.hostname === 'localhost');
  } catch {
    return false;
  }
}

function isAllowedCtaDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_CTA_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function generateSecureMarketingHTML(data: MarketingCampaignData, customer: Customer): string {
  const customerName = customer.first_name || 'Valued Customer';
  const senderName = data.senderName || SENDER_NAME;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${data.subject} - KCT Menswear</title>
      ${data.previewText ? `<meta name="description" content="${data.previewText}">` : ''}
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
        
        <!-- Preheader (hidden preview text) -->
        ${data.previewText ? `
        <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
          ${data.previewText}
        </div>
        ` : ''}

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">KCT Menswear</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
            Exclusive offer for our valued customers
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">
          <div style="margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 24px;">Hi ${customerName},</h2>
          </div>

          <!-- Campaign Content -->
          <div style="margin-bottom: 32px; color: #374151; line-height: 1.6; font-size: 16px;">
            ${data.content.replace(/\n/g, '<br>').replace(/\r/g, '')}
          </div>

          <!-- CTA Button -->
          ${data.ctaText && data.ctaUrl ? `
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${data.ctaUrl}?utm_source=email&utm_medium=campaign&utm_campaign=${encodeURIComponent(data.campaignId)}&customer_id=${customer.id}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ${data.ctaText}
            </a>
          </div>
          ` : ''}

          <!-- Personalization -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
              This email was sent to you because you're a valued ${customer.segment || 'customer'} in our community.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Questions? Contact us at 
              <a href="mailto:${SUPPORT_EMAIL}" style="color: #667eea; text-decoration: none;">${SUPPORT_EMAIL}</a>
            </p>
            <div style="margin-bottom: 16px;">
              <a href="${STORE_URL}/unsubscribe?email=${encodeURIComponent(customer.email)}&campaign=${encodeURIComponent(data.campaignId)}" style="color: #6b7280; text-decoration: none; margin: 0 8px; font-size: 12px;">Unsubscribe</a>
              <a href="${STORE_URL}/email-preferences?email=${encodeURIComponent(customer.email)}" style="color: #6b7280; text-decoration: none; margin: 0 8px; font-size: 12px;">Update Preferences</a>
              <a href="${STORE_URL}/email-view?campaign=${encodeURIComponent(data.campaignId)}" style="color: #6b7280; text-decoration: none; margin: 0 8px; font-size: 12px;">View in Browser</a>
            </div>
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
              Campaign ID: ${data.campaignId} | ${senderName}<br>
              You're receiving this because you subscribed to our newsletter.
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
              This is a marketing email from KCT Menswear.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateSecureMarketingText(data: MarketingCampaignData, customer: Customer): string {
  const customerName = customer.first_name || 'Valued Customer';
  const senderName = data.senderName || SENDER_NAME;
  
  return `
${data.subject}

Hi ${customerName},

${data.content}

${data.ctaText && data.ctaUrl ? `
${data.ctaText}: ${data.ctaUrl}?utm_source=email&utm_medium=campaign&utm_campaign=${encodeURIComponent(data.campaignId)}&customer_id=${customer.id}
` : ''}

This email was sent to you because you're a valued ${customer.segment || 'customer'} in our community.

Questions? Contact us at ${SUPPORT_EMAIL}

Campaign ID: ${data.campaignId} | ${senderName}

To unsubscribe: ${STORE_URL}/unsubscribe?email=${encodeURIComponent(customer.email)}&campaign=${encodeURIComponent(data.campaignId)}
To update preferences: ${STORE_URL}/email-preferences?email=${encodeURIComponent(customer.email)}

---
This is a marketing email from KCT Menswear.
`;
}

async function getCustomersBySegmentSecure(supabase: any, segment: string): Promise<Customer[]> {
  if (!ALLOWED_CUSTOMER_SEGMENTS.includes(segment)) {
    throw new Error('Invalid customer segment');
  }

  let query = supabase
    .from('customers')
    .select('id, email, first_name, last_name, segment, email_preferences')
    .eq('email_subscribed', true)
    .not('email', 'is', null)
    .limit(1000); // Prevent abuse

  // Apply segment filtering with proper validation
  if (segment !== 'all') {
    if (segment === 'vip') {
      query = query.eq('segment', 'VIP');
    } else if (segment === 'loyal') {
      query = query.eq('segment', 'Loyal');
    } else if (segment === 'new') {
      query = query.eq('segment', 'New');
    } else if (segment === 'at_risk') {
      query = query.eq('segment', 'At Risk');
    } else if (segment === 'active') {
      query = query.eq('segment', 'Active');
    } else if (segment === 'inactive') {
      query = query.eq('segment', 'Inactive');
    } else if (segment === 'high_value') {
      query = query.eq('segment', 'High Value');
    } else if (segment === 'frequent_buyers') {
      query = query.eq('segment', 'Frequent Buyers');
    }
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }

  return data || [];
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

  // Stricter rate limiting for marketing campaigns
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rateLimitResult = checkRateLimit(`marketing-campaign:${clientIp}`, 2, 60); // 2 per minute max
  
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

    // Verify authorization (must be admin for marketing campaigns)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    let isAuthorized = false;

    // Check if it's the service role key
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      isAuthorized = true;
    } else {
      // Check if it's a valid admin user token
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('user_id, permissions')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();
          
          if (adminUser && (adminUser.permissions?.includes('marketing') || adminUser.permissions?.includes('admin'))) {
            isAuthorized = true;
          }
        }
      } catch {
        // Invalid token
      }
    }

    if (!isAuthorized) {
      throw new Error('Unauthorized - Admin permission required for marketing campaigns');
    }

    // Parse and validate request
    let campaignData: MarketingCampaignData;
    try {
      campaignData = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    // Validate required fields
    if (!campaignData.campaignId || typeof campaignData.campaignId !== 'string') {
      throw new Error('Campaign ID is required');
    }

    if (!campaignData.subject || typeof campaignData.subject !== 'string') {
      throw new Error('Subject is required');
    }

    if (!campaignData.content || typeof campaignData.content !== 'string') {
      throw new Error('Content is required');
    }

    if (!campaignData.customerSegment || typeof campaignData.customerSegment !== 'string') {
      throw new Error('Customer segment is required');
    }

    // Sanitize and validate all fields
    const campaignId = sanitizeString(campaignData.campaignId, MAX_CAMPAIGN_ID_LENGTH);
    const subject = sanitizeString(campaignData.subject, MAX_SUBJECT_LENGTH);
    const content = sanitizeString(campaignData.content, MAX_CONTENT_LENGTH);
    const customerSegment = campaignData.customerSegment.toLowerCase();

    if (!campaignId || !subject || !content) {
      throw new Error('Invalid campaign data');
    }

    if (!ALLOWED_CUSTOMER_SEGMENTS.includes(customerSegment)) {
      throw new Error('Invalid customer segment');
    }

    // Validate optional fields
    let senderName: string | undefined;
    let previewText: string | undefined;
    let ctaText: string | undefined;
    let ctaUrl: string | undefined;

    if (campaignData.senderName) {
      senderName = sanitizeString(campaignData.senderName, MAX_SENDER_NAME_LENGTH);
    }

    if (campaignData.previewText) {
      previewText = sanitizeString(campaignData.previewText, MAX_PREVIEW_TEXT_LENGTH);
    }

    if (campaignData.ctaText) {
      ctaText = sanitizeString(campaignData.ctaText, MAX_CTA_TEXT_LENGTH);
    }

    if (campaignData.ctaUrl) {
      const sanitizedCtaUrl = sanitizeString(campaignData.ctaUrl, MAX_CTA_URL_LENGTH);
      if (sanitizedCtaUrl && isValidCtaUrl(sanitizedCtaUrl) && isAllowedCtaDomain(sanitizedCtaUrl)) {
        ctaUrl = sanitizedCtaUrl;
      } else {
        throw new Error('Invalid or unauthorized CTA URL');
      }
    }

    // If CTA text is provided, CTA URL must also be provided
    if (ctaText && !ctaUrl) {
      throw new Error('CTA URL is required when CTA text is provided');
    }

    // Prepare sanitized campaign data
    const sanitizedCampaignData: MarketingCampaignData = {
      campaignId: campaignId,
      subject: subject,
      content: content,
      customerSegment: customerSegment,
      senderName: senderName,
      previewText: previewText,
      ctaText: ctaText,
      ctaUrl: ctaUrl
    };

    // Get customers for this segment
    const customers = await getCustomersBySegmentSecure(supabase, customerSegment);
    
    if (customers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No customers found for the specified segment',
          emailsSent: 0 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ email: string; status: string; error?: string }> = [];

    // Process customers in batches to prevent abuse
    for (let i = 0; i < customers.length; i += MAX_CUSTOMERS_PER_BATCH) {
      const batch = customers.slice(i, i + MAX_CUSTOMERS_PER_BATCH);
      
      // Send emails to all customers in this batch
      for (const customer of batch) {
        try {
          // Validate customer data
          const emailValidation = validateEmail(customer.email);
          if (!emailValidation.isValid) {
            throw new Error('Invalid customer email');
          }

          const emailTemplate = {
            personalizations: [{
              to: [{ email: customer.email }],
              subject: sanitizedCampaignData.subject
            }],
            from: {
              email: VERIFIED_SENDER_EMAIL,
              name: sanitizedCampaignData.senderName || SENDER_NAME
            },
            content: [
              { 
                type: "text/plain", 
                value: generateSecureMarketingText(sanitizedCampaignData, customer) 
              },
              { 
                type: "text/html", 
                value: generateSecureMarketingHTML(sanitizedCampaignData, customer) 
              }
            ],
            categories: ['marketing_campaign', sanitizedCampaignData.campaignId],
            custom_args: {
              campaign_id: sanitizedCampaignData.campaignId,
              customer_id: customer.id,
              customer_segment: customerSegment
            }
          };

          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailTemplate)
          });

          const success = response.ok;
          
          if (success) {
            successCount++;
            results.push({ email: customer.email, status: 'sent' });
            
            // Log campaign delivery
            await supabase
              .from('email_campaign_deliveries')
              .insert({
                campaign_id: sanitizedCampaignData.campaignId,
                customer_id: customer.id,
                email: customer.email,
                status: 'delivered',
                delivered_at: new Date().toISOString()
              });
          } else {
            const error = await response.text();
            failureCount++;
            results.push({ email: customer.email, status: 'failed', error: `SendGrid error: ${response.status}` });
            
            // Log campaign failure
            await supabase
              .from('email_campaign_deliveries')
              .insert({
                campaign_id: sanitizedCampaignData.campaignId,
                customer_id: customer.id,
                email: customer.email,
                status: 'failed',
                failed_at: new Date().toISOString(),
                error_message: `SendGrid error: ${response.status}`
              });
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (emailError) {
          console.error(`Failed to send email to ${customer.email}:`, emailError);
          failureCount++;
          results.push({ email: customer.email, status: 'error', error: emailError.message });
        }
      }

      // Delay between batches
      if (i + MAX_CUSTOMERS_PER_BATCH < customers.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`Marketing campaign ${sanitizedCampaignData.campaignId} completed: ${successCount} sent, ${failureCount} failed`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Campaign sent to ${successCount} customers`,
        totalCustomers: customers.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        campaignId: sanitizedCampaignData.campaignId,
        results: results.slice(0, 100) // Limit response size
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Marketing campaign email error:', error);
    
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