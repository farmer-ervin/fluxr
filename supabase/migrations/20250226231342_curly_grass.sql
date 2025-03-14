-- Add token tracking columns to openai_logs table
ALTER TABLE openai_logs 
ADD COLUMN input_tokens integer,
ADD COLUMN output_tokens integer;

-- Create index for better query performance on token usage
CREATE INDEX IF NOT EXISTS openai_logs_tokens_idx ON openai_logs(input_tokens, output_tokens);

-- Add comment explaining the purpose
COMMENT ON COLUMN openai_logs.input_tokens IS 'Number of tokens in the prompt/input';
COMMENT ON COLUMN openai_logs.output_tokens IS 'Number of tokens in the completion/output';