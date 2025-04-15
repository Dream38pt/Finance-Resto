/*
  # Ajout du champ entité qui paye au personnel

  1. Modifications
    - Ajout du champ `entite_payeur_id` (uuid) à la table personnel
    - Clé étrangère vers la table entite
    - Nullable car optionnel

  2. Description
    Ce champ permet d'indiquer quelle entité est responsable du paiement du personnel,
    qui peut être différente de l'entité d'affectation
*/

-- Ajout de la colonne entite_payeur_id
ALTER TABLE personnel
ADD COLUMN entite_payeur_id uuid REFERENCES entite(id) ON DELETE SET NULL;