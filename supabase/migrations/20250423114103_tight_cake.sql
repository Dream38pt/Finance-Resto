/*
  # Création de la table de fermeture de caisse

  1. Nouvelle Table
    - `fin_ferm_caisse`
      - `id` (uuid, clé primaire)
      - `date_fermeture` (date, date de fermeture de caisse, unique)
      - `ca_ttc` (numeric(12,2), chiffre d'affaires TTC)
      - `ca_ht` (numeric(12,2), chiffre d'affaires HT)
      - `depot_banque_theorique` (numeric(12,2), montant théorique du dépôt en banque)
      - `depot_banque_reel` (numeric(12,2), montant réel du dépôt en banque)
      - `est_valide` (boolean, indique si la fermeture est validée)
      - `commentaire` (varchar(30), commentaire optionnel)
      - timestamps standards (created_at, updated_at)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_ferm_caisse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_fermeture date NOT NULL UNIQUE,
  ca_ttc numeric(12,2) NOT NULL,
  ca_ht numeric(12,2) NOT NULL,
  depot_banque_theorique numeric(12,2),
  depot_banque_reel numeric(12,2),
  est_valide boolean NOT NULL DEFAULT false,
  commentaire varchar(30),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_ferm_caisse ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_ferm_caisse
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_ferm_caisse
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_ferm_caisse
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_ferm_caisse
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_ferm_caisse_updated_at
  BEFORE UPDATE ON fin_ferm_caisse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();