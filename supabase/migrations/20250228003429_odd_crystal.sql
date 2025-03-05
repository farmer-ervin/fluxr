/*
  # Add feedback system

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `type` (text, either 'bug' or 'feature')
      - `description` (text)
      - `page_url` (text)
      - `use_case` (text, nullable)
      - `proposed_solution` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on feedback table
    - Add policy for authenticated users to create feedback
    - Add policy for authenticated users to read their own feedback
*/

-- Create feedback table
CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bug', 'feature')),
  description text NOT NULL,
  page_url text,
  use_case text,
  proposed_solution text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_type_idx ON feedback(type);
CREATE INDEX feedback_created_at_idx ON feedback(created_at);

-- Add comments
COMMENT ON TABLE feedback IS 'Stores user-submitted bugs and feature requests';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: bug or feature';
COMMENT ON COLUMN feedback.page_url IS 'URL where the bug was encountered (for bug reports)';
COMMENT ON COLUMN feedback.use_case IS 'Use case description (for feature requests)';
COMMENT ON COLUMN feedback.proposed_solution IS 'Proposed solution (for feature requests)';