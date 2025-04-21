/*
  # Create bank movement type table

  1. New Table
    - `fin_type_mouvement_bancaire`
      - `id` (uuid, primary key)
      - `code` (varchar(20), unique)
      - `libelle` (varchar(50))
      - `sens` (varchar(6), check credit/debit)
      - `ordre_affichage` (integer)
      - `est_actif` (boolean)
      - timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS fin_type_mouvement_bancaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  libelle varchar(50) NOT NULL,
  sens varchar(6) NOT NULL CHECK (sens IN ('credit', 'debit')),
  ordre_affichage integer,
  est_actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_type_mouvement_bancaire ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_type_mouvement_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_type_mouvement_bancaire
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_type_mouvement_bancaire
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_type_mouvement_bancaire
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_type_mouvement_bancaire_updated_at
  BEFORE UPDATE ON fin_type_mouvement_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();