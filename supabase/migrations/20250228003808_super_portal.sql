-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Users can read own feedback" ON feedback;

-- Create improved RLS policies
CREATE POLICY "Users can create feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can read own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Enable RLS if not already enabled
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE feedback IS 'Stores user-submitted bugs and feature requests';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: bug or feature';
COMMENT ON COLUMN feedback.page_url IS 'URL where the bug was encountered (for bug reports)';
COMMENT ON COLUMN feedback.use_case IS 'Use case description (for feature requests)';
COMMENT ON COLUMN feedback.proposed_solution IS 'Proposed solution (for feature requests)';