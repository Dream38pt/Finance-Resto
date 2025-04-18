/*
  # Amélioration de la gestion des factures

  1. Modifications
    - Suppression du trigger existant qui n'est pas optimal
    - Création d'un nouveau trigger plus robuste
    - Ajout d'une fonction de validation améliorée

  2. Description
    Cette migration améliore la gestion des factures en :
    - Permettant l'insertion initiale sans lignes
    - Vérifiant la présence de lignes uniquement lors de la finalisation
    - Ajoutant un statut pour gérer l'état de la facture
*/

-- Suppression du trigger et de la fonction existants
DROP TRIGGER IF EXISTS tr_check_invoice_has_lines ON fin_facture_achat;
DROP FUNCTION IF EXISTS check_invoice_has_lines;

-- Ajout de la colonne statut
ALTER TABLE fin_facture_achat
ADD COLUMN IF NOT EXISTS statut varchar(20) NOT NULL DEFAULT 'brouillon'
CHECK (statut IN ('brouillon', 'validé'));

-- Création de la nouvelle fonction de validation
CREATE OR REPLACE FUNCTION validate_invoice()
RETURNS TRIGGER AS $$
DECLARE
  line_count integer;
BEGIN
  -- Si on passe de brouillon à validé, vérifier les lignes
  IF NEW.statut = 'validé' AND (OLD.statut IS NULL OR OLD.statut = 'brouillon') THEN
    -- Compter les lignes
    SELECT COUNT(*)
    INTO line_count
    FROM fin_ligne_facture_achat
    WHERE facture_id = NEW.id;

    -- Vérifier qu'il y a au moins une ligne
    IF line_count = 0 THEN
      RAISE EXCEPTION 'Impossible de valider la facture : au moins une ligne analytique est requise.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du nouveau trigger
CREATE TRIGGER tr_validate_invoice
  BEFORE UPDATE ON fin_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice();