/*
  # Fix UUID validation for customer profiles

  1. Changes
    - Drop and recreate RLS policy to allow column type change
    - Add proper UUID validation
    - Improve error handling
*/

-- First drop the existing policy
DROP POLICY IF EXISTS "Users can manage own customer profiles" ON customer_profiles;

-- Now we can safely alter the column types
ALTER TABLE customer_profiles
  ALTER COLUMN id TYPE uuid USING id::uuid,
  ALTER COLUMN product_id TYPE uuid USING product_id::uuid;

-- Create improved UUID validation function
CREATE OR REPLACE FUNCTION validate_customer_profile_uuid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate id if provided
  IF NEW.id IS NOT NULL THEN
    BEGIN
      PERFORM NEW.id::uuid;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid UUID format for id: %', NEW.id;
    END;
  END IF;
  
  -- Validate product_id
  BEGIN
    PERFORM NEW.product_id::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid UUID format for product_id: %', NEW.product_id;
  END;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
DROP TRIGGER IF EXISTS customer_profiles_uuid_validation ON customer_profiles;
CREATE TRIGGER customer_profiles_uuid_validation
  BEFORE INSERT OR UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_customer_profile_uuid();

-- Create index for faster UUID lookups
CREATE INDEX IF NOT EXISTS customer_profiles_id_idx ON customer_profiles(id);

-- Recreate the RLS policy
CREATE POLICY "Users can manage own customer profiles"
  ON customer_profiles
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = customer_profiles.product_id
    AND products.user_id = auth.uid()
  ));