/*
  # Mise à jour de la fonction update_ndj

  1. Modifications
    - Suppression du message de débogage RAISE NOTICE
    - Conservation des autres messages pour le suivi des mises à jour
*/

-- Suppression du trigger et de la fonction existants
DROP TRIGGER IF EXISTS update_ndj_from_param ON budget_ca_mensuel;
DROP FUNCTION IF EXISTS update_ndj();

-- Création de la nouvelle fonction sans le message de débogage
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