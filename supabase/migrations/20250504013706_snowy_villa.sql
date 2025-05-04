/*
  # Ajout du champ depenses_cf à la table fin_categorie_achat

  1. Nouvelle colonne
    - `depenses_cf` (boolean, défaut FALSE)

  2. Description
    Ce champ permet d'identifier les catégories qui font partie des dépenses de coûts fixes,
    complémentaire au champ existant depenses_hors_cf.
*/

-- Ajout de la nouvelle colonne
ALTER TABLE fin_categorie_achat
ADD COLUMN depenses_cf boolean NOT NULL DEFAULT false;