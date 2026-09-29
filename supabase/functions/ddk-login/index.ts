import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is an admin
    const { data: adminData } = await supabaseClient
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (adminData) {
      await supabaseClient.auth.signOut()
      return new Response(
        JSON.stringify({ error: 'Use admin portal to login' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get dealer profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, business_name, status')
      .eq('email', email)
      .maybeSingle()

    if (profileError || !profile) {
      await supabaseClient.auth.signOut()
      return new Response(
        JSON.stringify({ error: 'Dealer profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.status !== 'active') {
      await supabaseClient.auth.signOut()
      return new Response(
        JSON.stringify({ error: 'Account is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: dealer, error: dealerError } = await supabaseClient
      .from('dealers')
      .select('id, business_name')
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (dealerError || !dealer) {
      await supabaseClient.auth.signOut()
      return new Response(
        JSON.stringify({ error: 'Dealer record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: tokenData } = await supabaseClient
      .from('token_balances')
      .select('balance')
      .eq('dealer_id', dealer.id)
      .maybeSingle()

    const tokenBalance = tokenData?.balance || 0

    return new Response(
      JSON.stringify({
        session_token: authData.session?.access_token,
        dealer_id: dealer.id,
        profile_id: profile.id,
        email: email,
        full_name: profile.full_name,
        business_name: dealer.business_name || profile.business_name,
        token_balance: tokenBalance,
        status: profile.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})