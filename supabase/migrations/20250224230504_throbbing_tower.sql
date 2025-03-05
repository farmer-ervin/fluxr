/*
  # Update Schema Relationships

  1. Changes
    - Add features table for storing product features
    - Update products and PRDs tables with proper relationships
    - Add necessary indexes and foreign key constraints
    - Set up RLS policies for new tables
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create features table
CREATE TABLE IF NOT EXISTS public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  prd_id uuid NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  priority text CHECK (priority IN ('must-have', 'nice-to-have', 'not-prioritized')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on features table
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS features_product_id_idx ON features(product_id);
CREATE INDEX IF NOT EXISTS features_prd_id_idx ON features(prd_id);

-- Create RLS policies for features table
CREATE POLICY "Users can read own features"
  ON features FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own features"
  ON features FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own features"
  ON features FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own features"
  ON features FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = features.product_id
    AND products.user_id = auth.uid()
  ));

-- Create trigger for updating timestamps
CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();