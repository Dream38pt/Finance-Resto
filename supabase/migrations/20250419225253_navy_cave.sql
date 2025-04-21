/*
  # Création de la table CA_reel_jour pour le suivi du CA réel

  1. Nouvelle Table
    - `CA_reel_jour`
      - `id` (uuid, clé primaire)
      - `id_entite` (uuid, clé étrangère vers entite)
      - `date` (date, date du chiffre d'affaires)
      - `horaire` (time, heure exacte de la donnée)
      - `docs_emitidos` (integer, nombre de documents/tickets)
      - `montant_moyen_ht` (numeric(10,2), moyenne HT par document)
      - `montant_moyen_ttc` (numeric(10,2), moyenne TTC par document)
      - `montant_total_ht` (numeric(10,2), total HT sur cette heure)
      - `montant_total_ttc` (numeric(10,2), total TTC sur cette heure)
      - `source` (text, source des données)
      - `date_import` (timestamptz, date d'import automatique)
      - Timestamps standards (created_at, updated_at)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS CA_reel_jour (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_entite uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  date date NOT NULL,
  horaire time NOT NULL,
  docs_emitidos integer,
  montant_moyen_ht numeric(10,2),
  montant_moyen_ttc numeric(10,2),
  montant_total_ht numeric(10,2),
  montant_total_ttc numeric(10,2),
  source text,
  date_import timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création d'un index sur les colonnes fréquemment utilisées pour le filtrage
CREATE INDEX idx_ca_reel_jour_entite_date 
ON CA_reel_jour(id_entite, date);

-- Création d'un index sur l'horaire pour les requêtes par plage horaire
CREATE INDEX idx_ca_reel_jour_horaire
ON CA_reel_jour(horaire);

-- Enable RLS
ALTER TABLE CA_reel_jour ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON CA_reel_jour
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON CA_reel_jour
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON CA_reel_jour
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON CA_reel_jour
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_ca_reel_jour_updated_at
  BEFORE UPDATE ON CA_reel_jour
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();