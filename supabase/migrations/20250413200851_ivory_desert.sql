/*
  # Modification du champ jours_ouverts

  1. Description
    - Supprime la table ca_param_jours existante
    - Recrée la table avec jours_ouverts comme entier simple
    - Supprime la fonction validate_jours_ouverts qui n'est plus nécessaire

  2. Changements
    - Modification du type de jours_ouverts de integer[] à integer
    - Ajout d'une contrainte CHECK pour valider la plage (1-31)
*/

-- Suppression de la table existante
DROP TABLE IF EXISTS ca_param_jours;

-- Suppression de la fonction de validation qui n'est plus nécessaire
DROP FUNCTION IF EXISTS validate_jours_ouverts;

-- Création de la nouvelle table avec jours_ouverts comme entier
CREATE TABLE IF NOT EXISTS ca_param_jours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  annee integer NOT NULL CHECK (annee >= 1900 AND annee <= 9999),
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  jours_ouverts integer NOT NULL CHECK (jours_ouverts >= 0 AND jours_ouverts <= 31),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entite_id, annee, mois)
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