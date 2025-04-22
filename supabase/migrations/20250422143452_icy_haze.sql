/*
  # Création de la table param_role

  1. Nouvelle Table
    - `param_role`
      - `id` (uuid, clé primaire)
      - `libelle` (varchar(50), nom du rôle)
      - Timestamps standards (created_at, updated_at)

  2. Modification de la table param_collaborateur
    - Ajout de la colonne `role_id` (uuid, clé étrangère vers param_role)
    - Relation ManyToOne entre param_collaborateur et param_role

  3. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

-- Création de la table param_role
CREATE TABLE IF NOT EXISTS param_role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE param_role ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON param_role
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON param_role
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON param_role
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON param_role
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_param_role_updated_at
  BEFORE UPDATE ON param_role
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ajout de la colonne role_id à la table param_collaborateur
ALTER TABLE param_collaborateur
ADD COLUMN role_id uuid REFERENCES param_role(id) ON DELETE SET NULL;

-- Création d'un index sur role_id pour améliorer les performances des jointures
CREATE INDEX idx_param_collaborateur_role_id ON param_collaborateur(role_id);

-- Insérer quelques rôles par défaut
INSERT INTO param_role (libelle) VALUES 
  ('Administrateur'),
  ('Utilisateur'),
  ('Gestionnaire'),
  ('Comptable')
ON CONFLICT DO NOTHING;