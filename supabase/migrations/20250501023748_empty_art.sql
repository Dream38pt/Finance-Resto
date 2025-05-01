/*
  # Mise à jour des champs de la table fin_bq_format_import
  
  1. Modifications
    - Augmentation de la taille du champ separateur à 10 caractères
    - Ajout du champ commentaires de 40 caractères
    
  2. Description
    Cette migration modifie la structure de la table fin_bq_format_import
    pour permettre des séparateurs plus complexes et ajouter des commentaires
    descriptifs pour chaque format d'importation.
*/

-- Vérification et modification du champ separateur
DO $$
BEGIN
  -- Modification du type de la colonne separateur pour augmenter sa taille
  ALTER TABLE fin_bq_format_import
  ALTER COLUMN separateur TYPE VARCHAR(10);

  -- Ajout de la colonne commentaires si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'fin_bq_format_import' 
    AND column_name = 'commentaires'
  ) THEN
    ALTER TABLE fin_bq_format_import
    ADD COLUMN commentaires VARCHAR(40);
  END IF;
END $$;