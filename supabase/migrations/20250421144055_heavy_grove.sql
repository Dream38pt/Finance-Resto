/*
  # Modification des contraintes pour permettre les montants négatifs

  1. Modifications
    - Suppression des contraintes CHECK existantes sur montant_ht, montant_tva et montant_ttc
    - Ajout de nouvelles contraintes sans restriction de signe pour permettre les avoirs et remboursements
    
  2. Description
    Cette migration modifie la table fin_facture_achat pour permettre l'enregistrement
    de montants négatifs, nécessaires pour les avoirs et remboursements.
*/

-- Suppression des contraintes existantes
ALTER TABLE fin_facture_achat
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_ht_check,
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_tva_check,
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_ttc_check;

-- Suppression des contraintes existantes sur les lignes de facture
ALTER TABLE fin_ligne_facture_achat
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_montant_ht_check,
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_montant_tva_check,
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_prix_unitaire_ht_check,
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_quantite_check;

-- Ajout des nouvelles contraintes pour les lignes de facture
-- Note: Nous n'ajoutons pas de contraintes sur le signe pour permettre les valeurs négatives
ALTER TABLE fin_ligne_facture_achat
ADD CONSTRAINT fin_ligne_facture_achat_prix_unitaire_ht_check 
  CHECK (prix_unitaire_ht IS NULL OR prix_unitaire_ht IS NOT NULL),
ADD CONSTRAINT fin_ligne_facture_achat_quantite_check 
  CHECK (quantite IS NULL OR quantite IS NOT NULL);