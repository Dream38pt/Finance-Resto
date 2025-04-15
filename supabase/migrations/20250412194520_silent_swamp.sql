/*
  # Création de la table ServiceCA

  1. Nouvelle Table
    - `service_ca`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `code_service_ca` (varchar(12))
      - `libelle_service_ca` (varchar(30))
      - `date_debut` (date)
      - `date_fin` (date, nullable)
      - Contrainte d'unicité sur (entite_id, code_service_ca)

  2. Sécurité
    - Activation RLS
    - Politiques CRUD pour les utilisateurs authentifiés
*/

-- Création de la table service_ca
CREATE TABLE IF NOT EXISTS service_ca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  code_service_ca varchar(12) NOT NULL,
  libelle_service_ca varchar(30) NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (entite_id, code_service_ca)
);

-- Activation RLS
ALTER TABLE service_ca ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON service_ca
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON service_ca
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON service_ca
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON service_ca
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_service_ca_updated_at
  BEFORE UPDATE ON service_ca
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();