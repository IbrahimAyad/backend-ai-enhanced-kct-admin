import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

interface SendGridPayload {
  personalizations: Array<{
    to: Array<{ email: string }>
    subject: string
  }>
  from: { email: string; name: string }
  content: Array<{
    type: string
    value: string
  }>
}

export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  try {
    const sendGridKey = Deno.env.get('KCT-Email-Key')
    
    if (!sendGridKey) {
      throw new Error('SendGrid API key not found')
    }

    const payload: SendGridPayload = {
      personalizations: [
        {
          to: [{ email: template.to }],
          subject: template.subject
        }
      ],
      from: {
        email: "orders@yourstore.com", // Update with your verified sender email
        name: "Your Store"
      },
      content: [
        {
          type: "text/html",
          value: template.html
        }
      ]
    }

    if (template.text) {
      payload.content.push({
        type: "text/plain",
        value: template.text
      })
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SendGrid error:', error)
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { template } = await req.json()
    
    if (!template || !template.to || !template.subject || !template.html) {
      return new Response(
        JSON.stringify({ error: 'Missing required template fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const success = await sendEmail(template)
    
    return new Response(
      JSON.stringify({ success }),
      { 
        status: success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Email service error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})