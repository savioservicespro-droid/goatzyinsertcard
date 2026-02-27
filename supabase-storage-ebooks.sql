-- Migration: Create Supabase Storage bucket for ebook PDFs
-- Run this in Supabase SQL Editor

-- 1. Create the 'ebooks' bucket (public = downloadable via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebooks', 'ebooks', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow anyone to read (download) ebook files
CREATE POLICY "Public read access on ebooks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ebooks');

-- 3. Allow authenticated or anon users to upload ebooks (admin will upload via frontend)
CREATE POLICY "Allow upload to ebooks"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ebooks');

-- 4. Allow overwriting existing ebooks
CREATE POLICY "Allow update ebooks"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ebooks');

-- 5. Allow deleting old ebooks
CREATE POLICY "Allow delete ebooks"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ebooks');
