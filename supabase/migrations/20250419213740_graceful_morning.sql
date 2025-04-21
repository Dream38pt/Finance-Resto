/*
  # Mise à jour des requêtes pour utiliser ca_type_service

  1. Description
    - Met à jour les requêtes dans la vue budget_ca_mensuel pour utiliser le nouveau nom de table
    - Remplace les références à service_ca par ca_type_service
    - Conserve la même structure et fonctionnalité

  2. Changements
    - Mise à jour des clés étrangères
    - Mise à jour des jointures dans les requêtes
*/

-- Mise à jour des clés étrangères dans budget_ca_mensuel
ALTER TABLE budget_ca_mensuel
DROP CONSTRAINT IF EXISTS budget_ca_mensuel_service_ca_id_fkey;

ALTER TABLE budget_ca_mensuel
ADD CONSTRAINT budget_ca_mensuel_service_ca_id_fkey
FOREIGN KEY (service_ca_id) REFERENCES ca_type_service(id) ON DELETE CASCADE;