/*
  # Création de la table des catégories d'achats

  1. Nouvelle Table
    - `fin_categorie_achat`
      - `id` (uuid, clé primaire)
      - `libelle` (varchar(50), nom de la catégorie)
      - `fait_partie_cout_mp` (boolean, indique si fait partie du coût MP)
      - `ordre_affichage` (integer, pour le tri)
      - `actif` (boolean, statut actif/inactif)
      - timestamps standards (created_at, updated_at)

  2. Sécurité
    - Enable RLS
    - Policies pour les opérations CRUD
*/

CREATE TABLE IF NOT EXISTS fin_categorie_achat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle varchar(50) NOT NULL,
  fait_partie_cout_mp boolean NOT NULL DEFAULT false,
  ordre_affichage integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE fin_categorie_achat ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON fin_categorie_achat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON fin_categorie_achat
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON fin_categorie_achat
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON fin_categorie_achat
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_fin_categorie_achat_updated_at
  BEFORE UPDATE ON fin_categorie_achat
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();