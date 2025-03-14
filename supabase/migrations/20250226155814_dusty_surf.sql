-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own notes" ON notes;
  DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
  DROP POLICY IF EXISTS "Users can update own notes" ON notes;
  DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Ensure RLS is enabled
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access to user's personal notes
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    -- Allow access to notes of products owned by the user
    (product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow creating personal notes
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    -- Allow creating notes for owned products
    (product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow updating personal notes
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    -- Allow updating notes of owned products
    (product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (
    -- Allow deleting personal notes
    (user_id = auth.uid() AND product_id IS NULL)
    OR
    -- Allow deleting notes of owned products
    (product_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM products
      WHERE products.id = notes.product_id
      AND products.user_id = auth.uid()
    ))
  );

-- Create indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND indexname = 'notes_user_id_idx'
  ) THEN
    CREATE INDEX notes_user_id_idx ON notes(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'notes' 
    AND indexname = 'notes_product_id_idx'
  ) THEN
    CREATE INDEX notes_product_id_idx ON notes(product_id);
  END IF;
END $$;

-- Ensure trigger exists for updating timestamps
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_notes_updated_at'
  ) THEN
    CREATE TRIGGER update_notes_updated_at
      BEFORE UPDATE ON notes
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;