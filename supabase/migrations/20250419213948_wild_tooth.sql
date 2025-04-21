/*
  # Mise à jour des politiques pour la table ca_type_service

  1. Description
    - Vérifie l'existence de la table ca_type_service
    - Supprime les anciennes politiques si elles existent
    - Crée de nouvelles politiques avec les mêmes permissions
    - Met à jour le trigger pour la colonne updated_at
*/

-- Vérification de l'existence de la table
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ca_type_service'
  ) THEN
    -- Suppression des anciennes politiques
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON ca_type_service;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON ca_type_service;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON ca_type_service;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON ca_type_service;

    -- Création des nouvelles politiques
    CREATE POLICY "Enable read access for authenticated users" ON ca_type_service
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Enable insert access for authenticated users" ON ca_type_service
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Enable update access for authenticated users" ON ca_type_service
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Enable delete access for authenticated users" ON ca_type_service
      FOR DELETE
      TO authenticated
      USING (true);

    -- Mise à jour du trigger
    DROP TRIGGER IF EXISTS update_service_ca_updated_at ON ca_type_service;
    
    -- Vérification si le trigger existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_ca_type_service_updated_at'
    ) THEN
      CREATE TRIGGER update_ca_type_service_updated_at
        BEFORE UPDATE ON ca_type_service
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;