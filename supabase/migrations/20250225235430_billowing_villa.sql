/*
  # Add User Flows Schema

  1. New Tables
    - `flow_pages`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `name` (text)
      - `functionality` (text)
      - `position_x` (float)
      - `position_y` (float)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `flow_connections`
      - `id` (uuid, primary key)
      - `source_id` (uuid, references flow_pages)
      - `target_id` (uuid, references flow_pages)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own flows
    - Add foreign key constraints
    - Add indexes for better performance

  3. Changes
    - Add triggers for updating timestamps
    - Add validation to prevent self-referential connections
*/

-- Create flow_pages table
CREATE TABLE flow_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  functionality text,
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_connections table
CREATE TABLE flow_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES flow_pages(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES flow_pages(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  -- Prevent self-referential connections
  CONSTRAINT no_self_connections CHECK (source_id != target_id)
);

-- Enable Row Level Security
ALTER TABLE flow_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flow_pages
CREATE POLICY "Users can manage own flow pages"
  ON flow_pages
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = flow_pages.product_id
    AND products.user_id = auth.uid()
  ));

-- Create RLS policies for flow_connections
CREATE POLICY "Users can manage own flow connections"
  ON flow_connections
  USING (EXISTS (
    SELECT 1 FROM flow_pages
    JOIN products ON products.id = flow_pages.product_id
    WHERE (
      flow_pages.id = flow_connections.source_id
      OR flow_pages.id = flow_connections.target_id
    )
    AND products.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX flow_pages_product_id_idx ON flow_pages(product_id);
CREATE INDEX flow_connections_source_id_idx ON flow_connections(source_id);
CREATE INDEX flow_connections_target_id_idx ON flow_connections(target_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_flow_pages_updated_at
  BEFORE UPDATE ON flow_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();