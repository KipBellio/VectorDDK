import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { email, otp, name, purpose } = await req.json()

    // Validate input
    if (!email || !otp || !name || !purpose) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, otp, name, purpose' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

    // Get the app URL from environment
    const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'

    // Create email content based on purpose
    let subject = ''
    let html = ''

    switch (purpose) {
      case 'registration':
        subject = 'Verify Your VectorDDK Account'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
              .header { background: #111111; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .code { 
                background: #f5f5f5; 
                padding: 15px; 
                text-align: center; 
                font-size: 32px; 
                letter-spacing: 8px; 
                font-weight: bold;
                border-radius: 8px;
                margin: 20px 0;
              }
              .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin:0;">VectorDDK</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for registering with VectorDDK. Please use the code below to verify your account:</p>
              <div class="code">${otp}</div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                <a href="${appUrl}" style="color: #111111;">Visit VectorDDK</a>
              </p>
            </div>
            <div class="footer">
              <p>VectorDDK — Professional Device Diagnostics</p>
              <p style="font-size: 10px;">This is an automated message, please do not reply.</p>
            </div>
          </body>
          </html>
        `
        break

      case 'login':
        subject = 'VectorDDK Login Verification Code'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
              .header { background: #111111; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .code { 
                background: #f5f5f5; 
                padding: 15px; 
                text-align: center; 
                font-size: 32px; 
                letter-spacing: 8px; 
                font-weight: bold;
                border-radius: 8px;
                margin: 20px 0;
              }
              .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin:0;">VectorDDK</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Use the code below to log in to your VectorDDK account:</p>
              <div class="code">${otp}</div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>VectorDDK — Professional Device Diagnostics</p>
            </div>
          </body>
          </html>
        `
        break

      case 'password_reset':
        subject = 'VectorDDK Password Reset Code'
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
              .header { background: #111111; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .code { 
                background: #f5f5f5; 
                padding: 15px; 
                text-align: center; 
                font-size: 32px; 
                letter-spacing: 8px; 
                font-weight: bold;
                border-radius: 8px;
                margin: 20px 0;
              }
              .footer { color: #666; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin:0;">VectorDDK</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Use the code below to reset your VectorDDK password:</p>
              <div class="code">${otp}</div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>VectorDDK — Professional Device Diagnostics</p>
            </div>
          </body>
          </html>
        `
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid purpose. Use: registration, login, or password_reset' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
  from: 'onboarding@resend.dev',  // ✅ Use this for testing
  to: email,
  subject: subject,
  html: html,
})

    if (error) {
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data?.id,
        message: 'OTP sent successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})