/*
  # Ajout d'une contrainte d'unicité pour les opérations bancaires

  1. Description
    - Ajoute une contrainte d'unicité sur les colonnes clés de la table fin_bq_import
    - Empêche l'insertion de doublons même s'ils viennent de fichiers différents
    - Remplace l'index unique existant par une contrainte plus stricte

  2. Changements
    - Suppression de l'index unique existant
    - Ajout d'une contrainte UNIQUE sur les colonnes essentielles
*/

-- Suppression de l'index unique existant
DROP INDEX IF EXISTS uniq_bq_import;

-- Ajout de la contrainte d'unicité
ALTER TABLE fin_bq_import
ADD CONSTRAINT unique_operation_import
UNIQUE (conta, data_valor, valor, saldo, descricao);

-- Ajout d'un commentaire sur la contrainte
COMMENT ON CONSTRAINT unique_operation_import ON fin_bq_import IS 
'Empêche les doublons d''opérations bancaires, même provenant de fichiers différents';