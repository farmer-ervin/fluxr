-- Drop the redundant tables
DROP TABLE IF EXISTS kanban_cards CASCADE;
DROP TABLE IF EXISTS kanban_columns CASCADE;
DROP TABLE IF EXISTS kanban_boards CASCADE;

-- Ensure features table has the correct implementation_status constraint
ALTER TABLE features DROP CONSTRAINT IF EXISTS features_implementation_status_check;
ALTER TABLE features ADD CONSTRAINT features_implementation_status_check 
  CHECK (implementation_status IN (
    'not_started',
    'in_progress',
    'completed',
    'blocked',
    'deferred'
  ));

-- Create index for faster grouping and filtering
CREATE INDEX IF NOT EXISTS features_implementation_status_idx 
  ON features(implementation_status);

-- Create index for ordering within status groups
CREATE INDEX IF NOT EXISTS features_product_status_position_idx 
  ON features(product_id, implementation_status, position);