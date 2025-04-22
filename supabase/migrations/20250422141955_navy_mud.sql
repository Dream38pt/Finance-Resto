/*
  # Création de la table param_collaborateur

  1. Nouvelle Table
    - `param_collaborateur`
      - `id` (uuid, clé primaire)
      - `auth_id` (uuid, clé étrangère vers auth.users)
      - `nom` (varchar(50), nom du collaborateur)
      - `prenom` (varchar(50), prénom du collaborateur)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
    - Contrainte d'unicité sur auth_id pour garantir la relation OneToOne
*/

-- Création de la table param_collaborateur
CREATE TABLE IF NOT EXISTS param_collaborateur (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nom varchar(50) NOT NULL,
  prenom varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE param_collaborateur ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON param_collaborateur
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON param_collaborateur
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON param_collaborateur
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON param_collaborateur
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_param_collaborateur_updated_at
  BEFORE UPDATE ON param_collaborateur
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Créer un index sur auth_id pour améliorer les performances des jointures
CREATE INDEX idx_param_collaborateur_auth_id ON param_collaborateur(auth_id);