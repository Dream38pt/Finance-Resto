/*
  # Ajout du champ num_lettrage à la table fin_bq_Mouvement

  1. Modifications
    - Ajout du champ `num_lettrage` (integer, nullable) à la table fin_bq_Mouvement
    - Ce champ permettra de "pointer" les écritures bancaires avec différents éléments

  2. Description
    Ce champ servira à associer des écritures bancaires entre elles ou avec d'autres
    éléments du système, facilitant ainsi le rapprochement bancaire et le suivi des opérations.
*/

-- Ajout de la colonne num_lettrage
ALTER TABLE "fin_bq_Mouvement"
ADD COLUMN num_lettrage integer;

-- Création d'un index pour optimiser les recherches par num_lettrage
CREATE INDEX idx_fin_bq_mouvement_num_lettrage ON "fin_bq_Mouvement"(num_lettrage);

-- Ajout d'un commentaire sur la colonne
COMMENT ON COLUMN "fin_bq_Mouvement".num_lettrage IS 'Numéro de lettrage pour le rapprochement bancaire';