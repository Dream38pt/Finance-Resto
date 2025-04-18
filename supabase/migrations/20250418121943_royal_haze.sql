/*
  # Mise à jour des contraintes sur les lignes de facture
  
  1. Description
    - Rendre les champs quantite et prix_unitaire_ht optionnels
    - Supprimer les contraintes de validation sur ces champs
    - Conserver uniquement la contrainte de non-négativité sur montant_ht
    
  2. Changements
    - Modification des colonnes pour permettre les valeurs NULL
    - Mise à jour des contraintes CHECK
*/

-- Modification des colonnes pour les rendre nullables
ALTER TABLE fin_ligne_facture_achat
ALTER COLUMN quantite DROP NOT NULL,
ALTER COLUMN prix_unitaire_ht DROP NOT NULL;

-- Suppression des anciennes contraintes
ALTER TABLE fin_ligne_facture_achat
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_quantite_check,
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_prix_unitaire_ht_check;

-- Ajout des nouvelles contraintes
ALTER TABLE fin_ligne_facture_achat
ADD CONSTRAINT fin_ligne_facture_achat_quantite_check 
  CHECK (quantite IS NULL OR quantite >= 0),
ADD CONSTRAINT fin_ligne_facture_achat_prix_unitaire_ht_check 
  CHECK (prix_unitaire_ht IS NULL OR prix_unitaire_ht >= 0);