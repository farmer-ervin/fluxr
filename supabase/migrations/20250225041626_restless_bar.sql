/*
  # Fix OpenAI logs RLS policies

  1. Changes
    - Safely check for and create RLS policies for openai_logs table
    - Add index for request_type for better query performance
*/

DO $$ 
BEGIN
  -- Check if the policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'openai_logs' 
    AND policyname = 'Users can insert own logs'
  ) THEN
    CREATE POLICY "Users can insert own logs"
      ON openai_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- Create index for request_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'openai_logs' 
    AND indexname = 'openai_logs_request_type_idx'
  ) THEN
    CREATE INDEX openai_logs_request_type_idx ON openai_logs(request_type);
  END IF;
END $$;