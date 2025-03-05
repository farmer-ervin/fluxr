-- Create storage bucket for bug screenshots if it doesn't exist
DO $$
BEGIN
  -- Create bug-screenshots bucket with public set to false
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('bug-screenshots', 'bug-screenshots', false)
  ON CONFLICT (id) DO NOTHING;

  -- Create policy to allow authenticated users to upload bug screenshots
  CREATE POLICY "Users can upload bug screenshots"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'bug-screenshots' AND
      auth.role() = 'authenticated'
    );

  -- Create policy to allow authenticated users to update their bug screenshots
  CREATE POLICY "Users can update bug screenshots"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'bug-screenshots' AND
      auth.role() = 'authenticated'
    );

  -- Create policy to allow authenticated users to delete their bug screenshots
  CREATE POLICY "Users can delete bug screenshots"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'bug-screenshots' AND
      auth.role() = 'authenticated'
    );

  -- Create policy to allow authenticated users to read bug screenshots
  CREATE POLICY "Authenticated users can read bug screenshots"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'bug-screenshots');

EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$; 