/*
  # Add Kanban, Prompts, and Notes Features

  1. New Tables
    - kanban_boards: Links to products/PRDs
    - kanban_columns: Customizable columns for each board
    - kanban_cards: Tasks/features linked to PRD features
    - prompt_templates: Reusable prompt templates
    - product_prompts: Product-specific prompts
    - notes: General and product-specific notes
    
  2. Changes to Existing Tables
    - Split problem_solution in PRDs table
    - Remove overview and features columns
    - Add foreign key constraints
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create kanban_boards table
CREATE TABLE IF NOT EXISTS kanban_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create kanban_columns table
CREATE TABLE IF NOT EXISTS kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create kanban_cards table
CREATE TABLE IF NOT EXISTS kanban_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES kanban_columns(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prompt_templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  template text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_prompts table
CREATE TABLE IF NOT EXISTS product_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  template_id uuid REFERENCES prompt_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Modify PRDs table using DO block for safety
DO $$ 
BEGIN
  -- Remove columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prds' AND column_name = 'overview') THEN
    ALTER TABLE prds DROP COLUMN overview;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prds' AND column_name = 'features') THEN
    ALTER TABLE prds DROP COLUMN features;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prds' AND column_name = 'problem_solution') THEN
    ALTER TABLE prds DROP COLUMN problem_solution;
  END IF;

  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prds' AND column_name = 'problem') THEN
    ALTER TABLE prds ADD COLUMN problem text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prds' AND column_name = 'solution') THEN
    ALTER TABLE prds ADD COLUMN solution text;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kanban_boards
CREATE POLICY "Users can manage own kanban boards"
  ON kanban_boards
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = kanban_boards.product_id
    AND products.user_id = auth.uid()
  ));

-- Create RLS policies for kanban_columns
CREATE POLICY "Users can manage own kanban columns"
  ON kanban_columns
  USING (EXISTS (
    SELECT 1 FROM kanban_boards
    JOIN products ON products.id = kanban_boards.product_id
    WHERE kanban_boards.id = kanban_columns.board_id
    AND products.user_id = auth.uid()
  ));

-- Create RLS policies for kanban_cards
CREATE POLICY "Users can manage own kanban cards"
  ON kanban_cards
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    JOIN products ON products.id = kanban_boards.product_id
    WHERE kanban_columns.id = kanban_cards.column_id
    AND products.user_id = auth.uid()
  ));

-- Create RLS policies for prompt_templates
CREATE POLICY "Users can manage own prompt templates"
  ON prompt_templates
  USING (user_id = auth.uid());

-- Create RLS policies for product_prompts
CREATE POLICY "Users can manage own product prompts"
  ON product_prompts
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_prompts.product_id
    AND products.user_id = auth.uid()
  ));

-- Create RLS policies for notes
CREATE POLICY "Users can manage own notes"
  ON notes
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS kanban_boards_product_id_idx ON kanban_boards(product_id);
CREATE INDEX IF NOT EXISTS kanban_columns_board_id_idx ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS kanban_cards_column_id_idx ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS kanban_cards_feature_id_idx ON kanban_cards(feature_id);
CREATE INDEX IF NOT EXISTS product_prompts_product_id_idx ON product_prompts(product_id);
CREATE INDEX IF NOT EXISTS product_prompts_template_id_idx ON product_prompts(template_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_product_id_idx ON notes(product_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_kanban_boards_updated_at
  BEFORE UPDATE ON kanban_boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON kanban_columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_cards_updated_at
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_prompts_updated_at
  BEFORE UPDATE ON product_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();