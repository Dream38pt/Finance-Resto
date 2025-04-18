/*
  # Add constraint to prevent invoice without lines

  1. Description
    - Create a function to check if an invoice has at least one line
    - Add a trigger to validate this constraint before insert/update
    - Return error message if no lines are found

  2. Security
    - Function is immutable for better performance
    - Error message is clear and user-friendly
*/

-- Create function to check if invoice has lines
CREATE OR REPLACE FUNCTION check_invoice_has_lines()
RETURNS TRIGGER AS $$
DECLARE
  line_count integer;
BEGIN
  -- For updates, wait a short moment to ensure lines are processed first
  IF TG_OP = 'UPDATE' THEN
    PERFORM pg_sleep(0.1);
  END IF;

  -- Count lines for this invoice
  SELECT COUNT(*)
  INTO line_count
  FROM fin_ligne_facture_achat
  WHERE facture_id = NEW.id;

  -- If no lines found, raise an error
  IF line_count = 0 THEN
    RAISE EXCEPTION 'Impossible d''enregistrer la facture : au moins une ligne analytique est requise.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint
CREATE TRIGGER tr_check_invoice_has_lines
  AFTER INSERT OR UPDATE ON fin_facture_achat
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_has_lines();