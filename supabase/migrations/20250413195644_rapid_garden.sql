/*
  # Insertion des données de jours ouvrés pour Parce Que

  1. Description
    - Insère les jours ouvrés (25 jours) pour chaque mois de 2025
    - Pour le restaurant "Parce Que" (code: PQ)
    - Les jours sont fixés du 1 au 25 pour chaque mois
*/

DO $$
DECLARE
    v_entite_id uuid;
    v_mois integer;
    v_jours_array integer[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
BEGIN
    -- Récupération de l'ID de l'entité "Parce Que"
    SELECT id INTO v_entite_id
    FROM entite
    WHERE code = 'PQ';

    -- Si l'entité existe
    IF FOUND THEN
        -- Boucle sur les 12 mois
        FOR v_mois IN 1..12 LOOP
            -- Insertion des données pour chaque mois
            INSERT INTO ca_param_jours (entite_id, annee, mois, jours_ouverts)
            VALUES (v_entite_id, 2025, v_mois, v_jours_array)
            ON CONFLICT (entite_id, annee, mois) DO NOTHING;
        END LOOP;
    END IF;
END $$;