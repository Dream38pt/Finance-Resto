/*
  # Création de la table des formats d'importation bancaire

  1. Nouvelle Table
    - `FIN_BQ_format_import`
      - `id` (uuid, clé primaire)
      - `code` (text, unique, code technique du format)
      - `nom_affichage` (text, label affiché dans l'interface)
      - `type_fichier` (text, type de fichier supporté)
      - `separateur` (text, séparateur pour les CSV)
      - `sauter_lignes` (integer, nombre de lignes à ignorer)
      - `parsing_function` (text, nom de la fonction à appeler)
      - `actif` (boolean, statut actif/inactif)
      - `created_at` (timestamp, date de création)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table des formats d'importation bancaire
CREATE TABLE IF NOT EXISTS FIN_BQ_format_import (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,            -- Code technique (ex: 'bcp', 'caixa')
  nom_affichage TEXT NOT NULL,          -- Label affiché dans l'interface (ex: 'Banco BCP (CSV)')
  type_fichier TEXT NOT NULL,           -- 'csv', 'xls', 'xlsx'
  separateur TEXT,                      -- ex: ',' ou '\t' (null si fichier Excel)
  sauter_lignes INT DEFAULT 0,          -- Nombre de lignes à ignorer au début
  parsing_function TEXT,                -- Nom de la fonction à appeler pour parser (ex: 'parseBCP')
  actif BOOLEAN DEFAULT true,           -- Permet de désactiver un format
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE FIN_BQ_format_import ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON FIN_BQ_format_import
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON FIN_BQ_format_import
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON FIN_BQ_format_import
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON FIN_BQ_format_import
  FOR DELETE
  TO authenticated
  USING (true);

-- Insérer quelques formats par défaut
INSERT INTO FIN_BQ_format_import (code, nom_affichage, type_fichier, separateur, sauter_lignes, parsing_function)
VALUES 
  ('bcp', 'Banco BCP (CSV)', 'csv', ';', 1, 'parseBCP'),
  ('caixa', 'Caixa Geral (Excel)', 'xlsx', NULL, 2, 'parseCaixa'),
  ('santander', 'Santander (CSV)', 'csv', ',', 0, 'parseSantander')
ON CONFLICT (code) DO NOTHING;

-- Créer un index sur le code pour optimiser les recherches
CREATE INDEX idx_fin_bq_format_import_code ON FIN_BQ_format_import(code);

-- Créer un index sur le statut actif pour filtrer rapidement les formats actifs
CREATE INDEX idx_fin_bq_format_import_actif ON FIN_BQ_format_import(actif);