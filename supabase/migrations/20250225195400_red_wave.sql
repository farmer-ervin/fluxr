/*
  # Add position column to features table

  1. Changes
    - Add position column to features table for drag and drop ordering
    - Create index on position column for better performance
    - Update existing features with sequential positions
*/

-- Add position column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'features' 
    AND column_name = 'position'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE features ADD COLUMN position integer;
    
    -- Create index for better performance
    CREATE INDEX features_position_idx ON features(position);
    
    -- Update existing features with sequential positions
    WITH numbered_features AS (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY product_id 
        ORDER BY created_at
      ) as row_num
      FROM features
    )
    UPDATE features
    SET position = numbered_features.row_num
    FROM numbered_features
    WHERE features.id = numbered_features.id;
    
    -- Make position NOT NULL after backfill
    ALTER TABLE features ALTER COLUMN position SET NOT NULL;
  END IF;
END $$;