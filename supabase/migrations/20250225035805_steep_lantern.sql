/*
  # Add feature status and dependencies

  1. Changes
    - Add implementation_status to features table
    - Create feature_dependencies table for tracking dependencies
    - Add indexes for better query performance
    - Add RLS policies for new table

  2. New Fields
    - implementation_status: Tracks the current state of feature implementation
      - not_started
      - in_progress
      - completed
      - blocked
      - deferred

  3. New Tables
    - feature_dependencies: Tracks relationships between features
      - feature_id: The dependent feature
      - depends_on_id: The feature being depended on
*/

-- Add implementation_status to features table
ALTER TABLE features ADD COLUMN implementation_status text CHECK (
  implementation_status IN (
    'not_started',
    'in_progress',
    'completed',
    'blocked',
    'deferred'
  )
) DEFAULT 'not_started';

-- Create feature_dependencies table
CREATE TABLE feature_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  depends_on_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  -- Prevent self-referential dependencies
  CONSTRAINT no_self_dependencies CHECK (feature_id != depends_on_id),
  -- Ensure unique dependencies
  UNIQUE(feature_id, depends_on_id)
);

-- Enable RLS
ALTER TABLE feature_dependencies ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX feature_dependencies_feature_id_idx ON feature_dependencies(feature_id);
CREATE INDEX feature_dependencies_depends_on_id_idx ON feature_dependencies(depends_on_id);

-- Create RLS policies for feature_dependencies
CREATE POLICY "Users can manage feature dependencies"
  ON feature_dependencies
  USING (EXISTS (
    SELECT 1 FROM features
    JOIN products ON products.id = features.product_id
    WHERE features.id = feature_dependencies.feature_id
    AND products.user_id = auth.uid()
  ));

-- Update existing features to have implementation_status
UPDATE features SET implementation_status = 'not_started' WHERE implementation_status IS NULL;