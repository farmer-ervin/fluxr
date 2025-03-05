/*
  # Payment System Tables

  1. New Tables
    - subscription_plans: Stores available subscription plans
    - user_subscriptions: Tracks user subscription status
    - payment_history: Records payment attempts and outcomes

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
    - Create indexes for performance

  3. Changes
    - Add payment-related tables with future-proof schema
    - Support both one-time and subscription payments
*/

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  interval text CHECK (interval IN ('month', 'year') OR interval IS NULL),
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(stripe_product_id),
  UNIQUE(stripe_price_id)
);

-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'lifetime')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  payment_type text NOT NULL CHECK (payment_type IN ('one_time', 'recurring')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)  -- One active subscription per user
);

-- Create payment_history table
CREATE TABLE payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  amount decimal NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
  stripe_payment_intent_id text,
  stripe_payment_method text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stripe_payment_intent_id)
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- subscription_plans policies
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can modify plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE email LIKE '%@fluxr.ai'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE email LIKE '%@fluxr.ai'
  ));

-- user_subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- payment_history policies
CREATE POLICY "Users can view own payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can record payments"
  ON payment_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX subscription_plans_active_idx ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX payment_history_user_id_idx ON payment_history(user_id);
CREATE INDEX payment_history_subscription_id_idx ON payment_history(subscription_id);
CREATE INDEX payment_history_status_idx ON payment_history(status);

-- Create trigger for updating timestamps
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the lifetime plan
INSERT INTO subscription_plans (
  name,
  description,
  price,
  interval,
  stripe_product_id,
  stripe_price_id,
  is_active
) VALUES (
  'Lifetime Purchase',
  'One-time payment for lifetime access to all features',
  15.00,
  NULL,
  'prod_XXXXX',  -- Replace with actual Stripe product ID
  'price_XXXXX', -- Replace with actual Stripe price ID
  true
);