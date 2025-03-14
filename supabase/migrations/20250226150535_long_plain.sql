-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own features" ON features;

-- Create the corrected update policy that matches the documentation
CREATE POLICY "Users can update own features"
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

-- Ensure authenticated users have the necessary permissions
GRANT UPDATE ON features TO authenticated;