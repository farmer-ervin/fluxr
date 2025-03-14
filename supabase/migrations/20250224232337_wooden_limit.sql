/*
  # Fix user creation race condition

  1. Changes
    - Add synchronous user creation function
    - Improve error handling in user creation process
    - Add function to ensure user exists before product creation

  2. Security
    - Maintain existing RLS policies
    - Keep security definer setting
*/

-- Create function to ensure user exists
CREATE OR REPLACE FUNCTION public.ensure_user_exists(user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
BEGIN
  -- Check if user already exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    RETURN;
  END IF;

  -- Get user from auth.users
  SELECT * INTO auth_user FROM auth.users WHERE id = user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  -- Create user record
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    auth_user.id,
    auth_user.email,
    COALESCE((auth_user.raw_user_meta_data->>'full_name')::text, '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = now();
END;
$$;

-- Create function to create product with user verification
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

  -- Create initial PRD
  INSERT INTO prds (product_id, overview, problem_solution, target_audience, features, tech_stack, success_metrics)
  VALUES (new_product_id, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb);

  RETURN new_product_id;
END;
$$;