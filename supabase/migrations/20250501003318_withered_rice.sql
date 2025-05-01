/*
  # Ajout d'un index d'unicité pour les imports bancaires

  1. Description
    - Crée un index unique sur la table fin_bq_import pour éviter les doublons
    - Utilise une combinaison de colonnes pour identifier de manière unique chaque opération
    - Empêche la réimportation accidentelle des mêmes données

  2. Colonnes utilisées pour l'unicité
    - conta (numéro de compte)
    - data_valor (date de valeur)
    - valor (montant)
    - saldo (solde)
    - descricao (libellé)
    - referencia_doc (référence du document)
*/

-- Création de l'index d'unicité
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bq_import
ON fin_bq_import (
  conta,
  data_valor,
  valor,
  saldo,
  descricao,
  referencia_doc
);

-- Ajout d'un commentaire sur l'index
COMMENT ON INDEX uniq_bq_import IS 'Empêche les doublons lors des importations répétées de fichiers bancaires';