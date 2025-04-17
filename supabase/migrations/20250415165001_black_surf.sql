/*
  # Create storage bucket for invoice attachments

  1. Description
    - Creates a public storage bucket for invoice attachments
    - Sets file size limit to 10MB
    - Configures allowed file types
    - Sets up RLS policies for access control

  2. Security
    - Public read access
    - Authenticated users can upload/update/delete
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'factures-achat'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('factures-achat', 'factures-achat', true);

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

    -- Enable RLS policies
    
    -- Allow public read access
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
  END IF;
END $$;