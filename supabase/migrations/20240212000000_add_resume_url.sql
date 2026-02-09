-- Add resume_url column to profiles table for persistent resume storage
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_name TEXT;

-- Add comments
COMMENT ON COLUMN profiles.resume_url IS 'URL to the user''s uploaded resume file in storage';
COMMENT ON COLUMN profiles.resume_name IS 'Original filename of the uploaded resume';

-- Note: Storage bucket for resumes needs to be created via Supabase dashboard or CLI:
-- Create bucket named 'resumes' with these settings:
-- - Public: false (private bucket)
-- - File size limit: 5MB
-- - Allowed MIME types: application/pdf, text/plain, text/markdown
