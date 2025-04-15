/*
  # Création de la table BudgetCAMensuel

  1. Nouvelle Table
    - `budget_ca_mensuel`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `annee` (integer)
      - `mois` (integer, entre 1 et 12)
      - `type_service` (varchar(20), valeurs autorisées)
      - `quantite_prevue` (numeric(10,2))
      - `prix_vente_prevu` (numeric(10,2))
      - `jours_ouverts` (integer, >= 0)
      - `ca_previsionnel` (numeric(12,2), calculé automatiquement)
      - timestamps created_at et updated_at

  2. Sécurité
    - Activation RLS
    - Politiques CRUD pour les utilisateurs authentifiés
*/

-- Création de la table budget_ca_mensuel
CREATE TABLE IF NOT EXISTS budget_ca_mensuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  annee integer NOT NULL,
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  type_service varchar(20) NOT NULL CHECK (type_service IN ('petit-déjeuner', 'déjeuner', 'dinner', 'livraison')),
  quantite_prevue numeric(10,2) NOT NULL,
  prix_vente_prevu numeric(10,2) NOT NULL,
  jours_ouverts integer NOT NULL CHECK (jours_ouverts >= 0),
  ca_previsionnel numeric(12,2) GENERATED ALWAYS AS (quantite_prevue * prix_vente_prevu * jours_ouverts) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création d'un index sur les colonnes fréquemment utilisées pour le filtrage
CREATE INDEX idx_budget_ca_mensuel_entite_date 
ON budget_ca_mensuel(entite_id, annee, mois);

-- Activation RLS
ALTER TABLE budget_ca_mensuel ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON budget_ca_mensuel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON budget_ca_mensuel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON budget_ca_mensuel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON budget_ca_mensuel
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_budget_ca_mensuel_updated_at
  BEFORE UPDATE ON budget_ca_mensuel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();