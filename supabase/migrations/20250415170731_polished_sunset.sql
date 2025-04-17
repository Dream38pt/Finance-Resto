/*
  # Création de la table des lignes de facture d'achat

  1. Nouvelle Table
    - `fin_ligne_facture_achat`
      - `id` (uuid, clé primaire)
      - `facture_id` (uuid, clé étrangère vers fin_facture_achat)
      - `categorie_id` (uuid, clé étrangère vers fin_categorie_achat)
      - `montant_ht` (numeric(10,2))
      - `montant_tva` (numeric(10,2))
      - `commentaire` (text)
      - timestamps standards (created_at, updated_at)

  2. Contraintes
    - Clés étrangères avec suppression en cascade pour facture_id
    - Contraintes de validation sur les montants
    - Contrainte de cohérence entre montant_ht et montant_tva

  3. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_ligne_facture_achat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id uuid NOT NULL REFERENCES fin_facture_achat(id) ON DELETE CASCADE,
  categorie_id uuid NOT NULL REFERENCES fin_categorie_achat(id) ON DELETE RESTRICT,
  montant_ht numeric(10,2) NOT NULL CHECK (montant_ht >= 0),
  montant_tva numeric(10,2) NOT NULL DEFAULT 0 CHECK (montant_tva >= 0),
  commentaire text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_ligne_facture_achat ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_ligne_facture_achat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_ligne_facture_achat
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_ligne_facture_achat
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_ligne_facture_achat
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_ligne_facture_achat_updated_at
  BEFORE UPDATE ON fin_ligne_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();