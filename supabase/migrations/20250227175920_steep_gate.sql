-- Update the lifetime plan with actual Stripe IDs
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_RqrCtnhtgyJiXi',
  stripe_price_id = 'price_1Qx9UQGrxtYDuhPGXED9YWjx'
WHERE name = 'Lifetime Purchase';

-- Add comment explaining the update
COMMENT ON TABLE subscription_plans IS 'Updated with actual Stripe product and price IDs for lifetime plan';