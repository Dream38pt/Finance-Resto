/*
  # Ajout du champ tx_mp à la table ca_param_jours

  1. Modifications
    - Ajout du champ `tx_mp` (numeric(5,2)) pour stocker le taux de matière première
    - Contrainte CHECK pour s'assurer que le taux est un pourcentage valide (entre 0 et 100)
*/

ALTER TABLE ca_param_jours
ADD COLUMN tx_mp numeric(5,2) NOT NULL DEFAULT 0 CHECK (tx_mp >= 0 AND tx_mp <= 100);