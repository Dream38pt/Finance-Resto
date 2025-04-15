/*
  # Ajout des champs de TVA déductible

  1. Modifications
    - Ajout du champ tx_tva_deductible (numeric(4,2))
    - Ajout du champ tx_tva_deductible_date_debut (date)
    - Ajout du champ tx_tva_deductible_date_fin (date, nullable)

  2. Description
    Ces champs permettront de gérer les taux de TVA déductible avec leurs périodes de validité
*/

-- Ajout des nouveaux champs à la table param_gen
ALTER TABLE param_gen
ADD COLUMN tx_tva_deductible numeric(4,2) NOT NULL,
ADD COLUMN tx_tva_deductible_date_debut date NOT NULL,
ADD COLUMN tx_tva_deductible_date_fin date;