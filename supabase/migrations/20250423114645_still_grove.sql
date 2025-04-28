/*
  # Création de la table des factures de dépenses payées par caisse

  1. Nouvelle Table
    - `fin_ferm_facturedepenses`
      - `id` (uuid, clé primaire)
      - `id_ferm_caisse` (uuid, clé étrangère vers fin_ferm_caisse)
      - `id_facture` (uuid, clé étrangère vers fin_facture_achat)
      - `created_at` (timestamptz, date de création)
      - `updated_at` (timestamptz, date de mise à jour)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_ferm_facturedepenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ferm_caisse uuid NOT NULL REFERENCES fin_ferm_caisse(id) ON DELETE CASCADE,
  id_facture uuid NOT NULL REFERENCES fin_facture_achat(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_ferm_facturedepenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_ferm_facturedepenses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_ferm_facturedepenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_ferm_facturedepenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_ferm_facturedepenses
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_ferm_facturedepenses_updated_at
  BEFORE UPDATE ON fin_ferm_facturedepenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();