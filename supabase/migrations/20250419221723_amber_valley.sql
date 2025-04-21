/*
  # Correction du champ ordre_affich dans la table ca_type_service

  1. Description
    - Vérifie si le champ ordre_affich existe dans la table ca_type_service
    - Ajoute le champ s'il n'existe pas
    - Assure la cohérence avec le formulaire de l'interface utilisateur

  2. Changements
    - Ajout du champ ordre_affich s'il n'existe pas
    - Ajout de logs pour le débogage
*/

-- Vérification et ajout du champ ordre_affich s'il n'existe pas
DO $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'ca_type_service' 
    AND column_name = 'ordre_affich'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE NOTICE 'Ajout de la colonne ordre_affich à la table ca_type_service';
    ALTER TABLE ca_type_service
    ADD COLUMN ordre_affich integer;
  ELSE
    RAISE NOTICE 'La colonne ordre_affich existe déjà dans la table ca_type_service';
  END IF;
END $$;