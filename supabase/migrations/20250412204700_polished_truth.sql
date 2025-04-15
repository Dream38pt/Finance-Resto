/*
  # Création de la table budget_ca

  1. Nouvelle Table
    - `budget_ca`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `service_ca_id` (uuid, clé étrangère vers service_ca)
      - `montant` (numeric(12,2))
      - `annee` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Contraintes
    - Clé primaire sur id
    - Clés étrangères vers entite et service_ca
    - Contrainte d'unicité sur (entite_id, service_ca_id, annee)
    - Contrainte sur l'année (entre 1900 et 9999)

  3. Sécurité
    - RLS activé
    - Politiques CRUD pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS budget_ca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  service_ca_id uuid NOT NULL REFERENCES service_ca(id) ON DELETE CASCADE,
  montant numeric(12,2) NOT NULL,
  annee integer NOT NULL CHECK (annee >= 1900 AND annee <= 9999),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entite_id, service_ca_id, annee)
);

ALTER TABLE budget_ca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON budget_ca
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON budget_ca
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON budget_ca
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON budget_ca
  FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_budget_ca_updated_at
  BEFORE UPDATE ON budget_ca
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();