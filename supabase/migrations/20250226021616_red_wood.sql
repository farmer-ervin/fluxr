/*
  # Add flow generation support

  1. Changes
    - Add model field to openai_logs table
    - Add index for model field
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
    ALTER TABLE openai_logs ADD COLUMN model text NOT NULL DEFAULT 'gpt-4o-mini';
  END IF;
END $$;

-- Create index for model field
CREATE INDEX IF NOT EXISTS openai_logs_model_idx ON openai_logs(model);