-- Add product_id column to flow_connections
ALTER TABLE flow_connections
ADD COLUMN product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX flow_connections_product_id_idx ON flow_connections(product_id);

-- Update existing flow_connections with product_id from flow_pages
UPDATE flow_connections
SET product_id = flow_pages.product_id
FROM flow_pages
WHERE flow_pages.id = flow_connections.source_id;

-- Update RLS policy to use product_id
DROP POLICY IF EXISTS "Users can manage own flow connections" ON flow_connections;

CREATE POLICY "Users can manage own flow connections"
  ON flow_connections
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = flow_connections.product_id
    AND products.user_id = auth.uid()
  ));