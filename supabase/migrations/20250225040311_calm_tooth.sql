/*
  # Remove PRD requirement from features table
  
  1. Changes
    - Remove prd_id column from features table since features are now associated directly with products
    - Add NOT NULL constraint to implementation_status
    - Add NOT NULL constraint to priority
  
  2. Data Migration
    - Set default values for any NULL implementation_status or priority values
*/

-- Remove prd_id column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'features' 
    AND column_name = 'prd_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE features DROP COLUMN prd_id;
  END IF;
END $$;

-- Ensure implementation_status and priority have default values
UPDATE features 
SET implementation_status = 'not_started' 
WHERE implementation_status IS NULL;

UPDATE features 
SET priority = 'not-prioritized' 
WHERE priority IS NULL;

-- Add NOT NULL constraints
ALTER TABLE features 
  ALTER COLUMN implementation_status SET NOT NULL,
  ALTER COLUMN priority SET NOT NULL;