/*
  # Add OpenAI Logs Table

  1. New Tables
    - `openai_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `request_type` (text)
      - `request_payload` (jsonb)
      - `response_payload` (jsonb)
      - `error` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `openai_logs` table
    - Add policy for authenticated users to read their own logs
*/

-- Create openai_logs table
CREATE TABLE openai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  request_payload jsonb NOT NULL,
  response_payload jsonb,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE openai_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own logs"
  ON openai_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better query performance
CREATE INDEX openai_logs_user_id_idx ON openai_logs(user_id);
CREATE INDEX openai_logs_created_at_idx ON openai_logs(created_at);