/*
  # Création de la table Param_TVA

  1. Nouvelle Table
    - `param_tva`
      - `id` (uuid, clé primaire)
      - `tx_tva_ca` (numeric(5,2), taux de TVA sur CA)
      - `tx_tva_ca_datedebut` (date, date de début de validité)
      - `tx_tva_ca_datefin` (date, date de fin de validité, nullable)
      - `tx_tva_deductible` (numeric(5,2), taux de TVA déductible)
      - `tx_tva_deductible_datedebut` (date, date de début de validité)
      - `tx_tva_deductible_datefin` (date, date de fin de validité, nullable)
      - Timestamps standards (created_at, updated_at)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS param_tva (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_tva_ca numeric(5,2) NOT NULL CHECK (tx_tva_ca >= 0),
  tx_tva_ca_datedebut date NOT NULL,
  tx_tva_ca_datefin date,
  tx_tva_deductible numeric(5,2) NOT NULL CHECK (tx_tva_deductible >= 0),
  tx_tva_deductible_datedebut date NOT NULL,
  tx_tva_deductible_datefin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE param_tva ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON param_tva
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON param_tva
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON param_tva
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON param_tva
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_param_tva_updated_at
  BEFORE UPDATE ON param_tva
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();