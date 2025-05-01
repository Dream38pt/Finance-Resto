/*
  # Création de la table FIN_IMPORT_BQ pour l'import des fichiers bancaires

  1. Nouvelle Table
    - `FIN_IMPORT_BQ`
      - `id` (BIGINT, clé primaire, auto-incrémentée)
      - `import_id` (UUID, identifiant unique pour chaque import)
      - `companhia` (TEXT, nom de la compagnie)
      - `produto` (TEXT, produit bancaire)
      - `conta` (TEXT, numéro de compte)
      - `moeda` (TEXT, devise)
      - `data_lancamento` (DATE, date de l'opération)
      - `data_valor` (DATE, date de valeur)
      - `descricao` (TEXT, description de l'opération)
      - `valor` (NUMERIC, montant de l'opération)
      - `saldo` (NUMERIC, solde après opération)
      - `referencia_doc` (TEXT, référence du document)
      - `created_at` (TIMESTAMP, date de création de l'enregistrement)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table FIN_IMPORT_BQ
CREATE TABLE IF NOT EXISTS FIN_IMPORT_BQ (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  import_id UUID NOT NULL,
  companhia TEXT,
  produto TEXT,
  conta TEXT,
  moeda TEXT,
  data_lancamento DATE,
  data_valor DATE,
  descricao TEXT,
  valor NUMERIC,
  saldo NUMERIC,
  referencia_doc TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE FIN_IMPORT_BQ ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON FIN_IMPORT_BQ
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON FIN_IMPORT_BQ
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON FIN_IMPORT_BQ
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON FIN_IMPORT_BQ
  FOR DELETE
  TO authenticated
  USING (true);

-- Créer un index sur import_id pour faciliter les requêtes groupées
CREATE INDEX idx_fin_import_bq_import_id ON FIN_IMPORT_BQ(import_id);

-- Créer un index sur les dates pour faciliter les recherches par période
CREATE INDEX idx_fin_import_bq_dates ON FIN_IMPORT_BQ(data_lancamento, data_valor);