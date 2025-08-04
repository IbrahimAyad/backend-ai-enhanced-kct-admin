import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { validateEmail, sanitizeString } from '../_shared/validation.ts';
import { createRateLimitedEndpoint, createUserTieredLimits } from '../_shared/rate-limit-middleware.ts';
import { sanitizeErrorMessage } from '../_shared/webhook-security.ts';

// Environment validation
const SENDGRID_API_KEY = Deno.env.get('KCT-Email-Key') || Deno.env.get('SENDGRID_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const VERIFIED_SENDER_EMAIL = Deno.env.get('VERIFIED_SENDER_EMAIL') || 'noreply@kctmenswear.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'KCT Menswear';

if (!SENDGRID_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
  throw new Error("Server configuration error");
}

// Create rate limited endpoint handlers
const rateLimitedEndpoints = createRateLimitedEndpoint(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Constants for validation
const MAX_SUBJECT_LENGTH = 200;
const MAX_HTML_LENGTH = 500000; // 500KB limit
const MAX_TEXT_LENGTH = 100000; // 100KB limit
const MAX_RECIPIENTS = 50;
const ALLOWED_EMAIL_TYPES = [
  'transactional',
  'order_confirmation',
  'shipping_update',
  'password_reset',
  'account_verification',
  'welcome',
  'invoice'
];

interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  email_type?: string;
  metadata?: Record<string, any>;
}

interface SendGridPayload {
  personalizations: Array<{
    to: Array<{ email: string }>;
    subject: string;
  }>;
  from: { email: string; name: string };
  content: Array<{
    type: string;
    value: string;
  }>;
  categories?: string[];
  custom_args?: Record<string, string>;
}

export async function sendEmailSecure(template: EmailTemplate, supabase: any): Promise<boolean> {
  try {
    // Validate recipients
    const recipients = Array.isArray(template.to) ? template.to : [template.to];
    const validatedRecipients: string[] = [];
    
    for (const recipient of recipients.slice(0, MAX_RECIPIENTS)) {
      const emailValidation = validateEmail(recipient);
      if (emailValidation.isValid && emailValidation.sanitized) {
        validatedRecipients.push(emailValidation.sanitized);
      }
    }

    if (validatedRecipients.length === 0) {
      throw new Error('No valid recipients');
    }

    // Build SendGrid payload
    const payload: SendGridPayload = {
      personalizations: [
        {
          to: validatedRecipients.map(email => ({ email })),
          subject: sanitizeString(template.subject, MAX_SUBJECT_LENGTH)
        }
      ],
      from: {
        email: VERIFIED_SENDER_EMAIL,
        name: SENDER_NAME
      },
      content: [
        {
          type: "text/html",
          value: sanitizeString(template.html, MAX_HTML_LENGTH)
        }
      ]
    };

    // Add plain text version if provided
    if (template.text) {
      payload.content.push({
        type: "text/plain",
        value: sanitizeString(template.text, MAX_TEXT_LENGTH)
      });
    }

    // Add categories for tracking
    if (template.email_type && ALLOWED_EMAIL_TYPES.includes(template.email_type)) {
      payload.categories = [template.email_type, 'kct-menswear'];
    }

    // Add custom arguments for tracking
    if (template.metadata && typeof template.metadata === 'object') {
      payload.custom_args = {};
      for (const [key, value] of Object.entries(template.metadata)) {
        if (typeof key === 'string' && typeof value === 'string') {
          payload.custom_args[sanitizeString(key, 50)] = sanitizeString(value, 100);
        }
      }
    }

    // Send via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      
      // Log email failure
      for (const recipient of validatedRecipients) {
        await supabase
          .from('email_logs')
          .insert({
            recipient_email: recipient,
            email_type: template.email_type || 'transactional',
            template_id: 'email-service',
            status: 'failed',
            error_message: `SendGrid error: ${response.status}`,
            metadata: template.metadata
          });
      }
      
      throw new Error(`Email delivery failed: ${response.status}`);
    }

    // Log successful email sends
    for (const recipient of validatedRecipients) {
      await supabase
        .from('email_logs')
        .insert({
          recipient_email: recipient,
          email_type: template.email_type || 'transactional',
          template_id: 'email-service',
          status: 'sent',
          sent_at: new Date().toISOString(),
          metadata: template.metadata
        });
    }

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

/**
 * Main email service handler
 */
async function handleEmailService(req: Request): Promise<Response> {
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

  try {
    // Initialize Supabase client with service role for logging
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Check authorization - email service should only be called by authenticated services
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    // Verify the token is valid (could be Supabase service role or authenticated user)
    const token = authHeader.replace('Bearer ', '');
    let isAuthorized = false;

    // Check if it's the service role key
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      isAuthorized = true;
    } else {
      // Check if it's a valid user token
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          // Additional check: only allow admin users to send emails directly
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();
          
          if (adminUser) {
            isAuthorized = true;
          }
        }
      } catch {
        // Invalid token
      }
    }

    if (!isAuthorized) {
      throw new Error('Unauthorized to send emails');
    }

    // Parse and validate request body
    let body: { template: EmailTemplate };
    try {
      body = await req.json();
    } catch {
      throw new Error('Invalid JSON payload');
    }

    const { template } = body;
    
    // Validate required fields
    if (!template || typeof template !== 'object') {
      throw new Error('Template is required');
    }

    if (!template.to) {
      throw new Error('Recipient email is required');
    }

    if (!template.subject || typeof template.subject !== 'string') {
      throw new Error('Email subject is required');
    }

    if (!template.html || typeof template.html !== 'string') {
      throw new Error('Email HTML content is required');
    }

    // Validate email type if provided
    if (template.email_type && !ALLOWED_EMAIL_TYPES.includes(template.email_type)) {
      throw new Error('Invalid email type');
    }

    // Send email with proper error handling
    const success = await sendEmailSecure(template, supabase);
    
    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 'Email sent successfully' : 'Email sending failed'
      }),
      { 
        status: success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Email service error:', error);
    
    const errorMessage = sanitizeErrorMessage(error);
    const statusCode = error.message?.includes('Unauthorized') ? 401 :
                      error.message?.includes('Rate limit') ? 429 :
                      error.message?.includes('required') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Create tiered rate limiting for email service:
// - Admin users: 500 requests/minute
// - Service role: email rate limits (10 requests/minute)
// - Authenticated users: email rate limits (10 requests/minute)
const tieredRateLimits = [
  {
    condition: (req: Request) => {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) return false;
      const token = authHeader.replace('Bearer ', '');
      return token === SUPABASE_SERVICE_ROLE_KEY;
    },
    options: {
      endpointType: 'email' as const,
      identifierType: 'api_key' as const,
      errorMessage: 'Email service rate limit exceeded.'
    }
  },
  {
    condition: (req: Request) => {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) return false;
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'admin' || payload.app_metadata?.role === 'admin';
      } catch {
        return false;
      }
    },
    options: {
      endpointType: 'admin' as const,
      identifierType: 'user' as const,
      errorMessage: 'Admin email rate limit exceeded.'
    }
  },
  {
    condition: (req: Request) => {
      const authHeader = req.headers.get('authorization');
      return !!(authHeader && authHeader.startsWith('Bearer '));
    },
    options: {
      endpointType: 'email' as const,
      identifierType: 'user' as const,
      errorMessage: 'Email rate limit exceeded.'
    }
  },
  {
    condition: () => true, // Catch all for unauthenticated requests
    options: {
      config: {
        maxRequests: 3,
        windowMs: 60 * 1000 // 1 minute
      },
      endpointType: 'email' as const,
      identifierType: 'ip' as const,
      errorMessage: 'Email service requires authentication.'
    }
  }
];

// Apply tiered rate limiting to the handler
const protectedHandler = rateLimitedEndpoints.tiered(handleEmailService, tieredRateLimits);

// Serve the protected endpoint
serve(protectedHandler);