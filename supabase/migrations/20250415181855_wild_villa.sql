/*
  # Ajout des champs pour les lignes de facture

  1. Modifications
    - Ajout des champs designation, quantite et prix_unitaire_ht
    - Mise à jour des contraintes de validation
    - Modification du calcul du montant_ht

  2. Description
    Ces modifications permettent de gérer les lignes de facture avec :
    - Une désignation obligatoire
    - Une quantité et un prix unitaire
    - Un calcul automatique du montant HT
*/

-- Ajout des nouveaux champs
ALTER TABLE fin_ligne_facture_achat
ADD COLUMN designation varchar(100) NOT NULL,
ADD COLUMN quantite numeric(10,3) NOT NULL CHECK (quantite > 0),
ADD COLUMN prix_unitaire_ht numeric(10,2) NOT NULL CHECK (prix_unitaire_ht >= 0);

-- Mise à jour de la contrainte sur montant_ht pour qu'elle soit calculée
ALTER TABLE fin_ligne_facture_achat
DROP CONSTRAINT IF EXISTS fin_ligne_facture_achat_montant_ht_check,
ADD CONSTRAINT fin_ligne_facture_achat_montant_ht_check 
CHECK (montant_ht = quantite * prix_unitaire_ht);

-- Création d'un trigger pour calculer automatiquement le montant_ht
CREATE OR REPLACE FUNCTION calculate_montant_ht()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_ht := NEW.quantite * NEW.prix_unitaire_ht;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_calculate_montant_ht
  BEFORE INSERT OR UPDATE ON fin_ligne_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION calculate_montant_ht();