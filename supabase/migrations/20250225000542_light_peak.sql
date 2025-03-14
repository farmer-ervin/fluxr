/*
  # Update PRD Schema and Create Product Function

  1. Changes
    - Update create_product function to handle new PRD structure
    - Add default values for PRD columns
    - Ensure all columns are properly initialized

  2. Security
    - Maintain existing RLS policies
    - Function remains security definer
*/

-- Update the create_product function to handle the new PRD structure
CREATE OR REPLACE FUNCTION public.create_product(
  user_id uuid,
  product_name text,
  product_description text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_product_id uuid;
BEGIN
  -- Ensure user exists
  PERFORM ensure_user_exists(user_id);

  -- Create product
  INSERT INTO products (user_id, name, description)
  VALUES (user_id, product_name, product_description)
  RETURNING id INTO new_product_id;

  -- Create initial PRD with empty content
  INSERT INTO prds (
    product_id,
    problem,
    solution,
    target_audience,
    tech_stack,
    success_metrics
  )
  VALUES (
    new_product_id,
    '',  -- empty problem
    '',  -- empty solution
    '',  -- empty target_audience
    '',  -- empty tech_stack
    ''   -- empty success_metrics
  );

  RETURN new_product_id;
END;
$$;