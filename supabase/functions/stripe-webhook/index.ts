import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@13.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  // This is needed to use the Fetch API in Deno Deploy
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

// Create a Supabase client
const supabaseUrl = Deno.env.get('API_SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('API_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    console.log(`Webhook received: ${req.method}`);

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
        },
      });
    }

    if (req.method !== 'POST') {
      console.log(`Invalid method: ${req.method}`);
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.log('No signature provided');
      return new Response('No signature', { status: 400 })
    }

    // Get the raw body
    const body = await req.text()
    console.log(`Webhook body length: ${body.length} bytes`);

    // Verify the signature
    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`Event verified: ${event.type}`);
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
    }

    // Handle the event
    console.log(`Processing event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log(`Checkout session completed: ${session.id}`);
        
        // Get the customer ID and subscription ID
        const { customer: stripeCustomerId, subscription: stripeSubscriptionId } = session
        
        // Get the user ID from the client_reference_id
        const userId = session.client_reference_id
        
        // Get the subscription plan from metadata
        const planId = session.metadata?.planId
        
        if (!userId || !planId) {
          console.error(`Missing user ID or plan ID. userId: ${userId}, planId: ${planId}`);
          throw new Error('Missing user ID or plan ID')
        }

        console.log(`Creating subscription for user: ${userId}, plan: ${planId}`);
        
        // Create user subscription record
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId || null,
            status: 'lifetime', // For one-time payments
            payment_type: 'one_time',
            current_period_start: new Date().toISOString(),
            current_period_end: null // Lifetime subscription never ends
          })
          .select();

        if (subscriptionError) {
          console.error(`Subscription insert error: ${JSON.stringify(subscriptionError)}`);
          throw subscriptionError;
        }
        
        console.log(`Subscription created: ${subscriptionData ? JSON.stringify(subscriptionData) : 'No data returned'}`);

        // Record the payment
        console.log(`Recording payment for session: ${session.id}, amount: ${session.amount_total}`);
        
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_history')
          .insert({
            user_id: userId,
            subscription_id: subscriptionData?.[0]?.id,
            amount: session.amount_total / 100, // Convert from cents
            currency: session.currency,
            status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent,
            stripe_payment_method: session.payment_method_types?.[0]
          })
          .select();

        if (paymentError) {
          console.error(`Payment insert error: ${JSON.stringify(paymentError)}`);
          throw paymentError;
        }
        
        console.log(`Payment recorded: ${paymentData ? JSON.stringify(paymentData) : 'No data returned'}`);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        console.log(`Payment failed: ${paymentIntent.id}`);
        
        // Record the failed payment
        const { data: paymentData, error: paymentError } = await supabase
          .from('payment_history')
          .insert({
            user_id: paymentIntent.metadata?.userId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
            stripe_payment_method: paymentIntent.payment_method_types?.[0],
            error_message: paymentIntent.last_payment_error?.message
          })
          .select();

        if (paymentError) {
          console.error(`Failed payment record error: ${JSON.stringify(paymentError)}`);
          throw paymentError;
        }
        
        console.log(`Failed payment recorded: ${paymentData ? JSON.stringify(paymentData) : 'No data returned'}`);

        break;
      }
      
      // Add handling for payment_intent.succeeded as a backup
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        
        // Check if this payment has already been processed via checkout.session.completed
        const { data: existingPayment, error: lookupError } = await supabase
          .from('payment_history')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .maybeSingle();
          
        if (lookupError) {
          console.error(`Error checking existing payment: ${JSON.stringify(lookupError)}`);
        }
        
        if (existingPayment) {
          console.log(`Payment already processed: ${paymentIntent.id}`);
          break;
        }
        
        // Get user ID from metadata
        const userId = paymentIntent.metadata?.userId;
        if (!userId) {
          console.log(`No user ID in payment intent metadata: ${paymentIntent.id}`);
          break;
        }
        
        // Check if user already has a subscription
        const { data: existingSub, error: subLookupError } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (subLookupError) {
          console.error(`Error checking existing subscription: ${JSON.stringify(subLookupError)}`);
        }
        
        // Only create subscription if one doesn't exist
        if (!existingSub) {
          console.log(`Creating backup subscription for user: ${userId}`);
          
          // Get the plan ID (default to lifetime plan if not specified)
          const { data: plans, error: plansError } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('name', 'Lifetime Purchase')
            .single();
            
          if (plansError) {
            console.error(`Error fetching plan: ${JSON.stringify(plansError)}`);
            break;
          }
          
          const planId = plans?.id;
          
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              plan_id: planId,
              stripe_customer_id: paymentIntent.customer,
              stripe_subscription_id: null,
              status: 'lifetime',
              payment_type: 'one_time',
              current_period_start: new Date().toISOString(),
              current_period_end: null
            })
            .select();
  
          if (subscriptionError) {
            console.error(`Backup subscription insert error: ${JSON.stringify(subscriptionError)}`);
          } else {
            console.log(`Backup subscription created: ${JSON.stringify(subscriptionData)}`);
            
            // Record the payment
            await supabase
              .from('payment_history')
              .insert({
                user_id: userId,
                subscription_id: subscriptionData?.[0]?.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: 'succeeded',
                stripe_payment_intent_id: paymentIntent.id,
                stripe_payment_method: paymentIntent.payment_method?.type
              });
          }
        }
        
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (err) {
    console.error(`Webhook error: ${err.message}, stack: ${err.stack}`);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed', message: err.message }), 
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