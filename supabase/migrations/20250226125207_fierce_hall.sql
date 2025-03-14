/*
  # Enhance flow pages with layout data

  1. New Tables
    - `flow_layouts` stores AI-generated layout suggestions
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `layout_data` (jsonb) stores page positions and relationships
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on new table
    - Add policy for authenticated users
*/

-- Create flow_layouts table
CREATE TABLE flow_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  layout_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE flow_layouts ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX flow_layouts_product_id_idx ON flow_layouts(product_id);

-- Create RLS policy
CREATE POLICY "Users can manage own flow layouts"
  ON flow_layouts
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = flow_layouts.product_id
    AND products.user_id = auth.uid()
  ));