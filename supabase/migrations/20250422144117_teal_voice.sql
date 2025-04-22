/*
  # Création de la table param_habilitation

  1. Nouvelle Table
    - `param_habilitation`
      - `id` (uuid, clé primaire)
      - `collaborateur_id` (uuid, clé étrangère vers param_collaborateur)
      - `entite_id` (uuid, clé étrangère vers entite)
      - `date_debut` (date, date de début de l'habilitation)
      - `date_fin` (date, date de fin de l'habilitation, nullable)
      - `niveau_acces` (varchar(20), niveau d'accès: 'lecture', 'ecriture', 'admin')
      - `est_actif` (boolean, statut actif/inactif)
      - Timestamps standards (created_at, updated_at)
      - Contrainte d'unicité sur (collaborateur_id, entite_id)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table param_habilitation
CREATE TABLE IF NOT EXISTS param_habilitation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id uuid NOT NULL REFERENCES param_collaborateur(id) ON DELETE CASCADE,
  entite_id uuid NOT NULL REFERENCES entite(id) ON DELETE CASCADE,
  date_debut date NOT NULL DEFAULT CURRENT_DATE,
  date_fin date,
  niveau_acces varchar(20) NOT NULL CHECK (niveau_acces IN ('lecture', 'ecriture', 'admin')),
  est_actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(collaborateur_id, entite_id)
);

-- Enable RLS
ALTER TABLE param_habilitation ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON param_habilitation
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON param_habilitation
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON param_habilitation
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON param_habilitation
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_param_habilitation_updated_at
  BEFORE UPDATE ON param_habilitation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création d'index pour améliorer les performances des jointures
CREATE INDEX idx_param_habilitation_collaborateur_id ON param_habilitation(collaborateur_id);
CREATE INDEX idx_param_habilitation_entite_id ON param_habilitation(entite_id);