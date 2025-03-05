/*
  # Fix customer profiles and feature handling

  1. Changes
    - Add unique constraint to ensure only one selected profile per product
    - Add trigger to handle profile selection properly
    - Add validation to prevent invalid UUID errors
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS customer_profiles_selection_trigger ON customer_profiles;
DROP FUNCTION IF EXISTS handle_profile_selection();

-- Create improved profile selection handler
CREATE OR REPLACE FUNCTION handle_profile_selection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate product_id is not null
  IF NEW.product_id IS NULL THEN
    RAISE EXCEPTION 'product_id cannot be null';
  END IF;

  -- Only proceed if this profile is being selected
  IF NEW.is_selected THEN
    -- Unselect all other profiles for the same product
    UPDATE customer_profiles
    SET is_selected = false
    WHERE product_id = NEW.product_id
    AND id != NEW.id
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

-- Add constraint to ensure product_id is never null
ALTER TABLE customer_profiles 
  ALTER COLUMN product_id SET NOT NULL,
  ALTER COLUMN is_selected SET DEFAULT false;

-- Create unique partial index to ensure only one selected profile per product
DROP INDEX IF EXISTS idx_customer_profiles_selected;
CREATE UNIQUE INDEX idx_customer_profiles_selected 
  ON customer_profiles (product_id) 
  WHERE is_selected = true;

-- Add validation trigger to prevent invalid UUIDs
CREATE OR REPLACE FUNCTION validate_uuid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS NOT NULL AND NOT is_uuid(NEW.id::text) THEN
    RAISE EXCEPTION 'Invalid UUID format';
  END IF;
  
  IF NOT is_uuid(NEW.product_id::text) THEN
    RAISE EXCEPTION 'Invalid product_id UUID format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger
DROP TRIGGER IF EXISTS customer_profiles_uuid_validation ON customer_profiles;
CREATE TRIGGER customer_profiles_uuid_validation
  BEFORE INSERT OR UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_uuid();