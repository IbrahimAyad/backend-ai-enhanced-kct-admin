import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../email-service/index.ts'

interface PasswordResetData {
  customerEmail: string
  customerName: string
  resetToken: string
  resetUrl: string
}

function generatePasswordResetHTML(data: PasswordResetData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
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
              We received a request to reset the password for your account. If you made this request, click the button below to reset your password.
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>

          <!-- Security Alert -->
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: start;">
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
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              This password reset was requested from IP address: [IP_ADDRESS]
            </p>
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              If you have concerns about your account security, contact us at 
              <a href="mailto:security@yourstore.com" style="color: #dc2626; text-decoration: none;">security@yourstore.com</a>
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              This link expires in 1 hour • Sent at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

function generatePasswordResetText(data: PasswordResetData): string {
  return `
Password Reset Request

Hi ${data.customerName},

We received a request to reset the password for your account. If you made this request, use the link below to reset your password:

${data.resetUrl}

Security Notice:
- This reset link will expire in 1 hour for your security
- If you didn't request this, please ignore this email
- If you have concerns, contact us at security@yourstore.com

Password Security Tips:
• Use at least 8 characters with a mix of letters, numbers, and symbols
• Don't reuse passwords from other accounts
• Consider using a password manager
• Enable two-factor authentication when available

This link expires in 1 hour.
Sent at ${new Date().toLocaleString()}

If you have any questions, contact our support team.
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resetData: PasswordResetData = await req.json()
    
    if (!resetData.customerEmail || !resetData.customerName || !resetData.resetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: customerEmail, customerName, and resetUrl' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailTemplate = {
      to: resetData.customerEmail,
      subject: '🔒 Reset Your Password - Action Required',
      html: generatePasswordResetHTML(resetData),
      text: generatePasswordResetText(resetData)
    }

    const success = await sendEmail(emailTemplate)
    
    if (success) {
      console.log(`Password reset email sent to ${resetData.customerEmail}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success,
        message: success ? 'Password reset email sent successfully' : 'Failed to send password reset email'
      }),
      { 
        status: success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Password reset email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})