-- Drop existing trigger and function
DROP TRIGGER IF EXISTS feature_position_trigger ON features;
DROP FUNCTION IF EXISTS update_feature_positions();

-- Create improved function that handles RLS properly
CREATE OR REPLACE FUNCTION update_feature_positions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_position integer;
  has_access boolean;
BEGIN
  -- First verify the user has access to the product
  SELECT EXISTS (
    SELECT 1 FROM products
    WHERE id = NEW.product_id
    AND user_id = auth.uid()
  ) INTO has_access;

  IF NOT has_access THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- If this is an INSERT or the implementation_status has changed
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND OLD.implementation_status IS DISTINCT FROM NEW.implementation_status) THEN
    -- Get the highest position in the new status group
    SELECT COALESCE(MAX(position), 0)
    INTO max_position
    FROM features
    WHERE product_id = NEW.product_id
    AND implementation_status = NEW.implementation_status;

    -- Set the new position
    NEW.position = max_position + 1;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for position management
CREATE TRIGGER feature_position_trigger
  BEFORE INSERT OR UPDATE OF implementation_status ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_positions();

-- Re-enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage own features" ON features;
  
  -- Create comprehensive features policy
  CREATE POLICY "Users can manage own features"
    ON features
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM products
        WHERE products.id = features.product_id
        AND products.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;