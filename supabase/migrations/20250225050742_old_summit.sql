/*
  # Create customer profiles table with improved constraints

  1. Changes
    - Create customer_profiles table with proper constraints
    - Add profile selection trigger
    - Add timestamp update trigger
    - Add RLS policies
*/

-- Create customer_profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'customer_profiles' 
    AND table_schema = 'public'
  ) THEN
    CREATE TABLE customer_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name text NOT NULL,
      overview jsonb NOT NULL DEFAULT '{}'::jsonb,
      background jsonb NOT NULL DEFAULT '{}'::jsonb,
      problems jsonb NOT NULL DEFAULT '{}'::jsonb,
      scoring jsonb NOT NULL DEFAULT '{}'::jsonb,
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
  END IF;
END $$;

-- Create profile selection handler function
CREATE OR REPLACE FUNCTION handle_profile_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if this profile is being selected
  IF NEW.is_selected THEN
    -- Unselect all other profiles for the same product
    UPDATE customer_profiles
    SET is_selected = false
    WHERE product_id = NEW.product_id
    AND id IS DISTINCT FROM NEW.id
    AND is_selected = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS customer_profiles_selection_trigger ON customer_profiles;

-- Create trigger for profile selection
CREATE TRIGGER customer_profiles_selection_trigger
  BEFORE INSERT OR UPDATE OF is_selected ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_selection();

-- Create timestamp update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();