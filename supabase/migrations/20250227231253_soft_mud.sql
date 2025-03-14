-- Make stripe_customer_id nullable for user_subscriptions
ALTER TABLE user_subscriptions 
  ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN user_subscriptions.stripe_customer_id IS 'Stripe customer ID. Nullable for cases where customer ID is not immediately available.';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);