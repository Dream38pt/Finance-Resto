/*
  # Suppression des contraintes de calcul automatique du montant TTC
  
  1. Description
    - Supprime la contrainte qui force montant_ttc = montant_ht + montant_tva
    - Supprime le trigger et la fonction de calcul automatique
    - Ajoute une simple contrainte de non-négativité sur montant_ttc
    
  2. Changements
    - Suppression de la contrainte existante sur montant_ttc
    - Suppression du trigger tr_calculate_montant_ttc
    - Suppression de la fonction calculate_montant_ttc
    - Ajout d'une nouvelle contrainte pour montant_ttc >= 0
*/

-- Suppression de l'ancienne contrainte
ALTER TABLE fin_facture_achat
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_ttc_check;

-- Ajout de la nouvelle contrainte (uniquement non-négativité)
ALTER TABLE fin_facture_achat
ADD CONSTRAINT fin_facture_achat_montant_ttc_check CHECK (montant_ttc >= 0);

-- Suppression du trigger de calcul automatique
DROP TRIGGER IF EXISTS tr_calculate_montant_ttc ON fin_facture_achat;
DROP FUNCTION IF EXISTS calculate_montant_ttc;