/*
  # Restore subscription plan

  1. New Data
    - Recreates the lifetime subscription plan with correct Stripe IDs
    - Sets up proper pricing and configuration

  2. Changes
    - Inserts new plan record if it doesn't exist
    - Updates existing plan if found
    - Ensures plan is active
*/

-- First check if the plan exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM subscription_plans WHERE name = 'Lifetime Purchase'
  ) THEN
    -- Update existing plan
    UPDATE subscription_plans
    SET 
      description = 'One-time payment for lifetime access to all features',
      price = 15.00,
      currency = 'usd',
      interval = NULL,
      stripe_product_id = 'prod_RqrCtnhtgyJiXi',
      stripe_price_id = 'price_1Qx9UQGrxtYDuhPGXED9YWjx',
      is_active = true,
      updated_at = now()
    WHERE name = 'Lifetime Purchase';
  ELSE
    -- Insert new plan
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
      'Lifetime Purchase',
      'One-time payment for lifetime access to all features',
      15.00,
      'usd',
      NULL,
      'prod_RqrCtnhtgyJiXi',
      'price_1Qx9UQGrxtYDuhPGXED9YWjx',
      true
    );
  END IF;
END $$;