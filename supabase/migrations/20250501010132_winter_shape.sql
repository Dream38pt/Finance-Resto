/*
  # Ajout du champ nom_fichier à la table fin_bq_import

  1. Modifications
    - Ajout de la colonne nom_fichier (TEXT) pour stocker le nom du fichier d'origine
    - Mise à jour de l'index d'unicité pour inclure le nom du fichier
    - Ajout de commentaires explicatifs

  2. Description
    Cette migration ajoute un champ pour stocker le nom du fichier d'origine lors de l'import,
    ce qui permet d'éviter les imports en double et de tracer l'origine des données.
*/

-- Vérification et ajout de la colonne si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'fin_bq_import' 
    AND column_name = 'nom_fichier'
  ) THEN
    -- Ajout de la colonne nom_fichier
    ALTER TABLE fin_bq_import
    ADD COLUMN nom_fichier TEXT;

    -- Ajout d'un commentaire explicatif sur la colonne
    COMMENT ON COLUMN fin_bq_import.nom_fichier IS 'Nom du fichier d''origine lors de l''import, utilisé pour éviter les imports en double';
  END IF;
END $$;

-- Mise à jour de l'index d'unicité pour inclure le nom du fichier
-- Suppression de l'ancien index s'il existe
DROP INDEX IF EXISTS uniq_bq_import;

-- Création du nouvel index avec le nom du fichier
CREATE UNIQUE INDEX uniq_bq_import
ON fin_bq_import (
  conta,
  data_valor,
  valor,
  saldo,
  descricao,
  referencia_doc,
  COALESCE(nom_fichier, '')
);

-- Ajout d'un commentaire sur l'index
COMMENT ON INDEX uniq_bq_import IS 'Empêche les doublons lors des importations répétées de fichiers bancaires';