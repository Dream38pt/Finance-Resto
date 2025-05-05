/*
  # Création de la table rh_historique_contrat

  1. Nouvelle Table
    - `rh_historique_contrat`
      - `id` (uuid, clé primaire)
      - `personnel_id` (uuid, clé étrangère vers rh_personnel)
      - `date_debut` (date, obligatoire)
      - `date_fin` (date, facultative)
      - `fonction` (varchar, poste occupé pendant la période)
      - `salaire_base` (numeric, salaire brut mensuel)
      - `indemnites_reel` (numeric, indemnités fixes ou variables)
      - `autres_couts` (numeric, coûts supplémentaires)
      - `entite_payeur_id` (uuid, référence à l'entité payeuse)
      - Timestamps standards (created_at, updated_at)

  2. Contraintes
    - Clé étrangère vers rh_personnel avec suppression en cascade
    - Clé étrangère vers entite avec suppression définie sur NULL
    - Contrainte pour empêcher le chevauchement des périodes pour un même employé
    - Valeurs par défaut pour indemnites_reel et autres_couts

  3. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table rh_historique_contrat
CREATE TABLE IF NOT EXISTS rh_historique_contrat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personnel_id uuid NOT NULL REFERENCES rh_personnel(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date,
  fonction varchar(30),
  salaire_base numeric(10,2),
  indemnites_reel numeric(10,2) DEFAULT 0,
  autres_couts numeric(10,2) DEFAULT 0,
  entite_payeur_id uuid REFERENCES entite(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création d'un index sur personnel_id pour améliorer les performances
CREATE INDEX idx_rh_historique_contrat_personnel_id ON rh_historique_contrat(personnel_id);

-- Création d'un index sur entite_payeur_id pour améliorer les performances
CREATE INDEX idx_rh_historique_contrat_entite_payeur_id ON rh_historique_contrat(entite_payeur_id);

-- Création d'une contrainte pour empêcher le chevauchement des périodes
CREATE OR REPLACE FUNCTION check_contract_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier s'il existe un chevauchement pour le même employé
  IF EXISTS (
    SELECT 1 FROM rh_historique_contrat
    WHERE personnel_id = NEW.personnel_id
    AND id != NEW.id  -- Ignorer l'enregistrement en cours de modification
    AND (
      -- Cas 1: La nouvelle période commence pendant une période existante
      (NEW.date_debut >= date_debut AND 
       (date_fin IS NULL OR NEW.date_debut <= date_fin))
      OR
      -- Cas 2: La nouvelle période se termine pendant une période existante
      (NEW.date_fin IS NOT NULL AND NEW.date_fin >= date_debut AND 
       (date_fin IS NULL OR NEW.date_fin <= date_fin))
      OR
      -- Cas 3: La nouvelle période englobe entièrement une période existante
      (NEW.date_debut <= date_debut AND 
       (NEW.date_fin IS NULL OR (date_fin IS NOT NULL AND NEW.date_fin >= date_fin)))
    )
  ) THEN
    RAISE EXCEPTION 'Chevauchement de périodes détecté pour cet employé';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger pour vérifier le chevauchement
CREATE TRIGGER tr_check_contract_overlap
  BEFORE INSERT OR UPDATE ON rh_historique_contrat
  FOR EACH ROW
  EXECUTE FUNCTION check_contract_overlap();

-- Enable RLS
ALTER TABLE rh_historique_contrat ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON rh_historique_contrat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON rh_historique_contrat
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON rh_historique_contrat
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON rh_historique_contrat
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_rh_historique_contrat_updated_at
  BEFORE UPDATE ON rh_historique_contrat
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ajout d'un commentaire sur la table
COMMENT ON TABLE rh_historique_contrat IS 'Historique des conditions contractuelles des employés';