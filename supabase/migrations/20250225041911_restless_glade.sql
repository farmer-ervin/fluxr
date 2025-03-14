/*
  # Add customer profiles table
  
  1. New Tables
    - customer_profiles: Stores detailed customer persona information
  
  2. Changes
    - Add RLS policies for customer_profiles table
    - Add indexes for better query performance
*/

-- Create customer_profiles table
CREATE TABLE customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  overview jsonb NOT NULL,
  background jsonb NOT NULL,
  problems jsonb NOT NULL,
  scoring jsonb NOT NULL,
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own customer profiles"
  ON customer_profiles
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = customer_profiles.product_id
    AND products.user_id = auth.uid()
  ));

-- Create indexes
CREATE INDEX customer_profiles_product_id_idx ON customer_profiles(product_id);
CREATE INDEX customer_profiles_is_selected_idx ON customer_profiles(is_selected);

-- Create trigger for updating timestamps
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();