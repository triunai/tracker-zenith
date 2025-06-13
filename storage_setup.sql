-- Create storage bucket for documents (if not already exists)
-- Note: You may need to run this in the Supabase dashboard Storage section

-- Create bucket policies for document-uploads bucket
-- Run these in your Supabase SQL editor

-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR
INSERT 
  WITH CHECK
    (
    bucket_id 
 'document-uploads'
    AND auth.uid()

::text =
(storage.foldername
(name))[1]
  );

-- Policy: Allow users to view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR
SELECT
    USING (
    bucket_id = 'document-uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Allow users to delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR
DELETE 
  USING (
    bucket_id
= 'document-uploads' 
    AND auth.uid
()::text =
(storage.foldername
(name))[1]
  );

-- If you need to update the bucket configuration
UPDATE storage.buckets 
SET public = false, 
    file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'application/pdf']
WHERE id = 'document-uploads'; 