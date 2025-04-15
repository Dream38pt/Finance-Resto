/*
  # Création de la table d'affectation du personnel aux entités

  1. Nouvelle Table
    - `affectation_personnel_entite`
      - `id` (uuid, clé primaire)
      - `personnel_id` (uuid, clé étrangère vers personnel)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `taux_presence` (numeric(4,2), pourcentage entre 0 et 1)
      - `date_debut` (date)
      - `date_fin` (date, nullable)
      - `cout_affectation` (numeric(10,2), défaut 0)
      - `role_specifique` (varchar(30), nullable)
      - `notes` (text, nullable)
      - Contrainte d'unicité sur (personnel_id, entite_id, date_debut)
      - Timestamps created_at et updated_at

  2. Sécurité
    - Activation RLS
    - Politiques CRUD pour les utilisateurs authentifiés
*/

-- Création de la table d'affectation
CREATE TABLE IF NOT EXISTS affectation_personnel_entite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  taux_presence numeric(4,2) NOT NULL CHECK (taux_presence >= 0 AND taux_presence <= 1),
  date_debut date NOT NULL,
  date_fin date,
  cout_affectation numeric(10,2) NOT NULL DEFAULT 0,
  role_specifique varchar(30),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (personnel_id, entite_id, date_debut)
);

-- Activation RLS
ALTER TABLE affectation_personnel_entite ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON affectation_personnel_entite
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON affectation_personnel_entite
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON affectation_personnel_entite
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON affectation_personnel_entite
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_affectation_personnel_entite_updated_at
  BEFORE UPDATE ON affectation_personnel_entite
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();