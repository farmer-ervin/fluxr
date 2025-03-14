import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@13.10.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('No authorization header', { status: 401 })
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Invalid token', { status: 401 })
    }

    // Get request body
    const { customer_id, return_url } = await req.json()
    if (!customer_id || !return_url) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url
    })

    return new Response(
      JSON.stringify({ url: session.url }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (err) {
    console.error('Error creating portal session:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to create portal session' }), 
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})