-- Create error_logs table
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  error_type text NOT NULL,
  error_code text,
  error_message text NOT NULL,
  stack_trace text,
  severity text NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  metadata jsonb DEFAULT '{}'::jsonb,
  request_payload jsonb,
  browser_info jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX error_logs_user_id_idx ON error_logs(user_id);
CREATE INDEX error_logs_error_type_idx ON error_logs(error_type);
CREATE INDEX error_logs_severity_idx ON error_logs(severity);
CREATE INDEX error_logs_created_at_idx ON error_logs(created_at);

-- Create RLS policies
CREATE POLICY "System can insert error logs"
  ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own error logs"
  ON error_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE error_logs IS 'Stores application error logs with metadata';