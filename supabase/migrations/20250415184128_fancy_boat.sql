/*
  # Mise à jour des tables de factures

  1. Modifications
    - Ajout des contraintes de validation sur les montants
    - Ajout des triggers pour les calculs automatiques
    - Mise à jour des contraintes existantes

  2. Description
    Cette migration met à jour les tables fin_facture_achat et fin_ligne_facture_achat
    pour ajouter les contraintes de validation et les calculs automatiques des montants.
*/

-- Suppression des anciennes contraintes
ALTER TABLE fin_facture_achat
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_ht_check,
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_tva_check,
DROP CONSTRAINT IF EXISTS fin_facture_achat_montant_ttc_check;

-- Ajout des nouvelles contraintes
ALTER TABLE fin_facture_achat
ADD CONSTRAINT fin_facture_achat_montant_ht_check CHECK (montant_ht >= 0),
ADD CONSTRAINT fin_facture_achat_montant_tva_check CHECK (montant_tva >= 0),
ADD CONSTRAINT fin_facture_achat_montant_ttc_check CHECK (montant_ttc = montant_ht + montant_tva);

-- Fonction pour calculer le montant TTC
CREATE OR REPLACE FUNCTION calculate_montant_ttc()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant_ttc := NEW.montant_ht + NEW.montant_tva;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement le montant TTC
CREATE TRIGGER tr_calculate_montant_ttc
  BEFORE INSERT OR UPDATE ON fin_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION calculate_montant_ttc();

-- Fonction pour mettre à jour le montant HT de la facture
CREATE OR REPLACE FUNCTION update_facture_montant_ht()
RETURNS TRIGGER AS $$
DECLARE
  v_montant_ht numeric(10,2);
BEGIN
  -- Calculer la somme des montants HT des lignes
  SELECT COALESCE(SUM(montant_ht), 0)
  INTO v_montant_ht
  FROM fin_ligne_facture_achat
  WHERE facture_id = NEW.facture_id;

  -- Mettre à jour le montant HT de la facture
  UPDATE fin_facture_achat
  SET montant_ht = v_montant_ht
  WHERE id = NEW.facture_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le montant HT de la facture
CREATE TRIGGER tr_update_facture_montant_ht
  AFTER INSERT OR UPDATE OR DELETE ON fin_ligne_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION update_facture_montant_ht();