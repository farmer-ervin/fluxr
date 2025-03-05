/*
  # Add RLS policy for public prompts

  1. Purpose
    - Allows users to read prompt templates that are marked as public
    - Fixes issue where public prompts were not visible to other users
*/

-- Add RLS policy for public prompts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_templates' 
    AND policyname = 'Users can read public prompt templates'
  ) THEN
    CREATE POLICY "Users can read public prompt templates"
      ON prompt_templates
      FOR SELECT
      USING (is_public = true);
  END IF;
END $$; 