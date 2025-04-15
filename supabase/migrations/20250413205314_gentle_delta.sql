/*
  # Correction de la table budget_ca_mensuel

  1. Modifications
    - Suppression de la vue dépendante
    - Suppression et recréation de la table avec la nouvelle structure
    - Recréation de la vue
    - Mise à jour du trigger
*/

-- Suppression de la vue dépendante
DROP VIEW IF EXISTS v_budget_ca_annuel;

-- Suppression de la table existante
DROP TABLE IF EXISTS budget_ca_mensuel;

-- Création de la nouvelle table sans la colonne générée
CREATE TABLE IF NOT EXISTS budget_ca_mensuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  service_ca_id uuid NOT NULL REFERENCES service_ca(id) ON DELETE CASCADE,
  annee integer NOT NULL CHECK (annee >= 1900 AND annee <= 9999),
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  qjp numeric(10,2) NOT NULL CHECK (qjp >= 0),
  pvjp numeric(10,2) NOT NULL CHECK (pvjp >= 0),
  ndj integer NOT NULL CHECK (ndj >= 0 AND ndj <= 31),
  cadm numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entite_id, service_ca_id, annee, mois)
);

-- Activation RLS
ALTER TABLE budget_ca_mensuel ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON budget_ca_mensuel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON budget_ca_mensuel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON budget_ca_mensuel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON budget_ca_mensuel
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_budget_ca_mensuel_updated_at
  BEFORE UPDATE ON budget_ca_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création de la nouvelle fonction avec message de débogage
CREATE OR REPLACE FUNCTION update_ndj()
RETURNS TRIGGER AS $$
DECLARE
    v_jours_ouverts integer;
BEGIN
    -- Message de débogage pour voir les valeurs d'entrée
    RAISE NOTICE 'DEBUG - entite_id=%, annee=%, mois=%', NEW.entite_id, NEW.annee, NEW.mois;

    -- Récupérer le nombre de jours ouverts depuis ca_param_jours
    SELECT jours_ouverts INTO v_jours_ouverts
    FROM ca_param_jours
    WHERE entite_id = NEW.entite_id
      AND annee = NEW.annee
      AND mois = NEW.mois;

    -- Si on trouve une valeur, on met à jour NDJ et CADM
    IF FOUND THEN
        NEW.ndj := v_jours_ouverts;
        NEW.cadm := NEW.qjp * NEW.pvjp * v_jours_ouverts;
        RAISE NOTICE 'Mise à jour NDJ pour entite_id=%, annee=%, mois=% : %', 
                    NEW.entite_id, NEW.annee, NEW.mois, v_jours_ouverts;
    ELSE
        -- Si aucune valeur n'est trouvée, on met NDJ et CADM à 0
        NEW.ndj := 0;
        NEW.cadm := 0;
        RAISE WARNING 'Aucun jour ouvré trouvé pour entite_id=%, annee=%, mois=%. NDJ et CADM mis à 0.', 
                     NEW.entite_id, NEW.annee, NEW.mois;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_ndj_from_param
    BEFORE INSERT OR UPDATE ON budget_ca_mensuel
    FOR EACH ROW
    EXECUTE FUNCTION update_ndj();

-- Recréation de la vue
CREATE OR REPLACE VIEW v_budget_ca_annuel AS
SELECT 
  entite_id,
  service_ca_id,
  annee,
  SUM(cadm) as total_annuel
FROM budget_ca_mensuel
GROUP BY entite_id, service_ca_id, annee;