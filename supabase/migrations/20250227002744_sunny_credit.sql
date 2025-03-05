-- Set default type for all existing features that don't have a type
UPDATE features 
SET type = 'feature'
WHERE type IS NULL;

-- Make type NOT NULL with default value for all new features
ALTER TABLE features 
ALTER COLUMN type SET DEFAULT 'feature';

-- Add comment explaining defaults
COMMENT ON COLUMN features.type IS 'Type of card (feature, page, task, bug) with default of "feature"';