/*
  # Remove feature policies

  1. Changes
    - Drop all existing RLS policies for the features table
    - Keep RLS enabled on the table
    - Document removed policies in comments for reference
*/

-- Drop all existing feature policies
DROP POLICY IF EXISTS "Users can read own features" ON features;
DROP POLICY IF EXISTS "Users can insert own features" ON features;
DROP POLICY IF EXISTS "Users can update own features" ON features;
DROP POLICY IF EXISTS "Users can delete own features" ON features;

-- Keep RLS enabled
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

/*
  Removed policies (for reference):

  1. Users can read own features:
     FOR SELECT using (EXISTS (
       SELECT 1 FROM products
       WHERE products.id = features.product_id
       AND products.user_id = auth.uid()
     ))

  2. Users can insert own features:
     FOR INSERT with check (EXISTS (
       SELECT 1 FROM products
       WHERE products.id = product_id
       AND products.user_id = auth.uid()
     ))

  3. Users can update own features:
     FOR UPDATE using (EXISTS (
       SELECT 1 FROM products
       WHERE products.id = features.product_id
       AND products.user_id = auth.uid()
     ))
     WITH CHECK (EXISTS (
       SELECT 1 FROM products
       WHERE products.id = features.product_id
       AND products.user_id = auth.uid()
     ))

  4. Users can delete own features:
     FOR DELETE using (EXISTS (
       SELECT 1 FROM products
       WHERE products.id = features.product_id
       AND products.user_id = auth.uid()
     ))
*/