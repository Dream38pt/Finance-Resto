/*
  # Création de la table des factures d'achat

  1. Nouvelle Table
    - `fin_facture_achat`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, référence à entite)
      - `tiers_id` (uuid, référence à fin_tiers)
      - `numero_document` (varchar(40), optionnel)
      - `date_facture` (date)
      - `montant_ht` (numeric(10,2))
      - `montant_tva` (numeric(10,2))
      - `montant_ttc` (numeric(10,2))
      - `mode_paiement_id` (uuid, référence à fin_mode_paiement)
      - `commentaire` (text, optionnel)
      - `lien_piece_jointe` (text, optionnel)
      - timestamps standards (created_at, updated_at)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_facture_achat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  tiers_id uuid NOT NULL REFERENCES fin_tiers(id) ON DELETE RESTRICT,
  numero_document varchar(40),
  date_facture date NOT NULL,
  montant_ht numeric(10,2) NOT NULL CHECK (montant_ht >= 0),
  montant_tva numeric(10,2) NOT NULL CHECK (montant_tva >= 0),
  montant_ttc numeric(10,2) NOT NULL CHECK (montant_ttc >= 0),
  mode_paiement_id uuid NOT NULL REFERENCES fin_mode_paiement(id) ON DELETE RESTRICT,
  commentaire text,
  lien_piece_jointe text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_facture_achat ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_facture_achat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_facture_achat
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_facture_achat
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_facture_achat
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_facture_achat_updated_at
  BEFORE UPDATE ON fin_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();