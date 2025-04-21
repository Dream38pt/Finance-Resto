/*
  # Création de la table des comptes bancaires

  1. Nouvelle Table
    - `fin_compte_bancaire`
      - `id` (uuid, clé primaire)
      - `code` (varchar(12), unique)
      - `nom` (varchar(30))
      - `id_entite` (uuid, clé étrangère vers entite)
      - `banque` (varchar(20))
      - `iban` (varchar(20))
      - `bic` (varchar(11), optionnel)
      - `est_actif` (boolean)
      - `commentaire` (text, optionnel)
      - `date_creation` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table des comptes bancaires
CREATE TABLE IF NOT EXISTS fin_compte_bancaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(12) NOT NULL UNIQUE,
  nom varchar(30) NOT NULL,
  id_entite uuid NOT NULL REFERENCES entite(id) ON DELETE RESTRICT,
  banque varchar(20) NOT NULL,
  iban varchar(20) NOT NULL,
  bic varchar(11),
  est_actif boolean NOT NULL DEFAULT true,
  commentaire text,
  date_creation timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_compte_bancaire ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_compte_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_compte_bancaire
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_compte_bancaire
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_compte_bancaire
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_compte_bancaire_updated_at
  BEFORE UPDATE ON fin_compte_bancaire
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();