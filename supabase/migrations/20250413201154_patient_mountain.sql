/*
  # Ajout des jours ouvrés pour Casa

  1. Description
    - Ajoute les jours ouvrés (25 jours) pour chaque mois de 2025
    - Pour l'entité "Casa" (code: CDP)

  2. Données
    - Année: 2025
    - Nombre de jours: 25
    - Pour les 12 mois de l'année
*/

DO $$
DECLARE
    v_entite_id uuid;
    v_mois integer;
BEGIN
    -- Récupération de l'ID de l'entité "Casa"
    SELECT id INTO v_entite_id
    FROM entite
    WHERE code = 'CDP';

    -- Si l'entité existe
    IF FOUND THEN
        -- Boucle sur les 12 mois
        FOR v_mois IN 1..12 LOOP
            -- Insertion des données pour chaque mois
            INSERT INTO ca_param_jours (entite_id, annee, mois, jours_ouverts)
            VALUES (v_entite_id, 2025, v_mois, 25)
            ON CONFLICT (entite_id, annee, mois) DO NOTHING;
        END LOOP;
    END IF;
END $$;