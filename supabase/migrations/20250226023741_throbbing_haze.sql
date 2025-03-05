/*
  # Fix RLS policies for features table

  1. Changes
    - Drop existing RLS policies for features table
    - Create new comprehensive RLS policies that properly handle all operations
    - Add explicit product_id check to all policies
  
  2. Security
    - Ensure users can only manage features for their own products
    - Enable RLS on features table
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own features" ON features;
DROP POLICY IF EXISTS "Users can insert own features" ON features;
DROP POLICY IF EXISTS "Users can update own features" ON features;
DROP POLICY IF EXISTS "Users can delete own features" ON features;
DROP POLICY IF EXISTS "Users can update feature positions" ON features;

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies
CREATE POLICY "Users can read own features"
  ON features
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own features"
  ON features
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
      AND products.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users can delete own features"
  ON features
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  );