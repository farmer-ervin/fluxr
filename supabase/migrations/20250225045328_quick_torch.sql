/*
  # Add model column to OpenAI logs

  1. Changes
    - Add model column to openai_logs table
    - Add NOT NULL constraint to required columns
    - Create index on model column
*/

-- Add model column to openai_logs if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'openai_logs' 
    AND column_name = 'model'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE openai_logs ADD COLUMN model text NOT NULL DEFAULT 'gpt-4';
  END IF;
END $$;

-- Add NOT NULL constraints to required columns
ALTER TABLE openai_logs
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN request_type SET NOT NULL,
  ALTER COLUMN request_payload SET NOT NULL;

-- Create index on model column
CREATE INDEX IF NOT EXISTS openai_logs_model_idx ON openai_logs(model);