import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to sanitize JSON
function sanitizeJson(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE-\uFFFF]/g, '')
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJson(item))
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeJson(value)
    }
    return result
  }
  return obj
}

function cleanReportData(data: any): any {
  const cleaned = sanitizeJson(data)
  return JSON.parse(JSON.stringify(cleaned))
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get dealer profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', user.email)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Dealer profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get dealer record
    const { data: dealer, error: dealerError } = await supabaseClient
      .from('dealers')
      .select('id')
      .eq('profile_id', profile.id)
      .single()

    if (dealerError || !dealer) {
      return new Response(
        JSON.stringify({ error: 'Dealer record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get report data from request
    const rawReportData = await req.json()
    const reportData = cleanReportData(rawReportData)
    const systemInfo = reportData.system || {}

    // Check token balance
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('token_balances')
      .select('balance')
      .eq('dealer_id', dealer.id)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token balance not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (tokenData.balance < 1) {
      return new Response(
        JSON.stringify({ error: 'Insufficient tokens. Need at least 1 token.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate Report ID
    const timestamp = new Date().getFullYear().toString()
    const randomNum = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    const reportId = `VDDK-${timestamp}-${randomNum}`

    const traceability = systemInfo.traceability || {}
    const hostname = systemInfo.hostname || 'Unknown'
    let deviceType = systemInfo.device_type || 'laptop'
    if (deviceType === 'phone' || deviceType === 'smartphone') {
      deviceType = 'smartphone'
    }

    // Map DDK grade to allowed values
    const gradeMap: { [key: string]: string } = {
      'Good': 'PASS',
      'Fair': 'WARNING',
      'Poor': 'FAIL',
      'Unknown': 'PENDING'
    }
    const overall_result = gradeMap[reportData.overall_grade] || 'PENDING'

    // Insert report
    const insertData = {
      report_id: reportId,
      dealer_id: dealer.id,
      device_id: null,
      device_type: deviceType,
      device_manufacturer: traceability.manufacturer || 'Unknown',
      device_model: traceability.model || hostname,
      serial_number: traceability.serial_number || 'N/A',
      overall_result: overall_result,
      diagnostic_results: reportData,
      qr_status: 'active',
      verification_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Inserting report...')

    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .insert([insertData])
      .select()
      .single()

    if (reportError) {
      console.error('Report insert error:', reportError)
      return new Response(
        JSON.stringify({ error: 'Failed to create report: ' + reportError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct token
    const { error: deductError } = await supabaseClient
      .from('token_balances')
      .update({ balance: tokenData.balance - 1 })
      .eq('dealer_id', dealer.id)

    if (deductError) {
      await supabaseClient.from('reports').delete().eq('id', report.id)
      return new Response(
        JSON.stringify({ error: 'Failed to deduct token: ' + deductError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record transaction
    await supabaseClient
      .from('token_transactions')
      .insert([{
        dealer_id: dealer.id,
        transaction_type: 'REPORT_GENERATION',
        amount: -1,
        balance_after: tokenData.balance - 1,
        reference_id: reportId,
        reason: `Generated report ${reportId}`
      }])

    // Create QR verification
    const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'
    const verifyUrl = `${appUrl}/verify/${reportId}`

    await supabaseClient
      .from('qr_verifications')
      .insert([{
        report_id: report.id,
        verification_token: reportId,
        qr_data: verifyUrl,
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }])

    return new Response(
      JSON.stringify({
        success: true,
        report_id: reportId,
        verify_url: verifyUrl,
        balance_after: tokenData.balance - 1,
        report: {
          id: report.id,
          device_manufacturer: report.device_manufacturer,
          device_model: report.device_model,
          overall_result: report.overall_result,
          created_at: report.created_at
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})