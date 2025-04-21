/*
  # Modification de la taille du champ IBAN
  
  1. Description
    - Augmente la taille du champ IBAN de 20 à 30 caractères
    - Utilise ALTER COLUMN pour modifier la définition du champ
    
  2. Changements
    - Modification de la colonne iban dans la table fin_compte_bancaire
*/

ALTER TABLE fin_compte_bancaire
ALTER COLUMN iban TYPE varchar(30);