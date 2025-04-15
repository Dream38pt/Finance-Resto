/*
  # Create suppliers table

  1. New Table
    - `fin_tiers`
      - `id` (uuid, primary key)
      - `code` (varchar(20), unique, required)
      - `nom` (varchar(100), required)
      - `commentaire` (text, nullable)
      - `actif` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS fin_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  nom varchar(100) NOT NULL,
  commentaire text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_tiers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_tiers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_tiers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_tiers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_tiers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_tiers_updated_at
  BEFORE UPDATE ON fin_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();