/*
  # Update PRD Schema and Create Product Function

  1. Changes
    - Drop existing PRD table
    - Create new PRD table with text fields
    - Update create_product function
    - Add RLS policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing PRD table
DROP TABLE IF EXISTS prds CASCADE;

-- Create new PRD table with text fields
CREATE TABLE prds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  problem text NOT NULL DEFAULT '',
  solution text NOT NULL DEFAULT '',
  target_audience text NOT NULL DEFAULT '',
  tech_stack text NOT NULL DEFAULT '',
  success_metrics text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own PRDs"
  ON prds FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own PRDs"
  ON prds FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own PRDs"
  ON prds FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own PRDs"
  ON prds FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = prds.product_id
    AND products.user_id = auth.uid()
  ));

-- Create trigger for updating timestamps
CREATE TRIGGER update_prds_updated_at
  BEFORE UPDATE ON prds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update the create_product function
CREATE OR REPLACE FUNCTION public.create_product(
  user_id uuid,
  product_name text,
  product_description text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_product_id uuid;
BEGIN
  -- Ensure user exists
  PERFORM ensure_user_exists(user_id);

  -- Create product
  INSERT INTO products (user_id, name, description)
  VALUES (user_id, product_name, product_description)
  RETURNING id INTO new_product_id;

  -- Create initial PRD with empty strings
  INSERT INTO prds (
    product_id,
    problem,
    solution,
    target_audience,
    tech_stack,
    success_metrics
  )
  VALUES (
    new_product_id,
    '',  -- empty problem
    '',  -- empty solution
    '',  -- empty target_audience
    '',  -- empty tech_stack
    ''   -- empty success_metrics
  );

  RETURN new_product_id;
END;
$$;