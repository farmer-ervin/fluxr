/*
  # Fix RLS policies for features table

  1. Changes
    - Drop existing RLS policies
    - Create new comprehensive RLS policies that properly handle all CRUD operations
    - Add explicit policies for position and status updates
    - Ensure policies use proper user authentication checks

  2. Security
    - Maintain row-level security for feature data
    - Only allow users to access features from their own products
    - Enable batch updates for feature positions and status changes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own features" ON features;
DROP POLICY IF EXISTS "Users can insert own features" ON features;
DROP POLICY IF EXISTS "Users can update own features" ON features;
DROP POLICY IF EXISTS "Users can delete own features" ON features;

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS features_implementation_status_idx ON features(implementation_status);
CREATE INDEX IF NOT EXISTS features_product_position_idx ON features(product_id, position);