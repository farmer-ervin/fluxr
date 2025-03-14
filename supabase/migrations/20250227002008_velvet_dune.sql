-- Add type column to features table
ALTER TABLE features
ADD COLUMN type text CHECK (
  type IS NULL OR type IN (
    'feature',
    'page',
    'task',
    'bug'
  )
);

-- Create index for better query performance with type filters
CREATE INDEX features_type_idx ON features(type);

-- Add comment explaining the purpose
COMMENT ON COLUMN features.type IS 'Type of card (feature, page, task, bug)';