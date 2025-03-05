-- Add avatar_url column to users table
ALTER TABLE users
ADD COLUMN avatar_url text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS users_avatar_url_idx ON users(avatar_url);

-- Add comment explaining the column
COMMENT ON COLUMN users.avatar_url IS 'URL of the user''s avatar image stored in Supabase Storage';

-- Create storage bucket for avatars if it doesn't exist
DO $$
BEGIN
  -- Create avatars bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

  -- Create policy to allow authenticated users to upload their own avatars
  CREATE POLICY "Users can upload own avatar"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Create policy to allow authenticated users to update their own avatars
  CREATE POLICY "Users can update own avatar"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Create policy to allow authenticated users to delete their own avatars
  CREATE POLICY "Users can delete own avatar"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Create policy to allow public read access to avatars
  CREATE POLICY "Public can read avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;