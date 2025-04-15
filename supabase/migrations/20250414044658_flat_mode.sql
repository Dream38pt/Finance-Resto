/*
  # Ajout du champ ordre_affichage à la table personnel

  1. Modifications
    - Ajout de la colonne `ordre_affichage` (integer) à la table personnel
    - Valeur par défaut à NULL
    - Permet de définir l'ordre d'affichage des employés dans la liste

  2. Description
    Ce champ permettra de personnaliser l'ordre d'affichage des employés
    dans l'interface, indépendamment des autres critères de tri
*/

-- Ajout de la colonne ordre_affichage
ALTER TABLE personnel
ADD COLUMN ordre_affichage integer;