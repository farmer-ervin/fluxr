-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own features" ON features;
  DROP POLICY IF EXISTS "Users can insert own features" ON features;
  DROP POLICY IF EXISTS "Users can update own features" ON features;
  DROP POLICY IF EXISTS "Users can delete own features" ON features;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Create position management function
CREATE OR REPLACE FUNCTION manage_feature_positions()
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
DROP TRIGGER IF EXISTS feature_position_trigger ON features;
CREATE TRIGGER feature_position_trigger
  BEFORE INSERT OR UPDATE OF implementation_status ON features
  FOR EACH ROW
  EXECUTE FUNCTION manage_feature_positions();

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own features"
  ON features
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own features"
  ON features
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own features"
  ON features
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own features"
  ON features
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = features.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS features_product_status_position_idx 
  ON features(product_id, implementation_status, position);

-- Update existing features with sequential positions
WITH numbered_features AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id, implementation_status 
      ORDER BY created_at
    ) as new_position
  FROM features
  WHERE position IS NULL OR position = 0
)
UPDATE features
SET position = numbered_features.new_position
FROM numbered_features
WHERE features.id = numbered_features.id;

-- Add comment explaining the changes
COMMENT ON TABLE features IS 'Features table with position management and RLS policies for Kanban board';
COMMENT ON COLUMN features.position IS 'Position within implementation status group for Kanban ordering';
COMMENT ON COLUMN features.implementation_status IS 'Current implementation status for Kanban column placement';