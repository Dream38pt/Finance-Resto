/*
  # Création de la table de budget CA mensuel

  1. Nouvelle Table
    - `budget_ca_mensuel`
      - `id` (uuid, clé primaire)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `service_ca_id` (uuid, clé étrangère vers service_ca)
      - `annee` (integer)
      - `mois` (integer)
      - `qjp` (numeric(10,2), quantité journalière prévue)
      - `pvjp` (numeric(10,2), prix de vente journalier prévu)
      - `ndj` (integer, nombre de jours, récupéré de ca_param_jours)
      - `cadm` (numeric(12,2), calculé automatiquement)
      - Timestamps standards

  2. Contraintes
    - Clés étrangères vers entite et service_ca
    - Contrainte d'unicité sur (entite_id, service_ca_id, annee, mois)
    - Contraintes de validation sur les valeurs numériques

  3. Sécurité
    - RLS activé
    - Politiques CRUD pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS budget_ca_mensuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  service_ca_id uuid NOT NULL REFERENCES service_ca(id) ON DELETE CASCADE,
  annee integer NOT NULL CHECK (annee >= 1900 AND annee <= 9999),
  mois integer NOT NULL CHECK (mois >= 1 AND mois <= 12),
  qjp numeric(10,2) NOT NULL CHECK (qjp >= 0),
  pvjp numeric(10,2) NOT NULL CHECK (pvjp >= 0),
  ndj integer NOT NULL CHECK (ndj >= 0 AND ndj <= 31),
  cadm numeric(12,2) GENERATED ALWAYS AS (qjp * pvjp * ndj) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entite_id, service_ca_id, annee, mois)
);

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

-- Vue pour calculer les totaux annuels
CREATE OR REPLACE VIEW v_budget_ca_annuel AS
SELECT 
  entite_id,
  service_ca_id,
  annee,
  SUM(cadm) as total_annuel
FROM budget_ca_mensuel
GROUP BY entite_id, service_ca_id, annee;