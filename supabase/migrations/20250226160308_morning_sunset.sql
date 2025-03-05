-- Drop existing notes table and recreate it with updated schema
DROP TABLE IF EXISTS notes;

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure either user_id or product_id is set, but not both
  CONSTRAINT note_context_check CHECK (
    (user_id IS NOT NULL AND product_id IS NULL) OR
    (user_id IS NULL AND product_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_product_id_idx ON notes(product_id);

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

-- Create trigger for updating timestamps
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();