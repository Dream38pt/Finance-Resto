/*
  # Création de la table des paramètres généraux

  1. Nouvelle Table
    - `param_gen`
      - `id` (uuid, clé primaire)
      - `tx_tva_ca` (numeric(4,2), taux de TVA sur CA)
      - `tx_tva_ca_date_debut` (date, date de début de validité)
      - `tx_tva_ca_date_fin` (date, date de fin de validité, nullable)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Sécurité
    - Activation RLS
    - Politiques CRUD pour les utilisateurs authentifiés
*/

-- Création de la table param_gen
CREATE TABLE IF NOT EXISTS param_gen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_tva_ca numeric(4,2) NOT NULL,
  tx_tva_ca_date_debut date NOT NULL,
  tx_tva_ca_date_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE param_gen ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON param_gen
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON param_gen
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON param_gen
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON param_gen
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_param_gen_updated_at
  BEFORE UPDATE ON param_gen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();