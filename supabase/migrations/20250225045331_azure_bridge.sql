/*
  # Fix customer profiles uniqueness

  1. Changes
    - Add unique constraint to ensure only one selected profile per product
    - Add trigger to handle profile selection
*/

-- Create function to handle profile selection
CREATE OR REPLACE FUNCTION handle_profile_selection()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_selected THEN
    -- Unselect all other profiles for the same product
    UPDATE customer_profiles
    SET is_selected = false
    WHERE product_id = NEW.product_id
    AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile selection
DROP TRIGGER IF EXISTS customer_profiles_selection_trigger ON customer_profiles;
CREATE TRIGGER customer_profiles_selection_trigger
  BEFORE INSERT OR UPDATE OF is_selected ON customer_profiles
  FOR EACH ROW
  WHEN (NEW.is_selected = true)
  EXECUTE FUNCTION handle_profile_selection();

-- Create index for faster profile selection queries
CREATE INDEX IF NOT EXISTS customer_profiles_product_selected_idx 
ON customer_profiles(product_id, is_selected)
WHERE is_selected = true;