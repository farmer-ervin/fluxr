/*
  # Add full_name column to users table

  1. Changes
    - Add full_name column to users table if it doesn't exist
    - Update user creation function to handle full_name properly

  2. Security
    - Maintain existing RLS policies
*/

-- Add full_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'full_name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name text;
  END IF;
END $$;

-- Update handle_new_user function to properly handle full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _error_message text;
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'full_name')::text, '')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      updated_at = now();
    
    RETURN NEW;
  EXCEPTION 
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS _error_message = MESSAGE_TEXT;
      RAISE WARNING 'Error in handle_new_user: %', _error_message;
      RETURN NULL;
  END;
END;
$$;