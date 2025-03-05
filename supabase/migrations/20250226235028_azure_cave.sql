/*
  # Enhance Flow Pages Schema

  1. Changes
     - Rename functionality column to description for consistency
     - Add layout_description column for design terminology
     - Add features column to store list of features for the page

  2. Purpose
     - Improve the information storage for flow pages
     - Support more detailed page documentation
     - Enable better integration with feature management
*/

-- Rename functionality column to description for consistency
ALTER TABLE flow_pages
RENAME COLUMN functionality TO description;

-- Add new columns for enhanced page information
ALTER TABLE flow_pages
ADD COLUMN layout_description text,
ADD COLUMN features jsonb DEFAULT '[]'::jsonb;

-- Create index for better performance
CREATE INDEX flow_pages_features_idx ON flow_pages USING gin(features);

-- Add comments for clarity
COMMENT ON COLUMN flow_pages.description IS 'Short description of the page purpose';
COMMENT ON COLUMN flow_pages.layout_description IS 'Design terminology and layout description';
COMMENT ON COLUMN flow_pages.features IS 'List of features included on this page';