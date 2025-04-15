/*
  # Création de la table CA_Param_Jours

  1. Nouvelle Table
    - `ca_param_jours`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `annee` (integer, entre 1900 et 9999)
      - `mois` (integer, entre 1 et 12)
      - `jours_ouverts` (integer[], stocke les numéros des jours ouverts)
      - timestamps standards (created_at, updated_at)
      - contrainte d'unicité sur (entite_id, annee, mois)

  2. Sécurité
    - Activation RLS
    - Politiques CRUD pour les utilisateurs authentifiés
*/

-- Fonction pour valider les jours
CREATE OR REPLACE FUNCTION validate_jours_ouverts(jours integer[])
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT bool_and(jour >= 1 AND jour <= 31)
    FROM unnest(jours) AS jour
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Création de la table ca_param_jours
CREATE TABLE IF NOT EXISTS ca_param_jours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  annee integer NOT NULL CHECK (annee >= 1900 AND annee <= 9999),
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  jours_ouverts integer[] NOT NULL CHECK (array_length(jours_ouverts, 1) > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entite_id, annee, mois),
  CONSTRAINT jours_valides CHECK (validate_jours_ouverts(jours_ouverts))
);

-- Activation RLS
ALTER TABLE ca_param_jours ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON ca_param_jours
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON ca_param_jours
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON ca_param_jours
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON ca_param_jours
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_ca_param_jours_updated_at
  BEFORE UPDATE ON ca_param_jours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();