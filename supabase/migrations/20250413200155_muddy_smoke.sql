/*
  # Mise à jour des jours ouverts

  1. Description
    - Met à jour tous les enregistrements existants dans ca_param_jours
    - Définit le champ jours_ouverts à un tableau de 25 jours (1 à 25)
*/

DO $$
DECLARE
    v_jours_array integer[] := ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
BEGIN
    -- Mise à jour de tous les enregistrements existants
    UPDATE ca_param_jours
    SET jours_ouverts = v_jours_array;
END $$;