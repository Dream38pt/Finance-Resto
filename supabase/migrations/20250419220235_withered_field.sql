/*
  # Ajout des champs d'heure de début et de fin à la table ca_type_service

  1. Modifications
    - Ajout du champ `heure_debut` (time) pour l'heure de début du service
    - Ajout du champ `heure_fin` (time) pour l'heure de fin du service

  2. Description
    Ces champs permettront de définir les plages horaires exactes de chaque service,
    ce qui facilitera le calcul dynamique de l'appartenance d'une heure à un service spécifique.
*/

-- Ajout des colonnes pour les heures de début et de fin
ALTER TABLE ca_type_service
ADD COLUMN heure_debut time,
ADD COLUMN heure_fin time;

-- Ajout d'une contrainte pour s'assurer que l'heure de fin est après l'heure de début
ALTER TABLE ca_type_service
ADD CONSTRAINT heure_fin_apres_debut CHECK (heure_fin > heure_debut);

-- Commentaires sur les colonnes pour la documentation
COMMENT ON COLUMN ca_type_service.heure_debut IS 'Heure de début du service (ex: 11:30)';
COMMENT ON COLUMN ca_type_service.heure_fin IS 'Heure de fin du service (ex: 14:30)';