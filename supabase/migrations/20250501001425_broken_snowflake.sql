/*
  # Renommage des tables bancaires en minuscules

  1. Description
    - Renomme la table "FIN_BQ_IMPORT" en "fin_bq_import"
    - Renomme la table "FIN_BQ_Mouvement" en "fin_bq_Mouvement"
    - Met à jour les contraintes et index associés

  2. Changements
    - Renommage des tables
    - Mise à jour des contraintes de clé étrangère
    - Mise à jour des index
    - Mise à jour des politiques RLS
*/

-- Renommage de la table FIN_BQ_IMPORT en fin_bq_import
ALTER TABLE IF EXISTS "FIN_BQ_IMPORT" RENAME TO "fin_bq_import";

-- Renommage de la table FIN_BQ_Mouvement en fin_bq_Mouvement
ALTER TABLE IF EXISTS "FIN_BQ_Mouvement" RENAME TO "fin_bq_Mouvement";

-- Mise à jour de la contrainte de clé étrangère dans fin_bq_Mouvement
ALTER TABLE "fin_bq_Mouvement" 
DROP CONSTRAINT IF EXISTS fin_bq_mouvement_import_bq_id_fkey;

ALTER TABLE "fin_bq_Mouvement"
ADD CONSTRAINT fin_bq_mouvement_import_bq_id_fkey
FOREIGN KEY (import_bq_id) REFERENCES "fin_bq_import"(id) ON DELETE SET NULL;

-- Renommage des index pour la table fin_bq_import
ALTER INDEX IF EXISTS idx_fin_bq_import_import_id RENAME TO idx_fin_bq_import_import_id_new;
ALTER INDEX IF EXISTS idx_fin_bq_import_dates RENAME TO idx_fin_bq_import_dates_new;

-- Renommage des index pour la table fin_bq_Mouvement
ALTER INDEX IF EXISTS idx_fin_bq_mouvement_compte RENAME TO idx_fin_bq_mouvement_compte_new;
ALTER INDEX IF EXISTS idx_fin_bq_mouvement_dates RENAME TO idx_fin_bq_mouvement_dates_new;
ALTER INDEX IF EXISTS idx_fin_bq_mouvement_import RENAME TO idx_fin_bq_mouvement_import_new;

-- Mise à jour des politiques RLS pour fin_bq_import
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "fin_bq_import";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "fin_bq_import";
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "fin_bq_import";
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "fin_bq_import";

CREATE POLICY "Enable read access for authenticated users" ON "fin_bq_import"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "fin_bq_import"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "fin_bq_import"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON "fin_bq_import"
  FOR DELETE
  TO authenticated
  USING (true);

-- Mise à jour des politiques RLS pour fin_bq_Mouvement
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "fin_bq_Mouvement";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "fin_bq_Mouvement";
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "fin_bq_Mouvement";
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "fin_bq_Mouvement";

CREATE POLICY "Enable read access for authenticated users" ON "fin_bq_Mouvement"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "fin_bq_Mouvement"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "fin_bq_Mouvement"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON "fin_bq_Mouvement"
  FOR DELETE
  TO authenticated
  USING (true);