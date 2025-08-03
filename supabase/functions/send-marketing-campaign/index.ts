import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../email-service/index.ts'

interface MarketingCampaignData {
  campaignId: string
  subject: string
  content: string
  customerSegment: string
  senderName?: string
  previewText?: string
  ctaText?: string
  ctaUrl?: string
}

interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  segment?: string
}

function generateMarketingHTML(data: MarketingCampaignData, customer: Customer): string {
  const customerName = customer.first_name || 'Valued Customer';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${data.subject}</title>
      ${data.previewText ? `<meta name="description" content="${data.previewText}">` : ''}
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Preheader (hidden preview text) -->
        ${data.previewText ? `
        <div style="display: none; max-height: 0; overflow: hidden;">
          ${data.previewText}
        </div>
        ` : ''}

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Your Store</h1>
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
            ${data.content.replace(/\n/g, '<br>')}
          </div>

          <!-- CTA Button -->
          ${data.ctaText && data.ctaUrl ? `
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${data.ctaUrl}?utm_source=email&utm_medium=campaign&utm_campaign=${data.campaignId}&customer_id=${customer.id}" 
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
              <a href="mailto:support@yourstore.com" style="color: #667eea; text-decoration: none;">support@yourstore.com</a>
            </p>
            <div style="margin-bottom: 16px;">
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 8px; font-size: 12px;">Unsubscribe</a>
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 8px; font-size: 12px;">Update Preferences</a>
              <a href="#" style="color: #6b7280; text-decoration: none; margin: 0 8px; font-size: 12px;">View in Browser</a>
            </div>
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
              Campaign ID: ${data.campaignId} | ${data.senderName || 'Your Store'}<br>
              You're receiving this because you subscribed to our newsletter.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateMarketingText(data: MarketingCampaignData, customer: Customer): string {
  const customerName = customer.first_name || 'Valued Customer';
  
  return `
${data.subject}

Hi ${customerName},

${data.content}

${data.ctaText && data.ctaUrl ? `
${data.ctaText}: ${data.ctaUrl}?utm_source=email&utm_medium=campaign&utm_campaign=${data.campaignId}&customer_id=${customer.id}
` : ''}

This email was sent to you because you're a valued ${customer.segment || 'customer'} in our community.

Questions? Contact us at support@yourstore.com

Campaign ID: ${data.campaignId}
To unsubscribe or update preferences, visit your account settings.
  `
}

async function getCustomersBySegment(supabase: any, segment: string): Promise<Customer[]> {
  let query = supabase
    .from('customers')
    .select('id, email, first_name, last_name, segment, email_preferences')
    .eq('email_subscribed', true) // Assuming you have this field
    .not('email', 'is', null);

  // Apply segment filtering
  if (segment !== 'all') {
    if (segment === 'vip') {
      query = query.eq('segment', 'VIP');
    } else if (segment === 'loyal') {
      query = query.eq('segment', 'Loyal');
    } else if (segment === 'new') {
      query = query.eq('segment', 'New');
    } else if (segment === 'at_risk') {
      query = query.eq('segment', 'At Risk');
    }
    // Add more segment conditions as needed
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  return data || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const campaignData: MarketingCampaignData = await req.json()
    
    if (!campaignData.campaignId || !campaignData.subject || !campaignData.content || !campaignData.customerSegment) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: campaignId, subject, content, and customerSegment' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get customers for this segment
    const customers = await getCustomersBySegment(supabase, campaignData.customerSegment)
    
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
      )
    }

    let successCount = 0
    let failureCount = 0
    const results = []

    // Send emails to all customers in the segment
    for (const customer of customers) {
      try {
        const emailTemplate = {
          to: customer.email,
          subject: campaignData.subject,
          html: generateMarketingHTML(campaignData, customer),
          text: generateMarketingText(campaignData, customer)
        }

        const success = await sendEmail(emailTemplate)
        
        if (success) {
          successCount++
          results.push({ email: customer.email, status: 'sent' })
          
          // Log campaign delivery
          await supabase
            .from('email_campaign_deliveries')
            .insert({
              campaign_id: campaignData.campaignId,
              customer_id: customer.id,
              email: customer.email,
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
        } else {
          failureCount++
          results.push({ email: customer.email, status: 'failed' })
          
          // Log campaign failure
          await supabase
            .from('email_campaign_deliveries')
            .insert({
              campaign_id: campaignData.campaignId,
              customer_id: customer.id,
              email: customer.email,
              status: 'failed',
              failed_at: new Date().toISOString()
            })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (emailError) {
        console.error(`Failed to send email to ${customer.email}:`, emailError)
        failureCount++
        results.push({ email: customer.email, status: 'error', error: emailError.message })
      }
    }

    console.log(`Marketing campaign ${campaignData.campaignId} completed: ${successCount} sent, ${failureCount} failed`)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Campaign sent to ${successCount} customers`,
        totalCustomers: customers.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        results: results
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Marketing campaign email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})