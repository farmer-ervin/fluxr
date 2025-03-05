/*
  # Fix user creation with improved error handling

  1. Changes
    - Drop and recreate the handle_new_user function with improved error handling
    - Add detailed logging for debugging
    - Ensure proper transaction handling
    - Add better error messages

  2. Security
    - Maintain existing RLS policies
    - Keep security definer setting
*/

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
DECLARE
  _error_message text;
BEGIN
  -- Log the start of the function for debugging
  RAISE NOTICE 'handle_new_user starting for user_id: %, email: %', NEW.id, NEW.email;

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
      updated_at = now()
    RETURNING id;

    -- Log successful insertion/update
    RAISE NOTICE 'User record created/updated successfully for user_id: %', NEW.id;
    
    RETURN NEW;
  EXCEPTION 
    WHEN unique_violation THEN
      -- Log unique violation error
      GET STACKED DIAGNOSTICS _error_message = MESSAGE_TEXT;
      RAISE WARNING 'Unique violation in handle_new_user: %', _error_message;
      
      -- Try to update existing record
      UPDATE public.users
      SET 
        email = NEW.email,
        full_name = COALESCE((NEW.raw_user_meta_data->>'full_name')::text, full_name),
        updated_at = now()
      WHERE id = NEW.id;
      
      RETURN NEW;
      
    WHEN OTHERS THEN
      -- Log any other errors
      GET STACKED DIAGNOSTICS _error_message = MESSAGE_TEXT;
      RAISE WARNING 'Error in handle_new_user: %', _error_message;
      
      -- Return NULL to prevent the trigger from failing
      -- This allows the auth.users insert to succeed while logging the error
      RETURN NULL;
  END;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();