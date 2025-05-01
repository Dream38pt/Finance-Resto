/*
  # Renommage des tables bancaires

  1. Modifications
    - Renommage de la table `fin_import_bq` en `FIN_BQ_IMPORT`
    - Renommage de la table `fin_mouvement_bancaire` en `FIN_BQ_Mouvement`
    - Mise à jour des contraintes de clé étrangère

  2. Description
    Cette migration renomme les tables liées aux opérations bancaires pour
    une meilleure cohérence de nommage dans le schéma de la base de données.
*/

-- Renommage de la table fin_import_bq en FIN_BQ_IMPORT
ALTER TABLE IF EXISTS fin_import_bq RENAME TO "FIN_BQ_IMPORT";

-- Renommage de la table fin_mouvement_bancaire en FIN_BQ_Mouvement
ALTER TABLE IF EXISTS fin_mouvement_bancaire RENAME TO "FIN_BQ_Mouvement";

-- Mise à jour de la contrainte de clé étrangère dans FIN_BQ_Mouvement
ALTER TABLE "FIN_BQ_Mouvement" 
DROP CONSTRAINT IF EXISTS fin_mouvement_bancaire_import_bq_id_fkey;

ALTER TABLE "FIN_BQ_Mouvement"
ADD CONSTRAINT fin_bq_mouvement_import_bq_id_fkey
FOREIGN KEY (import_bq_id) REFERENCES "FIN_BQ_IMPORT"(id) ON DELETE SET NULL;

-- Renommage des index pour la table FIN_BQ_IMPORT
ALTER INDEX IF EXISTS idx_fin_import_bq_import_id RENAME TO idx_fin_bq_import_import_id;
ALTER INDEX IF EXISTS idx_fin_import_bq_dates RENAME TO idx_fin_bq_import_dates;

-- Renommage des index pour la table FIN_BQ_Mouvement
ALTER INDEX IF EXISTS idx_fin_mouvement_bancaire_compte RENAME TO idx_fin_bq_mouvement_compte;
ALTER INDEX IF EXISTS idx_fin_mouvement_bancaire_dates RENAME TO idx_fin_bq_mouvement_dates;
ALTER INDEX IF EXISTS idx_fin_mouvement_bancaire_import RENAME TO idx_fin_bq_mouvement_import;

-- Mise à jour des politiques RLS pour FIN_BQ_IMPORT
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "FIN_BQ_IMPORT";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "FIN_BQ_IMPORT";
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "FIN_BQ_IMPORT";
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "FIN_BQ_IMPORT";

CREATE POLICY "Enable read access for authenticated users" ON "FIN_BQ_IMPORT"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "FIN_BQ_IMPORT"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "FIN_BQ_IMPORT"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON "FIN_BQ_IMPORT"
  FOR DELETE
  TO authenticated
  USING (true);

-- Mise à jour des politiques RLS pour FIN_BQ_Mouvement
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "FIN_BQ_Mouvement";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "FIN_BQ_Mouvement";
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "FIN_BQ_Mouvement";
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "FIN_BQ_Mouvement";

CREATE POLICY "Enable read access for authenticated users" ON "FIN_BQ_Mouvement"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON "FIN_BQ_Mouvement"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON "FIN_BQ_Mouvement"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON "FIN_BQ_Mouvement"
  FOR DELETE
  TO authenticated
  USING (true);