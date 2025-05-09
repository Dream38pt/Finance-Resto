/*
  # Create storage bucket for employee profile photos

  1. Description
    - Creates a public storage bucket for employee profile photos
    - Sets file size limit to 2MB
    - Configures allowed file types (images only)
    - Sets up RLS policies for access control

  2. Security
    - Public read access
    - Authenticated users can upload/update/delete
*/

-- Create the storage bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'employees'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('employees', 'employees', true);

    -- Set bucket configuration
    UPDATE storage.buckets
    SET file_size_limit = 2097152, -- 2MB in bytes
        allowed_mime_types = ARRAY[
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ]
    WHERE id = 'employees';

    -- Enable RLS policies
    
    -- Allow public read access
    CREATE POLICY "Allow public read access for employee photos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'employees');

    -- Allow authenticated users to upload files
    CREATE POLICY "Allow authenticated users to upload employee photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'employees');

    -- Allow authenticated users to update files
    CREATE POLICY "Allow authenticated users to update employee photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'employees')
    WITH CHECK (bucket_id = 'employees');

    -- Allow authenticated users to delete files
    CREATE POLICY "Allow authenticated users to delete employee photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'employees');
  END IF;
END $$;