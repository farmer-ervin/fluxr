import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@13.10.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const supabaseUrl = Deno.env.get('API_SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('API_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000
const BACKOFF_FACTOR = 2

// Error types
const ERROR_TYPES = {
  AUTH: 'auth_error',
  STRIPE: 'stripe_error',
  DATABASE: 'database_error',
  VALIDATION: 'validation_error'
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries === 0) throw error
    await sleep(delay)
    return withRetry(operation, retries - 1, delay * BACKOFF_FACTOR)
  }
}

async function logError(error: any, metadata: any = {}) {
  try {
    await supabase.from('error_logs').insert({
      error_type: error.type || 'unknown',
      error_code: error.code,
      error_message: error.message,
      severity: error.severity || 'error',
      metadata
    })
  } catch (err) {
    console.error('Failed to log error:', err)
  }
}

serve(async (req) => {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Validate request method
    if (req.method !== 'POST') {
      throw { 
        type: ERROR_TYPES.VALIDATION,
        message: 'Method not allowed',
        code: 405,
        severity: 'warning'
      }
    }

    // Validate auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw {
        type: ERROR_TYPES.AUTH,
        message: 'No authorization header',
        code: 401,
        severity: 'warning'
      }
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw {
        type: ERROR_TYPES.AUTH,
        message: 'Invalid token',
        code: 401,
        severity: 'warning',
        originalError: authError
      }
    }

    // Validate request body
    const { session_id } = await req.json()
    if (!session_id) {
      throw {
        type: ERROR_TYPES.VALIDATION,
        message: 'Missing session_id',
        code: 400,
        severity: 'warning'
      }
    }

    // Retrieve Stripe session with retry
    const session = await withRetry(() => 
      stripe.checkout.sessions.retrieve(session_id, {
        expand: ['line_items', 'payment_intent']
      })
    )

    // Verify session ownership
    if (session.client_reference_id !== user.id) {
      throw {
        type: ERROR_TYPES.AUTH,
        message: 'Unauthorized session access',
        code: 401,
        severity: 'warning'
      }
    }

    // Process successful payment
    if (session.status === 'complete' && session.payment_status === 'paid') {
      // Get lifetime plan
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Lifetime Purchase')
        .single()

      if (planError) {
        throw {
          type: ERROR_TYPES.DATABASE,
          message: 'Failed to retrieve subscription plan',
          severity: 'error',
          originalError: planError
        }
      }

      // Create subscription with retry
      await withRetry(async () => {
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: plan.id,
            stripe_customer_id: session.customer,
            status: 'lifetime',
            payment_type: 'one_time',
            current_period_start: new Date().toISOString(),
            current_period_end: null
          })

        if (subscriptionError) throw subscriptionError
      })

      // Record payment with retry
      await withRetry(async () => {
        const { error: paymentError } = await supabase
          .from('payment_history')
          .insert({
            user_id: user.id,
            amount: session.amount_total / 100,
            currency: session.currency,
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent,
            stripe_payment_method: session.payment_method_types?.[0]
          })

        if (paymentError) throw paymentError
      })
    }

    // Log execution time
    const executionTime = Date.now() - startTime
    console.log(`Request ${requestId} completed in ${executionTime}ms`)

    return new Response(
      JSON.stringify({ 
        status: session.status,
        payment_status: session.payment_status
      }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    )
  } catch (err) {
    // Log error
    await logError(err, {
      requestId,
      executionTime: Date.now() - startTime
    })

    // Return appropriate error response
    const status = err.code || 500
    const message = err.message || 'Internal server error'

    return new Response(
      JSON.stringify({ 
        error: message,
        code: err.code,
        requestId
      }), 
      { 
        status,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    )
  }
})