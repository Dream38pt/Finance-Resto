/*
  # Création de la table des modes de paiement

  1. Nouvelle Table
    - `fin_mode_paiement`
      - `id` (uuid, clé primaire)
      - `code` (varchar(20), unique)
      - `libelle` (varchar(50))
      - `ordre_affichage` (integer)
      - `actif` (boolean)
      - timestamps standards (created_at, updated_at)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_mode_paiement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) NOT NULL UNIQUE,
  libelle varchar(50) NOT NULL,
  ordre_affichage integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_mode_paiement ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_mode_paiement
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_mode_paiement
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_mode_paiement
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_mode_paiement
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_mode_paiement_updated_at
  BEFORE UPDATE ON fin_mode_paiement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();