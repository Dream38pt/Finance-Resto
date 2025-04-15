/*
  # Ajout d'un trigger pour mettre à jour NDJ depuis ca_param_jours

  1. Nouvelle fonction
    - Fonction qui récupère le nombre de jours ouverts depuis ca_param_jours
    - Met à jour le champ NDJ de budget_ca_mensuel

  2. Nouveau trigger
    - Se déclenche avant INSERT ou UPDATE sur budget_ca_mensuel
    - Appelle la fonction pour mettre à jour NDJ
*/

-- Création de la fonction pour mettre à jour NDJ
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
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_ndj_from_param
    BEFORE INSERT OR UPDATE ON budget_ca_mensuel
    FOR EACH ROW
    EXECUTE FUNCTION update_ndj();