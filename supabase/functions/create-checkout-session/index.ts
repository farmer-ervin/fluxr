import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@13.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

// Create a Supabase client with the service role key
const supabaseUrl = Deno.env.get('API_SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('API_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('No authorization header', { status: 401 })
    }

    // Get the JWT token
    const token = authHeader.replace('Bearer ', '')

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response('Invalid token', { status: 401 })
    }

    // Get the request body to check for mode
    const requestBody = await req.json();
    const isEmbedded = requestBody?.mode === 'embedded';

    // Get the lifetime plan from the database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, stripe_price_id')
      .eq('name', 'Lifetime Purchase')
      .single()

    if (planError || !plan) {
      return new Response('Plan not found', { status: 404 })
    }

    // Check if user already has a subscription
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: 'User already has an active subscription' }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId: string | undefined;

    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (subscriptions?.stripe_customer_id) {
      stripeCustomerId = subscriptions.stripe_customer_id;
    }

    // Create base session parameters
    const sessionParams: any = {
      client_reference_id: user.id,
      mode: 'payment',
      payment_intent_data: {
        setup_future_usage: 'off_session'
      },
      payment_method_types: ['card'],
      line_items: [{
        price: plan.stripe_price_id,
        quantity: 1
      }],
      metadata: {
        userId: user.id,
        planId: plan.id
      },
      allow_promotion_codes: true, // Enable coupon codes
      submit_type: 'pay',
      billing_address_collection: 'required'
    };

    // Add either customer or customer_creation but not both
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_creation = 'if_required';
    }

    // Different parameters based on checkout mode
    if (isEmbedded) {
      // For embedded checkout, we need to use ui_mode: 'embedded'
      sessionParams.ui_mode = 'embedded';
      sessionParams.return_url = `${req.headers.get('origin')}/payment/return?session_id={CHECKOUT_SESSION_ID}`;
      
      const session = await stripe.checkout.sessions.create(sessionParams);

      // Return the client_secret for embedded checkout
      return new Response(
        JSON.stringify({ 
          clientSecret: session.client_secret
        }), 
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    } else {
      // For hosted checkout, use the default redirect flow
      sessionParams.ui_mode = 'hosted';
      sessionParams.cancel_url = `${req.headers.get('origin')}/payment`;
      sessionParams.success_url = `${req.headers.get('origin')}/payment/return?session_id={CHECKOUT_SESSION_ID}`;
      
      const session = await stripe.checkout.sessions.create(sessionParams);

      // Return the checkout URL for redirect
      return new Response(
        JSON.stringify({ 
          url: session.url,
          sessionId: session.id
        }), 
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }
  } catch (err) {
    console.error('Error creating checkout session:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})