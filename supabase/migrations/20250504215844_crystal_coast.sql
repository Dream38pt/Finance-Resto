/*
  # Renommage de la table personnel en rh_personnel

  1. Description
    - Renomme la table `personnel` en `rh_personnel`
    - Met à jour toutes les contraintes et références associées
    - Préserve les données existantes et les politiques de sécurité

  2. Changements
    - Renommage de la table
    - Mise à jour des clés étrangères
    - Mise à jour des triggers
    - Mise à jour des politiques RLS
*/

-- Renommage de la table
ALTER TABLE personnel RENAME TO rh_personnel;

-- Mise à jour des clés étrangères qui référencent cette table
ALTER TABLE affectation_personnel_entite
DROP CONSTRAINT IF EXISTS affectation_personnel_entite_personnel_id_fkey;

ALTER TABLE affectation_personnel_entite
ADD CONSTRAINT affectation_personnel_entite_personnel_id_fkey
FOREIGN KEY (personnel_id) REFERENCES rh_personnel(id) ON DELETE CASCADE;

-- Mise à jour du trigger pour la colonne updated_at
DROP TRIGGER IF EXISTS update_personnel_updated_at ON rh_personnel;

CREATE TRIGGER update_rh_personnel_updated_at
  BEFORE UPDATE ON rh_personnel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Suppression des anciennes politiques RLS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rh_personnel;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rh_personnel;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rh_personnel;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rh_personnel;

-- Création des nouvelles politiques RLS
CREATE POLICY "Enable read access for authenticated users" ON rh_personnel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON rh_personnel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON rh_personnel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON rh_personnel
  FOR DELETE
  TO authenticated
  USING (true);