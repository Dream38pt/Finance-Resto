/*
  # Amélioration de la fonction get_imports_non_traitees

  1. Description
    - Optimisation de la fonction pour récupérer les imports non traités
    - Ajout d'un index sur la colonne import_bq_id pour améliorer les performances
    - Ajout d'un commentaire explicatif sur la fonction

  2. Changements
    - Recréation de la fonction avec une requête optimisée
    - Utilisation de NOT EXISTS pour une meilleure performance
    - Ajout d'un index sur import_bq_id si nécessaire
*/

-- Recréation de la fonction optimisée
CREATE OR REPLACE FUNCTION get_imports_non_traitees()
RETURNS TABLE (
    id BIGINT,
    import_id UUID,
    companhia TEXT,
    produto TEXT,
    conta TEXT,
    moeda TEXT,
    data_lancamento DATE,
    data_valor DATE,
    descricao TEXT,
    valor NUMERIC,
    saldo NUMERIC,
    referencia_doc TEXT,
    created_at TIMESTAMP,
    nom_fichier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.import_id,
        i.companhia,
        i.produto,
        i.conta,
        i.moeda,
        i.data_lancamento,
        i.data_valor,
        i.descricao,
        i.valor,
        i.saldo,
        i.referencia_doc,
        i.created_at,
        i.nom_fichier
    FROM fin_bq_import i
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "fin_bq_Mouvement" m 
        WHERE m.import_bq_id = i.id
    )
    ORDER BY i.data_valor, i.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajout d'un commentaire sur la fonction
COMMENT ON FUNCTION get_imports_non_traitees() IS 'Récupère les imports bancaires qui n''ont pas encore été traités et convertis en mouvements, triés par date de valeur';

-- Vérification et création d'un index sur import_bq_id si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'fin_bq_mouvement' 
    AND indexname = 'idx_fin_bq_mouvement_import_id'
  ) THEN
    CREATE INDEX idx_fin_bq_mouvement_import_id ON "fin_bq_Mouvement"(import_bq_id);
  END IF;
END $$;