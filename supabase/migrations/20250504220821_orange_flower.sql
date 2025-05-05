/*
  # Renommage de la table affectation_personnel_entite en rh_affectation_personnel_entite

  1. Description
    - Renomme la table affectation_personnel_entite en rh_affectation_personnel_entite
    - Met à jour les contraintes de clé étrangère
    - Met à jour les triggers
    - Recrée les politiques RLS

  2. Changements
    - Renommage de la table
    - Mise à jour des triggers
    - Mise à jour des politiques RLS
*/

-- Renommage de la table
ALTER TABLE affectation_personnel_entite RENAME TO rh_affectation_personnel_entite;

-- Mise à jour du trigger pour la colonne updated_at
DROP TRIGGER IF EXISTS update_affectation_personnel_entite_updated_at ON rh_affectation_personnel_entite;

CREATE TRIGGER update_rh_affectation_personnel_entite_updated_at
  BEFORE UPDATE ON rh_affectation_personnel_entite
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Suppression des anciennes politiques RLS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON rh_affectation_personnel_entite;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON rh_affectation_personnel_entite;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON rh_affectation_personnel_entite;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON rh_affectation_personnel_entite;

-- Création des nouvelles politiques RLS
CREATE POLICY "Enable read access for authenticated users" ON rh_affectation_personnel_entite
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON rh_affectation_personnel_entite
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON rh_affectation_personnel_entite
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON rh_affectation_personnel_entite
  FOR DELETE
  TO authenticated
  USING (true);