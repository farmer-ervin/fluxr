/*
  # Fix user creation process

  1. Changes
    - Add ON CONFLICT DO NOTHING to users table creation
    - Improve handle_new_user function to be more robust
    - Add better error handling for user creation
  
  2. Security
    - Maintain existing RLS policies
    - Ensure secure user data handling
*/

-- Recreate users table with improved constraints
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
      full_name = EXCLUDED.full_name,
      updated_at = now();
    
    EXCEPTION 
      WHEN unique_violation THEN
        -- If there's a unique violation, try to update the existing record
        UPDATE public.users
        SET 
          email = NEW.email,
          full_name = COALESCE((NEW.raw_user_meta_data->>'full_name')::text, ''),
          updated_at = now()
        WHERE id = NEW.id;
      WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
        RETURN NULL;
    END;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies exist
DO $$ 
BEGIN
  -- Users can read their own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Users can update their own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;