/*
  # Add Features Management (Safe Version)

  1. New Tables
    - Ensures features table exists with proper structure
    - Safely adds RLS policies if they don't exist
    - Adds performance index
    - Sets up update trigger

  2. Changes
    - Uses DO blocks for safe policy creation
    - Checks for existing policies before creating
*/

-- Create features table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'features' 
    AND table_schema = 'public'
  ) THEN
    CREATE TABLE features (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      priority text CHECK (priority IN ('must-have', 'nice-to-have', 'not-prioritized')),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE features ENABLE ROW LEVEL SECURITY;

    -- Create index for better performance
    CREATE INDEX features_product_id_idx ON features(product_id);

    -- Create trigger for updating timestamps
    CREATE TRIGGER update_features_updated_at
      BEFORE UPDATE ON features
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Safely create RLS policies
DO $$ 
BEGIN
  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' 
    AND policyname = 'Users can read own features'
  ) THEN
    CREATE POLICY "Users can read own features"
      ON features FOR SELECT
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM products
        WHERE products.id = features.product_id
        AND products.user_id = auth.uid()
      ));
  END IF;

  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' 
    AND policyname = 'Users can insert own features'
  ) THEN
    CREATE POLICY "Users can insert own features"
      ON features FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM products
        WHERE products.id = features.product_id
        AND products.user_id = auth.uid()
      ));
  END IF;

  -- Check and create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' 
    AND policyname = 'Users can update own features'
  ) THEN
    CREATE POLICY "Users can update own features"
      ON features FOR UPDATE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM products
        WHERE products.id = features.product_id
        AND products.user_id = auth.uid()
      ));
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'features' 
    AND policyname = 'Users can delete own features'
  ) THEN
    CREATE POLICY "Users can delete own features"
      ON features FOR DELETE
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM products
        WHERE products.id = features.product_id
        AND products.user_id = auth.uid()
      ));
  END IF;
END $$;