-- ============================================================
-- ELS App — Migration 5: Create Picture Storage Bucket & Policies
-- Creates the 'picture' bucket and sets up public RLS policies.
-- ============================================================

-- 1. Insert the 'picture' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'picture',
  'picture',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow public read access to files in the 'picture' bucket
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'picture');

-- 3. Policy: Allow anyone (anon/authenticated) to insert files into the 'picture' bucket
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
CREATE POLICY "Public Insert Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'picture');

-- 4. Policy: Allow anyone to update files in the 'picture' bucket
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
CREATE POLICY "Public Update Access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'picture');

-- 5. Policy: Allow anyone to delete files in the 'picture' bucket (optional, useful for replacements)
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'picture');
