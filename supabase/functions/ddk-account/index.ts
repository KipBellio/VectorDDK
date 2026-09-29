import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
    
    // Verify the user with the token
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
      .select('id, full_name, business_name, email, phone, status')
      .eq('email', user.email)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Dealer profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Account is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get dealer record
    const { data: dealer, error: dealerError } = await supabaseClient
      .from('dealers')
      .select('id, business_name, business_phone, business_address')
      .eq('profile_id', profile.id)
      .single()

    if (dealerError || !dealer) {
      return new Response(
        JSON.stringify({ error: 'Dealer record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get token balance
    const { data: tokenData } = await supabaseClient
      .from('token_balances')
      .select('balance')
      .eq('dealer_id', dealer.id)
      .maybeSingle()

    const tokenBalance = tokenData?.balance || 0

    // Return account info
    return new Response(
      JSON.stringify({
        dealer_id: dealer.id,
        profile_id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        business_name: dealer.business_name || profile.business_name,
        business_phone: dealer.business_phone || profile.phone,
        business_address: dealer.business_address || '',
        phone: profile.phone,
        token_balance: tokenBalance,
        status: profile.status
      }),
      { 
        status: 200, 
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