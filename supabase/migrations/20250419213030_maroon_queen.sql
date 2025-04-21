/*
  # Renommage de la table service_ca en CA_type_service

  1. Description
    - Renommage de la table service_ca en CA_type_service
    - Conservation de toutes les colonnes et contraintes existantes
    - Mise à jour des politiques de sécurité
    - Mise à jour des triggers
    - Mise à jour des clés étrangères

  2. Changements
    - Renommage de la table
    - Recréation des politiques RLS
    - Recréation du trigger updated_at
*/

-- Renommage de la table
ALTER TABLE service_ca RENAME TO CA_type_service;

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON CA_type_service;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON CA_type_service;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON CA_type_service;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON CA_type_service;

-- Création des nouvelles politiques
CREATE POLICY "Enable read access for authenticated users" ON CA_type_service
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON CA_type_service
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON CA_type_service
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON CA_type_service
  FOR DELETE
  TO authenticated
  USING (true);

-- Mise à jour du trigger
DROP TRIGGER IF EXISTS update_service_ca_updated_at ON CA_type_service;

CREATE TRIGGER update_ca_type_service_updated_at
  BEFORE UPDATE ON CA_type_service
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();