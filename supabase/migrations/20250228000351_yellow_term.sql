/*
  # Update Monthly Plan
  
  1. Changes
    - Update monthly plan with actual Stripe product and price IDs
    - Set plan to active
  
  2. Security
    - Maintain existing RLS policies
*/

-- Update the monthly plan with actual Stripe IDs
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_Rqz08cYJYNaldb',
  stripe_price_id = 'price_1QxH2KGrxtYDuhPGrU1IpglM',
  is_active = true,
  updated_at = now()
WHERE name = 'Monthly Plan';

-- Add comment explaining the update
COMMENT ON TABLE subscription_plans IS 'Updated with actual Stripe product and price IDs for monthly plan with trial period';