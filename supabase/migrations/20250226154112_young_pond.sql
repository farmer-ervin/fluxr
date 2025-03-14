-- Create function to update feature positions
CREATE OR REPLACE FUNCTION update_feature_positions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_position integer;
BEGIN
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
DROP TRIGGER IF EXISTS feature_position_trigger ON features;
CREATE TRIGGER feature_position_trigger
  BEFORE INSERT OR UPDATE OF implementation_status ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_positions();

-- Fix existing features with 0 positions
WITH numbered_features AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id, implementation_status 
      ORDER BY created_at
    ) as new_position
  FROM features
  WHERE position = 0
)
UPDATE features
SET position = numbered_features.new_position
FROM numbered_features
WHERE features.id = numbered_features.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS features_product_status_position_idx 
  ON features(product_id, implementation_status, position);

-- Re-enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Recreate the comprehensive features policy
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