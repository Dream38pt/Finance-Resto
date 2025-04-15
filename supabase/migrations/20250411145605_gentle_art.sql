/*
  # Create entity table

  1. New Tables
    - `entite`
      - `id` (uuid, primary key)
      - `code` (varchar(12), unique)
      - `libelle` (varchar(30))
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `entite` table
    - Add policies for full CRUD access
*/

-- Create the entity table
CREATE TABLE IF NOT EXISTS entite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(12) UNIQUE NOT NULL,
  libelle varchar(30) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE entite ENABLE ROW LEVEL SECURITY;

-- Create policies for unrestricted CRUD operations
CREATE POLICY "Enable all operations for all users" ON entite
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create an update trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entite_updated_at
  BEFORE UPDATE ON entite
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();