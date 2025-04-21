/*
  # Correction du champ ordre_affich dans la table ca_type_service

  1. Description
    - Vérifie si le champ ordre_affich existe dans la table ca_type_service
    - Ajoute le champ s'il n'existe pas
    - Assure la cohérence avec le formulaire de l'interface utilisateur

  2. Changements
    - Ajout du champ ordre_affich s'il n'existe pas
*/

-- Vérification et ajout du champ ordre_affich s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ca_type_service' 
    AND column_name = 'ordre_affich'
  ) THEN
    ALTER TABLE ca_type_service
    ADD COLUMN ordre_affich integer;
  END IF;
END $$;