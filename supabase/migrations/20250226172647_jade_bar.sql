/*
  # Add is_public column to prompt_templates

  1. New Columns
    - `is_public` (boolean, default false) added to prompt_templates table
  2. Purpose
    - Enables sharing prompts with the community
    - Controls visibility of prompts to other users
*/

-- Add is_public column to prompt_templates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_templates' 
    AND column_name = 'is_public'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE prompt_templates ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;
    
    -- Create index for better query performance when filtering public prompts
    CREATE INDEX prompt_templates_is_public_idx ON prompt_templates(is_public) WHERE is_public = true;
  END IF;
END $$;