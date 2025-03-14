-- First, enable RLS on both tables to ensure it's enabled
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can manage own kanban cards" ON kanban_cards;
DROP POLICY IF EXISTS "Users can read own features" ON features;
DROP POLICY IF EXISTS "Users can insert own features" ON features;
DROP POLICY IF EXISTS "Users can update own features" ON features;
DROP POLICY IF EXISTS "Users can delete own features" ON features;

-- Create improved kanban cards policy
CREATE POLICY "Users can manage own kanban cards"
  ON kanban_cards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kanban_columns
      JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
      JOIN products ON products.id = kanban_boards.product_id
      WHERE kanban_columns.id = kanban_cards.column_id
      AND (
        -- Allow managing cards without features
        kanban_cards.feature_id IS NULL
        OR
        -- Verify ownership of linked feature
        EXISTS (
          SELECT 1 FROM features
          WHERE features.id = kanban_cards.feature_id
          AND features.product_id = products.id
        )
      )
      AND products.user_id = auth.uid()
    )
  );

-- Create comprehensive features policies
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

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON kanban_cards TO authenticated;