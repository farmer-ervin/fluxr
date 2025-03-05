/*
  # Fix customer profiles and features handling

  1. Changes
    - Add proper UUID validation for customer profiles
    - Add constraints to prevent invalid data
    - Improve profile selection handling
    - Add proper indexes for performance
*/

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS customer_profiles_selection_trigger ON customer_profiles;
DROP TRIGGER IF EXISTS customer_profiles_uuid_validation ON customer_profiles;
DROP FUNCTION IF EXISTS handle_profile_selection();
DROP FUNCTION IF EXISTS validate_customer_profile_uuid();

-- Create improved profile selection handler
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

-- Create trigger for profile selection
CREATE TRIGGER customer_profiles_selection_trigger
  BEFORE INSERT OR UPDATE OF is_selected ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_selection();

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
  IF NEW.product_id IS NOT NULL THEN
    BEGIN
      PERFORM NEW.product_id::uuid;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Invalid UUID format for product_id: %', NEW.product_id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
CREATE TRIGGER customer_profiles_uuid_validation
  BEFORE INSERT OR UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_customer_profile_uuid();

-- Add constraints and defaults
ALTER TABLE customer_profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN is_selected SET DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_product_id ON customer_profiles(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_selected ON customer_profiles(product_id) WHERE is_selected = true;