-- RewardJar 4.0 - Business Logos Storage Bucket Setup
-- This script creates a storage bucket for business logos with proper permissions
-- Run this in your Supabase SQL Editor or via MCP integration

-- Create the business-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true, -- Allow public read access
  1048576, -- 1MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] -- Only allow image types
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the business-logos bucket

-- Policy 1: Allow public read access to all logos
CREATE POLICY "Public read access for business logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-logos');

-- Policy 2: Allow authenticated business owners to upload logos for their business
CREATE POLICY "Business owners can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM businesses b WHERE b.owner_id = auth.uid()
    )
  );

-- Policy 3: Allow business owners to update their own logos
CREATE POLICY "Business owners can update their logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-logos'
    AND auth.role() = 'authenticated' 
    AND (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM businesses b WHERE b.owner_id = auth.uid()
    )
  );

-- Policy 4: Allow business owners to delete their own logos
CREATE POLICY "Business owners can delete their logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT b.id::text FROM businesses b WHERE b.owner_id = auth.uid()
    )
  );

-- Verify bucket creation
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'business-logos';

-- Verify policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%business logos%' OR policyname LIKE '%Business owners%'; 