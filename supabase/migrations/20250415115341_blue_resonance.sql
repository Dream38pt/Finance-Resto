/*
  # Ajout de la relation avec les catégories d'achat

  1. Modifications
    - Ajout de la colonne categorie_achat_id (uuid, nullable) à ca_budget_cf
    - Création de la clé étrangère vers fin_categorie_achat
    - Ajout d'un index pour optimiser les performances

  2. Description
    Cette modification permet d'associer optionnellement un coût fixe à une
    catégorie analytique d'achat, tout en préservant la rétrocompatibilité
    avec les enregistrements existants.
*/

-- Ajout de la colonne et de la clé étrangère
ALTER TABLE ca_budget_cf
ADD COLUMN categorie_achat_id uuid REFERENCES fin_categorie_achat(id) ON DELETE SET NULL;

-- Création de l'index pour optimiser les performances
CREATE INDEX idx_ca_budget_cf_categorie_achat ON ca_budget_cf(categorie_achat_id);