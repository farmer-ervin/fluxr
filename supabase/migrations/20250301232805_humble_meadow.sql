/*
  # Add custom_sections JSONB column to prds table

  1. Changes
     - Add a JSONB column to store custom sections data
     - This replaces the previous approach of trying to add columns dynamically
     - Ensures all custom section data is stored in a structured way
  2. Security
     - No changes to RLS policies required
*/

-- Add custom_sections JSONB column to prds table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prds' 
    AND column_name = 'custom_sections'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE prds ADD COLUMN custom_sections JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS prds_custom_sections_idx ON prds USING gin(custom_sections);

-- Add comment explaining the purpose
COMMENT ON COLUMN prds.custom_sections IS 'Stores custom section content in JSONB format';