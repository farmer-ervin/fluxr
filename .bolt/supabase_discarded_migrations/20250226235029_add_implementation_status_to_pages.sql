/*
  # Add Implementation Status to Flow Pages

  1. Changes
     - Add implementation_status column to flow_pages table
     - Set default value to 'not_started'
     - Add check constraint to ensure valid status values

  2. Purpose
     - Enable tracking implementation status of pages in the Kanban board
     - Maintain consistency with feature implementation statuses
*/

-- Add implementation_status column with check constraint
ALTER TABLE flow_pages
ADD COLUMN implementation_status text NOT NULL DEFAULT 'not_started'
CHECK (implementation_status IN ('not_started', 'in_progress', 'completed', 'blocked', 'deferred'));

-- Add comment for clarity
COMMENT ON COLUMN flow_pages.implementation_status IS 'Current implementation status of the page';
