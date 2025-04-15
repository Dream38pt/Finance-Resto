/*
  # Fix RLS policies for entite table

  1. Changes
    - Drop existing RLS policy that might be too restrictive
    - Add new policies for:
      - Select operations (read)
      - Insert operations (create)
      - Update operations (modify)
      - Delete operations (remove)
    
  2. Security
    - Enable RLS on entite table (already enabled)
    - Add policies for authenticated users to perform CRUD operations
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Enable all operations for all users" ON "public"."entite";

-- Create specific policies for each operation
CREATE POLICY "Allow select for authenticated users" 
ON "public"."entite"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON "public"."entite"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON "public"."entite"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
ON "public"."entite"
FOR DELETE
TO authenticated
USING (true);