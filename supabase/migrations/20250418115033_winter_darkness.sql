/*
  # Suppression des contraintes de calcul automatique du montant HT
  
  1. Description
    - Supprime la contrainte qui force montant_ht = quantite * prix_unitaire_ht
    - Supprime le trigger de calcul automatique du montant HT
    - Supprime le trigger qui met à jour le montant HT de la facture
    - Ajoute une simple contrainte de non-négativité sur montant_ht
    
  2. Changements
    - Suppression des contraintes existantes
    - Suppression des triggers
    - Suppression des fonctions associées
    - Ajout d'une nouvelle contrainte pour montant_ht >= 0
*/

-- Suppression des contraintes existantes
ALTER TABLE fin_ligne_facture_achat
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_montant_ht_check;

-- Ajout de la nouvelle contrainte (uniquement non-négativité)
ALTER TABLE fin_ligne_facture_achat
ADD CONSTRAINT fin_ligne_facture_achat_montant_ht_check CHECK (montant_ht >= 0);

-- Suppression des triggers
DROP TRIGGER IF EXISTS tr_calculate_montant_ht ON fin_ligne_facture_achat;
DROP TRIGGER IF EXISTS tr_update_facture_montant_ht ON fin_ligne_facture_achat;

-- Suppression des fonctions
DROP FUNCTION IF EXISTS calculate_montant_ht;
DROP FUNCTION IF EXISTS update_facture_montant_ht;