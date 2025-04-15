/*
  # Ajout du champ OrdreAffich à la table service_ca

  1. Modifications
    - Ajout de la colonne `ordre_affich` (integer, nullable) à la table `service_ca`
*/

ALTER TABLE service_ca
ADD COLUMN ordre_affich integer;