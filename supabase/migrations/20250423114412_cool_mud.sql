/*
  # Création de la table des encaissements multibanc

  1. Nouvelle Table
    - `fin_ferm_multibanc`
      - `id` (uuid, clé primaire)
      - `id_ferm_caisse` (uuid, clé étrangère vers fin_ferm_caisse)
      - `periode` (varchar(12), période de l'encaissement)
      - `montant_brut` (numeric(12,2), montant brut encaissé)
      - `montant_reel` (numeric(12,2), montant réel encaissé)
      - `commentaire` (varchar(30), commentaire optionnel)
      - `created_at` (timestamptz, date de création)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_ferm_multibanc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_ferm_caisse uuid NOT NULL REFERENCES fin_ferm_caisse(id) ON DELETE CASCADE,
  periode varchar(12) NOT NULL,
  montant_brut numeric(12,2) NOT NULL,
  montant_reel numeric(12,2) NOT NULL,
  commentaire varchar(30),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_ferm_multibanc ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_ferm_multibanc
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_ferm_multibanc
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_ferm_multibanc
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_ferm_multibanc
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_ferm_multibanc_updated_at
  BEFORE UPDATE ON fin_ferm_multibanc
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();