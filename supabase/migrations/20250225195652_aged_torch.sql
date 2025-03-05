/*
  # Add RLS policy for feature position updates

  1. Changes
    - Add RLS policy to allow batch updates of feature positions
    - Policy ensures users can only update positions for features they own
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update feature positions" ON features;

-- Create policy for batch position updates
CREATE POLICY "Users can update feature positions"
  ON features
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  );