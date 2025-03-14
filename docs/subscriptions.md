# Subscription System Documentation

## Overview
The subscription system is built using Stripe for payment processing and Supabase for user management. It supports lifetime access through one-time payments, with infrastructure in place for potential monthly subscriptions.

## Architecture

### Database Tables
- `subscription_plans`: Stores available subscription plans
- `user_subscriptions`: Tracks user subscription status
- `payment_history`: Records payment transactions

### Components
- `PaymentWall`: Gated access component for non-subscribed users
- `AuthModal`: Handles user authentication
- `ProfileSettings`: Manages subscription settings

## Payment Flow

1. **Initial Access**
   - New users sign up through AuthModal
   - After signup, users are directed to PaymentWall

2. **Payment Process**
   - PaymentWall displays lifetime access option
   - Stripe Checkout handles secure payment
   - On success, user is redirected to `/payment/return`
   - Payment verification occurs server-side

3. **Post-Payment**
   - User subscription record is created
   - Payment is recorded in payment_history
   - User gains full access to all features

## Stripe Integration

### Webhooks
- `stripe-webhook`: Handles Stripe events
  - `checkout.session.completed`: Creates subscription
  - `payment_intent.succeeded`: Backup payment handling
  - `payment_intent.payment_failed`: Records failed payments

### Functions
- `create-checkout-session`: Creates Stripe checkout sessions
- `verify-session`: Verifies completed payments
- `create-portal-session`: Manages customer billing portal

## Security

### RLS Policies
- Subscription plans viewable by all authenticated users
- Users can only view their own subscription data
- Payment history restricted to user's own records

### Environment Variables
```
STRIPE_PUBLISHABLE_KEY=pk_live_*****
STRIPE_SECRET_KEY=sk_live_*****
STRIPE_WEBHOOK_SECRET=whsec_*****
```

## Reactivation Guide

To re-enable the subscription system:

1. **Code Changes**
   - Update `src/lib/subscription.ts` to perform actual checks
   - Re-enable PaymentWall in protected routes
   - Update AuthProvider to enforce subscription checks

2. **Database**
   - All required tables and policies are preserved
   - No schema changes needed

3. **Stripe Setup**
   - Ensure webhook endpoints are configured
   - Update product and price IDs in subscription_plans table
   - Verify webhook signatures

4. **Testing**
   - Test complete payment flow
   - Verify subscription status updates
   - Test billing portal access
   - Validate webhook handling

## Current Status
The subscription system is currently disabled but maintained for future use. All users have full access without payment requirements. The infrastructure remains in place and can be reactivated without major changes to the codebase.