/*
  # Fix RLS policies for features table

  1. Changes
    - Drop existing RLS policies
    - Create new comprehensive RLS policies that properly handle all operations
    - Add position column if missing
    - Add implementation_status column if missing
    - Add proper indexes for better performance

  2. Security
    - Enable RLS
    - Add policies for all CRUD operations
    - Ensure users can only access their own features
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own features" ON features;
DROP POLICY IF EXISTS "Users can insert own features" ON features;
DROP POLICY IF EXISTS "Users can update own features" ON features;
DROP POLICY IF EXISTS "Users can delete own features" ON features;

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'features' 
    AND column_name = 'position'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE features ADD COLUMN position integer DEFAULT 0;
  END IF;
END $$;

-- Add implementation_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'features' 
    AND column_name = 'implementation_status'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE features 
    ADD COLUMN implementation_status text 
    CHECK (implementation_status IN (
      'not_started',
      'in_progress',
      'completed',
      'blocked',
      'deferred'
    )) 
    DEFAULT 'not_started';
  END IF;
END $$;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS features_product_id_idx ON features(product_id);
CREATE INDEX IF NOT EXISTS features_implementation_status_idx ON features(implementation_status);
CREATE INDEX IF NOT EXISTS features_position_idx ON features(position);