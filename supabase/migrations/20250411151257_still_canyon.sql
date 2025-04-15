/*
  # Fix RLS policies for entite table

  1. Changes
    - Drop existing RLS policies that might be causing issues
    - Create new, properly configured RLS policies for the entite table
    
  2. Security
    - Enable RLS on entite table (already enabled)
    - Add policies for authenticated users to perform CRUD operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.entite;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.entite;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.entite;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.entite;

-- Create new policies with proper security checks
CREATE POLICY "Enable read access for authenticated users" ON public.entite
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.entite
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.entite
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.entite
    FOR DELETE
    TO authenticated
    USING (true);