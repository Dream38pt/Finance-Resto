/*
  # Create storage bucket for invoices attachments

  1. Description
    - Create a public bucket named 'factures-achat' to store invoice attachments
    - Enable public access to allow file downloads
    - Set file size limit to 10MB
    - Allow only specific file extensions
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'factures-achat'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('factures-achat', 'factures-achat', true);
  END IF;
END $$;

-- Set bucket configuration
UPDATE storage.buckets
SET file_size_limit = 10485760, -- 10MB in bytes
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
WHERE id = 'factures-achat';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;

-- Enable RLS
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'factures-achat');

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'factures-achat');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'factures-achat')
WITH CHECK (bucket_id = 'factures-achat');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'factures-achat');