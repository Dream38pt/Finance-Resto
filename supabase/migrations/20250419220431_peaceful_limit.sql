/*
  # Correction de la relation entre budget_ca_mensuel et ca_type_service

  1. Description
    - Corrige la relation entre les tables budget_ca_mensuel et ca_type_service
    - Assure que la clé étrangère pointe correctement vers la table renommée
    - Ajoute un index pour améliorer les performances des requêtes

  2. Changements
    - Suppression de la contrainte de clé étrangère existante si elle existe
    - Création d'une nouvelle contrainte de clé étrangère
    - Ajout d'un index sur la colonne service_ca_id
*/

-- Suppression de la contrainte existante si elle existe
ALTER TABLE budget_ca_mensuel
DROP CONSTRAINT IF EXISTS budget_ca_mensuel_service_ca_id_fkey;

-- Création de la nouvelle contrainte
ALTER TABLE budget_ca_mensuel
ADD CONSTRAINT budget_ca_mensuel_service_ca_id_fkey
FOREIGN KEY (service_ca_id) REFERENCES ca_type_service(id) ON DELETE CASCADE;

-- Ajout d'un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_budget_ca_mensuel_service_ca_id
ON budget_ca_mensuel(service_ca_id);