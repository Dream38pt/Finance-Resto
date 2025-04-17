/*
  # Fix storage policies for invoice attachments

  1. Description
    - Drop existing policies that might be conflicting
    - Create new policies with proper security settings
    - Ensure bucket exists with correct configuration

  2. Security
    - Public read access for authenticated users only
    - Authenticated users can upload/update/delete their own files
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects;

-- Create or update the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'factures-achat'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('factures-achat', 'factures-achat', false);
  ELSE
    UPDATE storage.buckets
    SET public = false
    WHERE id = 'factures-achat';
  END IF;

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
END $$;

-- Create new policies with proper security settings
CREATE POLICY "Enable read access for authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'factures-achat');

CREATE POLICY "Enable insert access for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'factures-achat');

CREATE POLICY "Enable update access for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'factures-achat')
WITH CHECK (bucket_id = 'factures-achat');

CREATE POLICY "Enable delete access for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'factures-achat');