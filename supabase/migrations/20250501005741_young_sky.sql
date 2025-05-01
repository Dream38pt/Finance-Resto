/*
  # Ajout du champ nom_fichier à la table fin_bq_import

  1. Modifications
    - Ajout du champ `nom_fichier` (text, nullable) à la table fin_bq_import
    - Ce champ permettra de stocker le nom du fichier d'origine lors de l'import

  2. Description
    Cette modification permet de tracer l'origine des données importées et d'éviter
    les imports en double du même fichier. Cela facilite également le débogage et
    la vérification des données en permettant de remonter à la source.
*/

-- Ajout de la colonne nom_fichier
ALTER TABLE fin_bq_import
ADD COLUMN nom_fichier TEXT;

-- Ajout d'un commentaire explicatif sur la colonne
COMMENT ON COLUMN fin_bq_import.nom_fichier IS 'Nom du fichier d''origine lors de l''import, utilisé pour éviter les imports en double';

-- Mise à jour de l'index d'unicité pour inclure le nom du fichier
-- Cela permet d'éviter les doublons même si le même fichier est importé plusieurs fois
DROP INDEX IF EXISTS uniq_bq_import;

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