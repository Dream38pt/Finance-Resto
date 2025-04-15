/*
  # Mise à jour de la table ca_budget_cf

  1. Description
    Cette migration met à jour la table ca_budget_cf pour inclure la relation
    avec les catégories d'achat et assure la cohérence des données.

  2. Changements
    - Vérification et ajout de la colonne categorie_achat_id si nécessaire
    - Vérification et création de l'index si nécessaire
*/

-- Vérification et ajout de la colonne si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ca_budget_cf' 
    AND column_name = 'categorie_achat_id'
  ) THEN
    ALTER TABLE ca_budget_cf
    ADD COLUMN categorie_achat_id uuid REFERENCES fin_categorie_achat(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Vérification et création de l'index s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ca_budget_cf' 
    AND indexname = 'idx_ca_budget_cf_categorie_achat'
  ) THEN
    CREATE INDEX idx_ca_budget_cf_categorie_achat ON ca_budget_cf(categorie_achat_id);
  END IF;
END $$;