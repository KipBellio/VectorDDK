import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('DDK_SUPABASE_URL') ?? '',
      Deno.env.get('DDK_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get report ID from URL
    const url = new URL(req.url)
    const reportId = url.pathname.split('/').pop()

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'Report ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the report exists and belongs to the dealer
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('id, dealer_id, report_id')
      .eq('report_id', reportId)
      .single()

    if (reportError || !report) {
      return new Response(
        JSON.stringify({ error: 'Report not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate QR code
    const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'
    const verifyUrl = `${appUrl}/verify/${reportId}`
    
    const qrBuffer = await QRCode.toBuffer(verifyUrl, {
      type: 'png',
      margin: 2,
      width: 300,
      color: {
        dark: '#111111',
        light: '#ffffff'
      }
    })

    return new Response(qrBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr_${reportId}.png"`
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})