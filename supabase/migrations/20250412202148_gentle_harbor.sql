/*
  # Ajout des champs année à param_gen

  1. Modifications
    - Ajout du champ `annee_dispo` (integer) pour l'année disponible
    - Ajout du champ `annee_dispo_date_debut` (date) pour la date de début
    - Ajout du champ `annee_dispo_date_fin` (date) pour la date de fin
*/

ALTER TABLE param_gen
ADD COLUMN annee_dispo integer CHECK (annee_dispo >= 1900 AND annee_dispo <= 9999),
ADD COLUMN annee_dispo_date_debut date,
ADD COLUMN annee_dispo_date_fin date;