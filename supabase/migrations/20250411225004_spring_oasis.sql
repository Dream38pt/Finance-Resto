/*
  # Création de la table Personnel

  1. Nouvelle Table
    - `personnel`
      - `id` (uuid, clé primaire)
      - `fonction` (varchar(30))
      - `salaire_base` (decimal(10,2))
      - `indemnites_repas` (decimal(10,2))
      - `autres_couts` (decimal(10,2))
      - `nom_prenom` (varchar(40))
      - `date_debut` (date)
      - `date_fin` (date)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Sécurité
    - Activation RLS sur la table personnel
    - Ajout des politiques pour les opérations CRUD
*/

-- Création de la table personnel
CREATE TABLE IF NOT EXISTS personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonction varchar(30) NOT NULL,
  salaire_base decimal(10,2) NOT NULL,
  indemnites_repas decimal(10,2) NOT NULL DEFAULT 0,
  autres_couts decimal(10,2) NOT NULL DEFAULT 0,
  nom_prenom varchar(40) NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Création des politiques de sécurité
CREATE POLICY "Enable read access for authenticated users" ON personnel
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON personnel
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON personnel
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON personnel
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_personnel_updated_at
  BEFORE UPDATE ON personnel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();