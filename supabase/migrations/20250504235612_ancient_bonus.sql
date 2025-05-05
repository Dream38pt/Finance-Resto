/*
  # Ajout de champs à la table fin_tiers

  1. Nouvelles colonnes
    - `fait_partie_cout_mp` (boolean, défaut FALSE)
    - `depenses_hors_cf` (boolean, défaut FALSE)
    - `depenses_cf` (boolean, défaut FALSE)

  2. Description
    Ces champs permettent de catégoriser plus précisément les tiers:
    - fait_partie_cout_mp: indique si le tiers fait partie des coûts de matières premières
    - depenses_hors_cf: indique si le tiers est exclu des coûts fixes
    - depenses_cf: indique si le tiers fait partie des dépenses de coûts fixes
*/

-- Ajout des nouvelles colonnes
ALTER TABLE fin_tiers
ADD COLUMN fait_partie_cout_mp boolean NOT NULL DEFAULT false,
ADD COLUMN depenses_hors_cf boolean NOT NULL DEFAULT false,
ADD COLUMN depenses_cf boolean NOT NULL DEFAULT false;