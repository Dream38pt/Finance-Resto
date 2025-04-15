/*
  # Création de la table des coûts fixes

  1. Nouvelle Table
    - `ca_budget_cf`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `annee` (integer)
      - `mois` (integer, entre 1 et 12)
      - `designation` (varchar(50))
      - `montant` (numeric(10,2))
      - `ordre_affichage` (integer)
      - Contrainte d'unicité sur (entite_id, annee, mois, designation)

  2. Sécurité
    - Activation RLS
    - Politiques CRUD pour les utilisateurs authentifiés
*/

-- Création de la table des coûts fixes
CREATE TABLE IF NOT EXISTS ca_budget_cf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  annee integer NOT NULL CHECK (annee >= 1900 AND annee <= 9999),
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  designation varchar(50) NOT NULL,
  montant numeric(10,2) NOT NULL DEFAULT 0,
  ordre_affichage integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (entite_id, annee, mois, designation)
);

-- Activation RLS
ALTER TABLE ca_budget_cf ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON ca_budget_cf
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON ca_budget_cf
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON ca_budget_cf
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON ca_budget_cf
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_ca_budget_cf_updated_at
  BEFORE UPDATE ON ca_budget_cf
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();