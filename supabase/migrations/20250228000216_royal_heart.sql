/*
  # Add Monthly Subscription Plan
  
  1. Changes
    - Add monthly subscription plan with 3-day trial
    - Update subscription status types to include 'trialing'
    - Add trial_end column to user_subscriptions
  
  2. Security
    - Maintain existing RLS policies
*/

-- Update status check constraint to include 'trialing'
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('active', 'canceled', 'past_due', 'lifetime', 'trialing'));

-- Add trial_end column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'trial_end'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN trial_end timestamptz;
  END IF;
END $$;

-- Create index for trial_end
CREATE INDEX IF NOT EXISTS user_subscriptions_trial_end_idx ON user_subscriptions(trial_end);

-- Add monthly plan with placeholder Stripe IDs
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  interval,
  stripe_product_id,
  stripe_price_id,
  is_active
) VALUES (
  'Monthly Plan',
  'Monthly subscription with 3-day trial',
  5.00,
  'usd',
  'month',
  'prod_placeholder', -- Replace after creating in Stripe
  'price_placeholder', -- Replace after creating in Stripe
  false -- Start as inactive until Stripe IDs are updated
);

-- Add comment explaining trial period
COMMENT ON COLUMN user_subscriptions.trial_end IS 'End date of the trial period. NULL if not in trial or trial ended.';