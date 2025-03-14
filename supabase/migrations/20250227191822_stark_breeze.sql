-- Update the lifetime plan with the new Stripe product and price IDs
DO $$ 
BEGIN
  -- Check if the plan exists
  IF EXISTS (
    SELECT 1 FROM subscription_plans 
    WHERE name = 'Lifetime Purchase'
  ) THEN
    -- Update existing plan with new Stripe IDs
    UPDATE subscription_plans
    SET 
      stripe_product_id = 'prod_RquPI4nNEChknM',
      stripe_price_id = 'price_1QxCaEGrxtYDuhPGQIPK18PN',
      updated_at = now()
    WHERE name = 'Lifetime Purchase';
    
    RAISE NOTICE 'Successfully updated Stripe product and price IDs for Lifetime Purchase plan';
  ELSE
    RAISE NOTICE 'Lifetime Purchase plan not found. No updates made.';
  END IF;
END $$;