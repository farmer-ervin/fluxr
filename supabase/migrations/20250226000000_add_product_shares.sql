/*
  # Add Product Sharing Functionality

  1. Changes
    - Create product_shares table
    - Add RLS policies for product_shares
    - Update products table RLS policies to handle shared access
    - Add functions for managing shares
*/

-- Create product_shares table
CREATE TABLE product_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'edit',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, shared_with_user_id)
);

-- Enable RLS
ALTER TABLE product_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_shares

-- Allow users to see shares where they are the recipient
CREATE POLICY "Users can view shares where they are the recipient"
  ON product_shares FOR SELECT
  TO authenticated
  USING (
    shared_with_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_shares.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Allow product owners to manage shares
CREATE POLICY "Product owners can manage shares"
  ON product_shares FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = product_shares.product_id
      AND products.user_id = auth.uid()
    )
  );

-- Update products table policies to allow access to shared products
CREATE POLICY "Users can view shared products"
  ON products FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM product_shares
      WHERE product_shares.product_id = products.id
      AND product_shares.shared_with_user_id = auth.uid()
    )
  );

-- Create function to share product with user by email
CREATE OR REPLACE FUNCTION share_product_by_email(
  product_id uuid,
  email_address text
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id uuid;
  share_id uuid;
BEGIN
  -- Check if the requesting user owns the product
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not have permission to share this product';
  END IF;

  -- Get the user ID for the email
  SELECT id INTO target_user_id
  FROM users
  WHERE email = email_address;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_address;
  END IF;

  -- Don't allow sharing with yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot share product with yourself';
  END IF;

  -- Create the share
  INSERT INTO product_shares (product_id, shared_with_user_id)
  VALUES (product_id, target_user_id)
  RETURNING id INTO share_id;

  RETURN share_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Product is already shared with this user';
END;
$$;

-- Create function to remove product share
CREATE OR REPLACE FUNCTION remove_product_share(
  share_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the requesting user owns the product
  IF NOT EXISTS (
    SELECT 1 FROM product_shares ps
    JOIN products p ON p.id = ps.product_id
    WHERE ps.id = share_id
    AND p.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not have permission to remove this share';
  END IF;

  -- Remove the share
  DELETE FROM product_shares WHERE id = share_id;
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_product_shares_updated_at
  BEFORE UPDATE ON product_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 