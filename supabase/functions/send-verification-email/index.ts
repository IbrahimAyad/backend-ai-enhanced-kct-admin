import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { corsHeaders } from "../_shared/cors.ts";

const sendgridApiKey = Deno.env.get("KCT-Email-Key") || Deno.env.get("SENDGRID_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!sendgridApiKey) {
  console.error("Missing SendGrid API key");
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration");
}

interface RequestBody {
  email: string;
  userId: string;
  verificationUrl: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, userId, verificationUrl } = await req.json() as RequestBody;

    if (!email || !userId || !verificationUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Log the email send attempt
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        recipient_email: email,
        email_type: "verification",
        template_id: "email-verification",
        status: "pending",
        customer_id: userId,
        metadata: {
          verification_url: verificationUrl
        }
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    // Create the email content
    const emailContent = {
      to: email,
      from: {
        email: "noreply@kctmenswear.com", // Update with your verified sender
        name: "KCT Menswear"
      },
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              margin-top: 20px;
              margin-bottom: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content h2 {
              color: #333;
              margin-top: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .verify-button:hover {
              opacity: 0.9;
            }
            .security-notice {
              background: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 15px 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .security-notice h3 {
              margin: 0 0 10px 0;
              color: #667eea;
              font-size: 16px;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .url-box {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 6px;
              word-break: break-all;
              font-size: 12px;
              color: #666;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">✉️</div>
              <h1>Verify Your Email Address</h1>
            </div>
            
            <div class="content">
              <h2>Welcome to KCT Menswear!</h2>
              
              <p>Thank you for creating an account with us. To complete your registration and ensure the security of your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">This verification link will expire in 24 hours for security reasons.</p>
              
              <div class="security-notice">
                <h3>🔒 Security Notice</h3>
                <p style="margin: 0; font-size: 14px;">
                  This email was sent because someone signed up for a KCT Menswear account using this email address. 
                  If this wasn't you, please ignore this email or contact our support team.
                </p>
              </div>
              
              <p style="margin-top: 30px;">If the button above doesn't work, you can copy and paste the following link into your browser:</p>
              
              <div class="url-box">
                ${verificationUrl}
              </div>
              
              <p style="margin-top: 30px;">Once verified, you'll be able to:</p>
              <ul style="color: #666;">
                <li>Access your order history</li>
                <li>Save your favorite items</li>
                <li>Enjoy faster checkout</li>
                <li>Receive exclusive member offers</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>This is an automated message from KCT Menswear.<br>
              Please do not reply to this email.</p>
              <p style="margin-top: 20px;">
                <a href="https://kctmenswear.com">Visit our website</a> | 
                <a href="https://kctmenswear.com/support">Contact Support</a>
              </p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                © 2024 KCT Menswear. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to KCT Menswear!

Thank you for creating an account with us. To complete your registration and ensure the security of your account, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create this account, please ignore this email or contact our support team.

Once verified, you'll be able to:
- Access your order history
- Save your favorite items
- Enjoy faster checkout
- Receive exclusive member offers

Best regards,
The KCT Menswear Team

© 2024 KCT Menswear. All rights reserved.
      `
    };

    // Send the email via SendGrid
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: emailContent.from,
        subject: emailContent.subject,
        content: [
          { type: "text/plain", value: emailContent.text },
          { type: "text/html", value: emailContent.html }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid error:", error);
      
      // Update email log with failure
      await supabase
        .from("email_logs")
        .update({ 
          status: "failed",
          error_message: error,
          sent_at: new Date().toISOString()
        })
        .eq("recipient_email", email)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);
      
      throw new Error(`Failed to send email: ${error}`);
    }

    // Update email log with success
    await supabase
      .from("email_logs")
      .update({ 
        status: "sent",
        sent_at: new Date().toISOString()
      })
      .eq("recipient_email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification email sent successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});