/*
  # Add Permission Levels for Product Sharing

  1. Changes
    - Create permission_level enum type
    - Update product_shares table
    - Update share_product_by_email function
*/

-- First remove the default and drop existing column
ALTER TABLE product_shares 
  ALTER COLUMN permission_level DROP DEFAULT;

-- Create permission level enum
CREATE TYPE product_share_permission AS ENUM ('read', 'edit');

-- Update the column type
ALTER TABLE product_shares 
  ALTER COLUMN permission_level TYPE product_share_permission 
  USING 
    CASE permission_level 
      WHEN 'edit' THEN 'edit'::product_share_permission 
      ELSE 'read'::product_share_permission 
    END;

-- Add back the default
ALTER TABLE product_shares 
  ALTER COLUMN permission_level SET DEFAULT 'edit'::product_share_permission;

-- Update share_product_by_email function
CREATE OR REPLACE FUNCTION share_product_by_email(
  product_id uuid,
  email_address text,
  permission product_share_permission DEFAULT 'edit'
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

  -- Create the share with specified permission
  INSERT INTO product_shares (product_id, shared_with_user_id, permission_level)
  VALUES (product_id, target_user_id, permission)
  RETURNING id INTO share_id;

  RETURN share_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Product is already shared with this user';
END;
$$;

-- Update products RLS policy to check permission level for modifications
DROP POLICY IF EXISTS "Users can update shared products" ON products;
CREATE POLICY "Users can update shared products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM product_shares
      WHERE product_shares.product_id = products.id
      AND product_shares.shared_with_user_id = auth.uid()
      AND product_shares.permission_level = 'edit'
    )
  );

DROP POLICY IF EXISTS "Users can delete shared products" ON products;
CREATE POLICY "Users can delete shared products"
  ON products FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()); -- Only owners can delete products 