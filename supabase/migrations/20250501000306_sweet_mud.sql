/*
  # Création de la table FIN_mouvement_bancaire

  1. Nouvelle Table
    - `FIN_mouvement_bancaire`
      - `id` (BIGINT, clé primaire auto-incrémentée)
      - `id_compte` (UUID, clé étrangère vers FIN_compte_bancaire)
      - `data_lancamento` (DATE, date de l'opération)
      - `data_valor` (DATE, date de valeur)
      - `descricao` (TEXT, description du mouvement)
      - `valor` (NUMERIC, montant du mouvement)
      - `saldo` (NUMERIC, solde après mouvement)
      - `referencia_doc` (TEXT, référence du document)
      - `import_bq_id` (BIGINT, clé étrangère vers FIN_IMPORT_BQ)
      - `created_at` (TIMESTAMP, date de création)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table FIN_mouvement_bancaire
CREATE TABLE IF NOT EXISTS FIN_mouvement_bancaire (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Lien vers le compte bancaire (optionnel)
  id_compte UUID REFERENCES FIN_compte_bancaire(id) ON DELETE SET NULL,

  -- Données du mouvement
  data_lancamento DATE NOT NULL,
  data_valor DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  saldo NUMERIC NOT NULL,
  referencia_doc TEXT,

  -- Lien vers l'import d'origine (optionnel)
  import_bq_id BIGINT REFERENCES FIN_IMPORT_BQ(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE FIN_mouvement_bancaire ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON FIN_mouvement_bancaire
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON FIN_mouvement_bancaire
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON FIN_mouvement_bancaire
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON FIN_mouvement_bancaire
  FOR DELETE
  TO authenticated
  USING (true);

-- Créer des index pour optimiser les performances
CREATE INDEX idx_fin_mouvement_bancaire_compte ON FIN_mouvement_bancaire(id_compte);
CREATE INDEX idx_fin_mouvement_bancaire_dates ON FIN_mouvement_bancaire(data_lancamento, data_valor);
CREATE INDEX idx_fin_mouvement_bancaire_import ON FIN_mouvement_bancaire(import_bq_id);