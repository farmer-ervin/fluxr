/*
  # Add index on users.email

  1. Changes
    - Add index on users.email for improved query performance
*/

-- Create index on users.email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND indexname = 'users_email_idx'
  ) THEN
    CREATE INDEX users_email_idx ON users (email);
  END IF;
END $$;