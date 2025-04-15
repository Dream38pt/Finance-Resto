/*
  # Correction du trigger update_ndj pour budget_ca_mensuel

  1. Modifications
    - Suppression du trigger et de la fonction existants
    - Recréation avec une meilleure gestion de la liaison avec ca_param_jours
    - Ajout d'une validation plus stricte
    - Amélioration des messages de log
*/

-- Suppression du trigger et de la fonction existants
DROP TRIGGER IF EXISTS update_ndj_from_param ON budget_ca_mensuel;
DROP FUNCTION IF EXISTS update_ndj();

-- Création de la nouvelle fonction
CREATE OR REPLACE FUNCTION update_ndj()
RETURNS TRIGGER AS $$
DECLARE
    v_jours_ouverts integer;
BEGIN
    -- Récupérer le nombre de jours ouverts depuis ca_param_jours
    SELECT jours_ouverts INTO v_jours_ouverts
    FROM ca_param_jours
    WHERE entite_id = NEW.entite_id
      AND annee = NEW.annee
      AND mois = NEW.mois;

    -- Si on trouve une valeur, on met à jour NDJ
    IF FOUND THEN
        NEW.ndj := v_jours_ouverts;
        -- Recalculer CADM avec la nouvelle valeur de NDJ
        NEW.cadm := NEW.qjp * NEW.pvjp * NEW.ndj;
        RAISE NOTICE 'Mise à jour NDJ pour entite_id=%, annee=%, mois=% : %', 
                    NEW.entite_id, NEW.annee, NEW.mois, v_jours_ouverts;
    ELSE
        -- Si aucune valeur n'est trouvée, on met NDJ à 0
        NEW.ndj := 0;
        NEW.cadm := 0;
        RAISE WARNING 'Aucun jour ouvré trouvé pour entite_id=%, annee=%, mois=%. NDJ et CADM mis à 0.', 
                     NEW.entite_id, NEW.annee, NEW.mois;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du nouveau trigger
CREATE TRIGGER update_ndj_from_param
    BEFORE INSERT OR UPDATE ON budget_ca_mensuel
    FOR EACH ROW
    EXECUTE FUNCTION update_ndj();