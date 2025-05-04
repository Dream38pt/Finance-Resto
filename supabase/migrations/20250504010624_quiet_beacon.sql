/*
  # Ajout de champs à la table fin_categorie_achat

  1. Nouvelles colonnes
    - `fait_partie_cout_boisson` (boolean, défaut FALSE)
    - `depenses_hors_CF` (boolean, défaut FALSE)

  2. Description
    Ces champs permettent de catégoriser plus précisément les dépenses:
    - fait_partie_cout_boisson: indique si la catégorie fait partie des coûts de boissons
    - depenses_hors_CF: indique si la catégorie est exclue des coûts fixes
*/

-- Ajout des nouvelles colonnes
ALTER TABLE fin_categorie_achat
ADD COLUMN fait_partie_cout_boisson boolean NOT NULL DEFAULT false,
ADD COLUMN depenses_hors_CF boolean NOT NULL DEFAULT false;