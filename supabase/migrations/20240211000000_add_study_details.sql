-- Add study details fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS course TEXT,
ADD COLUMN IF NOT EXISTS college TEXT,
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add comments
COMMENT ON COLUMN profiles.course IS 'User''s course/degree (e.g., B.Tech, MBA, M.Sc)';
COMMENT ON COLUMN profiles.college IS 'User''s college/university name';
COMMENT ON COLUMN profiles.graduation_year IS 'Expected or actual graduation year';
COMMENT ON COLUMN profiles.specialization IS 'User''s major/specialization (e.g., Computer Science, Marketing)';
